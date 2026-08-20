import express from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import { checkoutLimiter } from "../middlewares/rateLimiter.middleware.js";
import {
    createOrder,
    createRazorpayOrder,
    verifyRazorpayPayment,
    handleRazorpayWebhook,
    getMyOrders,
    getOrderById,
    getSellerOrders,
    updateOrderStatus,
    updateSellerPayout,
    cancelMyOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

// Public webhook endpoint (Protected with HMAC SHA-256 signature + Idempotency)
router.post("/razorpay/webhook", handleRazorpayWebhook);

// Private customer endpoints
router.post("/", verifyToken, checkoutLimiter, createOrder);
router.post("/razorpay/create-order", verifyToken, checkoutLimiter, createRazorpayOrder);
router.post("/razorpay/verify", verifyToken, verifyRazorpayPayment);
router.get("/my-orders", verifyToken, getMyOrders);
router.put("/:id/cancel", verifyToken, cancelMyOrder);

// Private seller & admin endpoints
router.get("/all", verifyToken, requireRole("seller", "admin"), getSellerOrders);
router.get("/seller-orders", verifyToken, requireRole("seller", "admin"), getSellerOrders);
router.put("/:id/status", verifyToken, requireRole("seller", "admin"), updateOrderStatus);
router.put("/:id/payout/:sellerId", verifyToken, requireRole("admin"), updateSellerPayout);

// Single order detail
router.get("/:id", verifyToken, getOrderById);

export default router;
