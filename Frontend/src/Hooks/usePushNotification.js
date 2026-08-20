import { useState, useEffect, useCallback } from "react";
import { useDispatch } from "react-redux";
import { addToast } from "../utils/toast.slice.js";
import {
    isPushSupported,
    registerServiceWorker,
    getNotificationPermission,
    subscribeUserToPush,
    unsubscribeUserFromPush,
} from "../services/pushNotification.service.js";

export const usePushNotification = () => {
    const dispatch = useDispatch();
    const [supported, setSupported] = useState(false);
    const [permission, setPermission] = useState("default");
    const [isSubscribed, setIsSubscribed] = useState(false);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const checkStatus = async () => {
            const isSupp = isPushSupported();
            setSupported(isSupp);
            if (!isSupp) return;

            await registerServiceWorker();
            const perm = getNotificationPermission();
            setPermission(perm);

            if (perm === "granted") {
                try {
                    const reg = await navigator.serviceWorker.ready;
                    const sub = await reg.pushManager.getSubscription();
                    setIsSubscribed(Boolean(sub));
                } catch (e) {
                    setIsSubscribed(false);
                }
            } else {
                setIsSubscribed(false);
            }
        };

        checkStatus();
    }, []);

    const enableNotifications = useCallback(async () => {
        setLoading(true);
        try {
            await subscribeUserToPush();
            setIsSubscribed(true);
            setPermission("granted");
            dispatch(
                addToast({
                    message: "🔔 Push Notifications enabled! You'll receive real-time order updates.",
                    type: "success",
                })
            );
            return true;
        } catch (err) {
            console.error("Enable push error:", err);
            dispatch(
                addToast({
                    message: err.message || "Failed to enable notifications. Please check browser permissions.",
                    type: "error",
                })
            );
            return false;
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    const disableNotifications = useCallback(async () => {
        setLoading(true);
        try {
            await unsubscribeUserFromPush();
            setIsSubscribed(false);
            dispatch(
                addToast({
                    message: "Push notifications disabled.",
                    type: "info",
                })
            );
            return true;
        } catch (err) {
            dispatch(
                addToast({
                    message: err.message || "Failed to disable notifications.",
                    type: "error",
                })
            );
            return false;
        } finally {
            setLoading(false);
        }
    }, [dispatch]);

    return {
        supported,
        permission,
        isSubscribed,
        loading,
        enableNotifications,
        disableNotifications,
    };
};
