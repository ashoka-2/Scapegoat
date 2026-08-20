import express from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import {
    createOrder,
    createRazorpayOrder,
    verifyRazorpayPayment,
    getMyOrders,
    getOrderById,
    getSellerOrders,
    updateOrderStatus,
    updateSellerPayout,
    cancelMyOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

// Private customer endpoints
router.post("/", verifyToken, createOrder);
router.post("/razorpay/create-order", verifyToken, createRazorpayOrder);
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
