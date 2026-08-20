import webpush from "../config/webPush.js";
import PushSubscription from "../models/pushSubscription.model.js";
import NotificationLog from "../models/notificationLog.model.js";

/**
 * Sends a push notification to a single PushSubscription record.
 * Automatically cleans up expired/unregistered subscriptions (HTTP 410 / 404).
 */
export const sendPushToSubscription = async (subDoc, payload) => {
    if (!subDoc || !subDoc.endpoint || !subDoc.keys) return false;

    const pushSubscription = {
        endpoint: subDoc.endpoint,
        keys: {
            p256dh: subDoc.keys.p256dh,
            auth: subDoc.keys.auth,
        },
    };

    const formattedPayload = JSON.stringify({
        title: payload.title || "Scapegoat",
        body: payload.body || "",
        icon: payload.icon || "/icon-192x192.png",
        badge: payload.badge || "/badge-72x72.png",
        image: payload.image || null,
        data: {
            url: payload.url || "/",
            timestamp: Date.now(),
            ...payload.data,
        },
        actions: payload.actions || [
            { action: "explore", title: "View Details" },
            { action: "close", title: "Dismiss" },
        ],
    });

    try {
        await webpush.sendNotification(pushSubscription, formattedPayload);
        await PushSubscription.findByIdAndUpdate(subDoc._id, { lastNotifiedAt: new Date() });
        return true;
    } catch (err) {
        // If the push endpoint is expired or unsubscribed, delete the stale record
        if (err.statusCode === 410 || err.statusCode === 404 || err.message?.includes("expired")) {
            console.log(`[Web Push] Removing expired subscription endpoint: ${subDoc.endpoint.slice(0, 30)}...`);
            await PushSubscription.findByIdAndDelete(subDoc._id).catch(() => {});
        } else {
            console.warn("[Web Push] Send error:", err.statusCode, err.message);
        }
        return false;
    }
};

/**
 * Sends a push notification to all active devices of a specific user.
 */
export const sendPushToUser = async (userId, payload) => {
    if (!userId) return { success: false, sentCount: 0 };
    try {
        const subscriptions = await PushSubscription.find({
            user: userId,
            isActive: true,
        });

        if (!subscriptions || subscriptions.length === 0) {
            return { success: true, sentCount: 0, message: "User has no registered push devices" };
        }

        const results = await Promise.all(
            subscriptions.map((sub) => sendPushToSubscription(sub, payload))
        );

        const successCount = results.filter(Boolean).length;
        return { success: true, sentCount: subscriptions.length, successCount };
    } catch (error) {
        console.error("[Web Push] sendPushToUser error:", error);
        return { success: false, error: error.message };
    }
};

/**
 * Broadcasts a push notification to an audience segment (All, Buyers, Sellers, or Single User).
 */
export const broadcastPushNotification = async ({
    title,
    body,
    icon,
    image,
    url = "/",
    targetAudience = "all",
    targetUserId = null,
    sentBy = null,
}) => {
    try {
        let query = { isActive: true };

        if (targetAudience === "buyer") {
            query.role = "buyer";
        } else if (targetAudience === "seller") {
            query.role = "seller";
        } else if (targetAudience === "single_user" && targetUserId) {
            query.user = targetUserId;
        }

        const subscriptions = await PushSubscription.find(query);

        if (!subscriptions || subscriptions.length === 0) {
            await NotificationLog.create({
                title,
                body,
                icon,
                image,
                url,
                targetAudience,
                targetUser: targetUserId || null,
                sentBy,
                sentCount: 0,
                successCount: 0,
                failedCount: 0,
                status: "sent",
            });

            return {
                success: true,
                sentCount: 0,
                successCount: 0,
                failedCount: 0,
                message: "No active devices found for this target audience",
            };
        }

        const payload = { title, body, icon, image, url };
        const results = await Promise.allSettled(
            subscriptions.map((sub) => sendPushToSubscription(sub, payload))
        );

        let successCount = 0;
        let failedCount = 0;

        results.forEach((res) => {
            if (res.status === "fulfilled" && res.value === true) {
                successCount++;
            } else {
                failedCount++;
            }
        });

        const status = successCount === subscriptions.length ? "sent" : successCount > 0 ? "partial" : "failed";

        const log = await NotificationLog.create({
            title,
            body,
            icon,
            image,
            url,
            targetAudience,
            targetUser: targetUserId || null,
            sentBy,
            sentCount: subscriptions.length,
            successCount,
            failedCount,
            status,
        });

        return {
            success: true,
            sentCount: subscriptions.length,
            successCount,
            failedCount,
            log,
        };
    } catch (error) {
        console.error("[Web Push Broadcast Error]:", error);
        return {
            success: false,
            error: error.message,
        };
    }
};
