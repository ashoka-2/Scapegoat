import express from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import {
    getAllCoupons,
    getCouponById,
    createCoupon,
    updateCoupon,
    toggleCouponStatus,
    deleteCoupon,
    validateCoupon,
    getActivePublicCoupons,
} from "../controllers/coupon.controller.js";

const couponRouter = express.Router();

// ── Public Customer Endpoints ──
couponRouter.get("/active", getActivePublicCoupons);
couponRouter.post("/validate", validateCoupon);

// ── Admin-Only CRUD Endpoints ──
couponRouter.get("/", verifyToken, requireRole("admin"), getAllCoupons);
couponRouter.post("/", verifyToken, requireRole("admin"), createCoupon);
couponRouter.get("/:id", verifyToken, requireRole("admin"), getCouponById);
couponRouter.put("/:id", verifyToken, requireRole("admin"), updateCoupon);
couponRouter.patch("/:id/toggle", verifyToken, requireRole("admin"), toggleCouponStatus);
couponRouter.delete("/:id", verifyToken, requireRole("admin"), deleteCoupon);

export default couponRouter;
