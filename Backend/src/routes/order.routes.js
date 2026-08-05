import express from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import {
    createOrder,
    getMyOrders,
    getOrderById,
    getSellerOrders,
    updateOrderStatus,
    cancelMyOrder,
} from "../controllers/order.controller.js";

const router = express.Router();

// Private customer endpoints
router.post("/", verifyToken, createOrder);
router.get("/my-orders", verifyToken, getMyOrders);
router.put("/:id/cancel", verifyToken, cancelMyOrder);

// Private seller endpoints
router.get("/all", verifyToken, requireRole("seller", "admin"), getSellerOrders);
router.get("/seller-orders", verifyToken, requireRole("seller", "admin"), getSellerOrders);
router.put("/:id/status", verifyToken, requireRole("seller", "admin"), updateOrderStatus);

// Single order detail
router.get("/:id", verifyToken, getOrderById);

export default router;

