import express from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import {
  getDashboardStats,
  getAllUsers,
  getUserById,
  updateUserRole,
  toggleBanUser,
  getAllProductsAdmin,
  getProductDetailAdmin,
  getAllOrdersAdmin,
  getAllMessages,
  markMessageRead,
  deleteMessage,
} from "../controllers/admin.controller.js";

const adminRouter = express.Router();

// Enforce admin authentication on all routes below
adminRouter.use(verifyToken, requireRole("admin"));

// Dashboard & Analytics
adminRouter.get("/dashboard", getDashboardStats);

// User Management
adminRouter.get("/users", getAllUsers);
adminRouter.get("/users/:id", getUserById);
adminRouter.put("/users/:id/role", updateUserRole);
adminRouter.put("/users/:id/ban", toggleBanUser);

// Product Management
adminRouter.get("/products", getAllProductsAdmin);
adminRouter.get("/products/:id", getProductDetailAdmin);

// Order Management
adminRouter.get("/orders", getAllOrdersAdmin);

// Message / Inbox Management
adminRouter.get("/messages", getAllMessages);
adminRouter.put("/messages/:id/read", markMessageRead);
adminRouter.delete("/messages/:id", deleteMessage);

export default adminRouter;
