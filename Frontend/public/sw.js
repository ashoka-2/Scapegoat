// ══════════════════════════════════════════════════════════════════════════════
// SCAPEGOAT SERVICE WORKER — WEB PUSH NOTIFICATIONS & OFFLINE CACHING
// ══════════════════════════════════════════════════════════════════════════════

self.addEventListener("install", (event) => {
    self.skipWaiting();
});

self.addEventListener("activate", (event) => {
    event.waitUntil(self.clients.claim());
});

// 1. Push Event Listener (Incoming Push Notification from Server)
self.addEventListener("push", (event) => {
    let data = {};
    if (event.data) {
        try {
            data = event.data.json();
        } catch (e) {
            data = { title: "Scapegoat Alert", body: event.data.text() };
        }
    }

    const title = data.title || "Scapegoat Alert";
    const options = {
        body: data.body || "",
        icon: data.icon || "/favicon.ico",
        badge: data.badge || "/favicon.ico",
        image: data.image || undefined,
        data: {
            url: data.data?.url || data.url || "/",
            timestamp: data.data?.timestamp || Date.now(),
        },
        vibrate: [200, 100, 200],
        requireInteraction: true,
        tag: data.tag || `scapegoat-notification-${Date.now()}`,
        actions: data.actions || [
            { action: "explore", title: "View Details" },
            { action: "close", title: "Dismiss" },
        ],
    };

    event.waitUntil(self.registration.showNotification(title, options));
});

// 2. Notification Click Listener (User clicks notification -> Opens Target Page)
self.addEventListener("notificationclick", (event) => {
    event.notification.close();

    if (event.action === "close") {
        return;
    }

    const targetUrl = event.notification.data?.url || "/";

    event.waitUntil(
        clients.matchAll({ type: "window", includeUncontrolled: true }).then((clientList) => {
            // If website is already open in any tab, focus it and navigate
            for (const client of clientList) {
                if (client.url && "focus" in client) {
                    client.focus();
                    if ("navigate" in client) {
                        return client.navigate(targetUrl);
                    }
                    return client;
                }
            }
            // If website tab is closed, open a fresh window to the target page
            if (clients.openWindow) {
                return clients.openWindow(targetUrl);
            }
        })
    );
});
