import { Router } from "express";
import {
  createOrUpdateReview,
  getProductReviews,
  getUserReviews,
  deleteReview,
} from "../controllers/review.controller.js";
import { verifyToken, optionalVerifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

// Public: Get reviews for a product
router.get("/product/:productId", optionalVerifyToken, getProductReviews);

// Private: Get reviews submitted by logged-in user
router.get("/user", verifyToken, getUserReviews);

// Private: Create or update a review (Verified buyers)
router.post("/", verifyToken, createOrUpdateReview);

// Private: Delete a review (Author, Admin, Seller)
router.delete("/:id", verifyToken, deleteReview);

export default router;
