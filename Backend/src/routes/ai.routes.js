import { Router } from "express";
import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import { config } from "../config/config.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { checkAiChatQuota, checkAiImageQuota } from "../middlewares/aiQuota.middleware.js";
import {
  getAiQuota,
  precomputeImageEmbedding,
  streamAiChat,
  getAiSessions,
  getAiSessionDetail,
  deleteAiSession,
  addBundleToCartAction,
  addBundleToWishlistAction,
  getReviewInsightsAction,
} from "../controllers/ai.controller.js";

const aiRouter = Router();

/**
 * Optional Auth Middleware: Populates req.user if a valid token is provided,
 * but allows guest users to proceed seamlessly for trial queries.
 */
const optionalAuth = async (req, res, next) => {
  try {
    const bearer =
      req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
        ? req.headers.authorization.slice(7)
        : null;
    const token = req.cookies?.token || bearer;

    if (token) {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      if (decoded?.id) {
        const user = await userModel.findById(decoded.id).select("-password");
        if (user && !user.isBanned) {
          req.user = user;
        }
      }
    }
  } catch {
    // Ignore invalid tokens for optional auth
  }
  next();
};

// ── Quota & Embeddings ────────────────────────────────────────────────────────
aiRouter.get("/quota", optionalAuth, getAiQuota);
aiRouter.post("/embed-image", optionalAuth, checkAiImageQuota, precomputeImageEmbedding);

// ── SSE Chat Streaming (Protected by Daily Quota) ─────────────────────────────
aiRouter.post("/chat/stream", optionalAuth, checkAiChatQuota, streamAiChat);

// ── Persistent Session Threads ────────────────────────────────────────────────
aiRouter.get("/sessions", optionalAuth, getAiSessions);
aiRouter.get("/sessions/:sessionId", optionalAuth, getAiSessionDetail);
aiRouter.delete("/sessions/:sessionId", optionalAuth, deleteAiSession);

// ── Direct Agent Tool Actions ─────────────────────────────────────────────────
aiRouter.post("/action/cart", verifyToken, addBundleToCartAction);
aiRouter.post("/action/wishlist", verifyToken, addBundleToWishlistAction);
aiRouter.get("/action/review-insights/:productId", getReviewInsightsAction);

export default aiRouter;
