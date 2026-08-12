import express from "express";
import jwt from "jsonwebtoken";
import { verifyToken } from "../middlewares/auth.middleware.js";
import userModel from "../models/user.model.js";
import redisClient from "../config/redis.js";
import { config } from "../config/config.js";
import {
  trackView,
  trackDwell,
  trackSearch,
  getRecentlyViewed,
  getForYouProducts,
} from "../controllers/userActivity.controller.js";

const router = express.Router();

/**
 * Optional auth: sets req.user when a VALID token is present; otherwise the
 * request continues anonymously (tracking/recommendations fall back to the
 * visitorId sent by the client). Never rejects.
 */
const optionalAuth = async (req, res, next) => {
  const bearer =
    req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
  const token = req.cookies.token || bearer;

  if (!token) return next();

  try {
    const isBlacklisted = await redisClient.get(`blacklist_${token}`);
    if (isBlacklisted) return next(); // blacklisted → treat as anonymous

    const decoded = jwt.verify(token, config.JWT_SECRET);
    const user = await userModel.findById(decoded.id);
    if (user && !user.isBanned) {
      req.user = user;
    }
  } catch {
    /* invalid token → anonymous */
  }
  return next();
};

// Track a product view (logged-in user OR anonymous visitor via X-Visitor-Id)
router.post("/view", optionalAuth, trackView);

// Track dwell time on a product page (called on unmount)
router.post("/dwell", optionalAuth, trackDwell);

// Track a search the visitor performed (personalization signal)
router.post("/search", optionalAuth, trackSearch);

// Get recently viewed products (ordered by recency)
router.get("/recently-viewed", optionalAuth, getRecentlyViewed);

// Get personalized "For You" recommendations (Instagram-style algorithm)
router.get("/for-you", optionalAuth, getForYouProducts);

export default router;
