import express from "express";
import {
  getWishlist,
  addToWishlist,
  removeFromWishlist,
  toggleWishlist,
  clearWishlist,
} from "../controllers/wishlist.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All wishlist operations require authentication
router.use(verifyToken);

// View user's wishlist
router.get("/", getWishlist);

// Add product to wishlist
router.post("/add", addToWishlist);

// 1-Tap Heart Icon Toggle (Adds if not in wishlist, removes if present)
router.post("/toggle", toggleWishlist);

// Clear entire wishlist
router.delete("/clear", clearWishlist);

// Remove specific product from wishlist
router.delete("/:productId", removeFromWishlist);

export default router;
