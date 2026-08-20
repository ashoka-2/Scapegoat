import { config } from "../config/config.js";
import PushSubscription from "../models/pushSubscription.model.js";
import NotificationLog from "../models/notificationLog.model.js";
import {
    sendPushToSubscription,
    sendPushToUser,
    broadcastPushNotification,
} from "../services/notification.service.js";

/**
 * @desc    Get VAPID Public Key for client subscription
 * @route   GET /api/notifications/vapid-public-key
 * @access  Public
 */
export const getVapidPublicKey = async (req, res) => {
    try {
        return res.status(200).json({
            success: true,
            publicKey: config.VAPID_PUBLIC_KEY,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Subscribe device / browser for Web Push Notifications
 * @route   POST /api/notifications/subscribe
 * @access  Public / Authenticated
 */
export const subscribeDevice = async (req, res) => {
    try {
        const { subscription, userAgent } = req.body;

        if (!subscription || !subscription.endpoint || !subscription.keys) {
            return res.status(400).json({
                success: false,
                message: "Valid push subscription object with endpoint and keys is required.",
            });
        }

        const userId = req.user?._id || null;
        const role = req.user?.role || "buyer";

        const existing = await PushSubscription.findOne({ endpoint: subscription.endpoint });

        if (existing) {
            existing.user = userId;
            existing.role = role;
            existing.keys = subscription.keys;
            existing.userAgent = userAgent || existing.userAgent || "";
            existing.isActive = true;
            await existing.save();

            return res.status(200).json({
                success: true,
                message: "Push subscription refreshed successfully.",
                data: existing,
            });
        }

        const newSub = await PushSubscription.create({
            user: userId,
            endpoint: subscription.endpoint,
            keys: subscription.keys,
            role,
            userAgent: userAgent || "",
            isActive: true,
        });

        return res.status(201).json({
            success: true,
            message: "Subscribed to push notifications successfully.",
            data: newSub,
        });
    } catch (error) {
        console.error("Error subscribing to push notifications:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Unsubscribe device from Push Notifications
 * @route   POST /api/notifications/unsubscribe
 * @access  Public / Authenticated
 */
export const unsubscribeDevice = async (req, res) => {
    try {
        const { endpoint } = req.body;
        if (!endpoint) {
            return res.status(400).json({ success: false, message: "Endpoint is required to unsubscribe." });
        }

        await PushSubscription.findOneAndDelete({ endpoint });

        return res.status(200).json({
            success: true,
            message: "Unsubscribed from push notifications successfully.",
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Admin Broadcast Custom Push Notification
 * @route   POST /api/notifications/admin/broadcast
 * @access  Private (Admin only)
 */
export const adminBroadcast = async (req, res) => {
    try {
        const { title, body, icon, image, url, targetAudience, targetUserId } = req.body;

        if (!title || !body) {
            return res.status(400).json({
                success: false,
                message: "Notification title and body are required.",
            });
        }

        const result = await broadcastPushNotification({
            title: title.trim(),
            body: body.trim(),
            icon: icon || "/icon-192x192.png",
            image: image || null,
            url: url ? url.trim() : "/",
            targetAudience: targetAudience || "all",
            targetUserId: targetUserId || null,
            sentBy: req.user._id,
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: result.error || "Failed to broadcast notification.",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Notification sent to ${result.sentCount} devices (${result.successCount} delivered).`,
            ...result,
        });
    } catch (error) {
        console.error("Admin broadcast error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get sent notifications history and stats
 * @route   GET /api/notifications/admin/history
 * @access  Private (Admin only)
 */
export const getNotificationHistory = async (req, res) => {
    try {
        const { page = 1, limit = 20 } = req.query;
        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [logs, total, totalSubscribers, buyerSubscribers, sellerSubscribers] = await Promise.all([
            NotificationLog.find()
                .populate("sentBy", "fullname email")
                .populate("targetUser", "fullname email")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            NotificationLog.countDocuments(),
            PushSubscription.countDocuments({ isActive: true }),
            PushSubscription.countDocuments({ isActive: true, role: "buyer" }),
            PushSubscription.countDocuments({ isActive: true, role: "seller" }),
        ]);

        return res.status(200).json({
            success: true,
            logs,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            stats: {
                totalSubscribers,
                buyerSubscribers,
                sellerSubscribers,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Send a test notification to Admin's own registered devices
 * @route   POST /api/notifications/admin/test
 * @access  Private (Admin only)
 */
export const sendTestNotification = async (req, res) => {
    try {
        const adminId = req.user._id;
        const result = await sendPushToUser(adminId, {
            title: "🔔 Test Notification from Scapegoat",
            body: "Your web push notification setup is working perfectly on this device!",
            icon: "/icon-192x192.png",
            url: "/admin/notifications",
        });

        if (!result.success || result.sentCount === 0) {
            return res.status(404).json({
                success: false,
                message: "No active push subscription found for your current browser. Please enable push notifications on this device first.",
            });
        }

        return res.status(200).json({
            success: true,
            message: `Test notification sent to ${result.successCount} of your devices!`,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
