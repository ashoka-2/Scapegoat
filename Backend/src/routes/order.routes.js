import express from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import {
    createOrder,
    getMyOrders,
    getOrderById,
    getSellerOrders,
    updateOrderStatus,
} from "../controllers/order.controller.js";

const router = express.Router();

// Private customer endpoints
router.post("/", verifyToken, createOrder);
router.get("/my-orders", verifyToken, getMyOrders);

// Private seller endpoints
router.get("/seller-orders", verifyToken, requireRole("seller", "admin"), getSellerOrders);
router.put("/:id/status", verifyToken, requireRole("seller", "admin"), updateOrderStatus);

// Single order detail
router.get("/:id", verifyToken, getOrderById);

export default router;
