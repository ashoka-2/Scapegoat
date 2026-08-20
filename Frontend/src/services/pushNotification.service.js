import customAxios from "../utils/axios";

/**
 * Converts a Base64 VAPID public key into a Uint8Array required by pushManager.subscribe
 */
function urlBase64ToUint8Array(base64String) {
    const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
    const base64 = (base64String + padding).replace(/\-/g, "+").replace(/_/g, "/");
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
        outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
}

/**
 * Checks if the current browser environment supports Service Workers and Push API
 */
export const isPushSupported = () => {
    return (
        typeof window !== "undefined" &&
        "serviceWorker" in navigator &&
        "PushManager" in window &&
        "Notification" in window
    );
};

/**
 * Registers the Service Worker (/sw.js)
 */
export const registerServiceWorker = async () => {
    if (!isPushSupported()) return null;
    try {
        const registration = await navigator.serviceWorker.register("/sw.js", { scope: "/" });
        return registration;
    } catch (err) {
        console.warn("[Push Service Worker Registration Failed]:", err.message);
        return null;
    }
};

/**
 * Gets the current Notification permission state ('granted', 'denied', or 'default')
 */
export const getNotificationPermission = () => {
    if (!isPushSupported()) return "unsupported";
    return Notification.permission;
};

/**
 * Prompts user for notification permission, subscribes device, and syncs token with backend
 */
export const subscribeUserToPush = async () => {
    if (!isPushSupported()) {
        throw new Error("Web Push Notifications are not supported on this browser.");
    }

    // 1. Request permission
    const permission = await Notification.requestPermission();
    if (permission !== "granted") {
        throw new Error(
            permission === "denied"
                ? "Notification permission was blocked. Please enable it in browser site settings."
                : "Notification permission was dismissed."
        );
    }

    // 2. Ensure Service Worker is ready
    const registration = await navigator.serviceWorker.ready;

    // 3. Fetch VAPID Public Key from backend
    const { data: keyData } = await customAxios.get("/api/notifications/vapid-public-key");
    if (!keyData?.publicKey) {
        throw new Error("Failed to retrieve VAPID key from server.");
    }

    const applicationServerKey = urlBase64ToUint8Array(keyData.publicKey);

    // 4. Subscribe to Push Manager
    let subscription = await registration.pushManager.getSubscription();

    if (!subscription) {
        subscription = await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey,
        });
    }

    // 5. Send subscription token to backend database
    const subscriptionPayload = JSON.parse(JSON.stringify(subscription));

    await customAxios.post("/api/notifications/subscribe", {
        subscription: subscriptionPayload,
        userAgent: navigator.userAgent,
    });

    localStorage.setItem("push_notifications_enabled", "true");
    return subscription;
};

/**
 * Unsubscribes current device from Web Push
 */
export const unsubscribeUserFromPush = async () => {
    if (!isPushSupported()) return false;
    try {
        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.getSubscription();
        if (subscription) {
            await customAxios.post("/api/notifications/unsubscribe", {
                endpoint: subscription.endpoint,
            });
            await subscription.unsubscribe();
        }
        localStorage.removeItem("push_notifications_enabled");
        return true;
    } catch (err) {
        console.error("Unsubscribe error:", err);
        return false;
    }
};
