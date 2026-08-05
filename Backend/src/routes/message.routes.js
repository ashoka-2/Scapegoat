import express from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import { createMessage, getMessages, markAsRead, deleteMessage } from "../controllers/message.controller.js";

const router = express.Router();

// Public: submit contact form or newsletter
router.post("/", createMessage);

// Admin only
router.get("/", verifyToken, requireRole("admin"), getMessages);
router.put("/:id/read", verifyToken, requireRole("admin"), markAsRead);
router.delete("/:id", verifyToken, requireRole("admin"), deleteMessage);

export default router;
