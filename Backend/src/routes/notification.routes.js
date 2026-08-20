import express from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import {
    getVapidPublicKey,
    subscribeDevice,
    unsubscribeDevice,
    adminBroadcast,
    getNotificationHistory,
    sendTestNotification,
} from "../controllers/notification.controller.js";

const notificationRouter = express.Router();

// Optional token middleware for subscribe (works for guests & logged-in users)
const optionalVerifyToken = (req, res, next) => {
    if (req.cookies && req.cookies.token) {
        return verifyToken(req, res, next);
    }
    next();
};

// ── Public / Client Endpoints ──
notificationRouter.get("/vapid-public-key", getVapidPublicKey);
notificationRouter.post("/subscribe", optionalVerifyToken, subscribeDevice);
notificationRouter.post("/unsubscribe", unsubscribeDevice);

// ── Admin-Only Broadcast & Stats Endpoints ──
notificationRouter.post("/admin/broadcast", verifyToken, requireRole("admin"), adminBroadcast);
notificationRouter.get("/admin/history", verifyToken, requireRole("admin"), getNotificationHistory);
notificationRouter.post("/admin/test", verifyToken, requireRole("admin"), sendTestNotification);

export default notificationRouter;
