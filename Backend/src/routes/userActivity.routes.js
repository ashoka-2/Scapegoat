import express from "express";
import { verifyToken } from "../middlewares/auth.middleware.js";
import {
  trackView,
  trackDwell,
  getRecentlyViewed,
  getForYouProducts,
} from "../controllers/userActivity.controller.js";

const router = express.Router();

// All activity routes require authentication
router.use(verifyToken);

// Track a product view (called from SingleProduct page)
router.post("/view", trackView);

// Track dwell time on a product page (called on unmount)
router.post("/dwell", trackDwell);

// Get recently viewed products (ordered by recency)
router.get("/recently-viewed", getRecentlyViewed);

// Get personalized "For You" recommendations (Instagram-style algorithm)
router.get("/for-you", getForYouProducts);

export default router;
