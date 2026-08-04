import express from "express";
import {
  getCart,
  addToCart,
  updateQuantity,
  removeFromCart,
  clearCart,
} from "../controllers/cart.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = express.Router();

// All cart operations require authentication
router.use(verifyToken);

// View user's cart
router.get("/", getCart);

// Add product/variant to cart
router.post("/add", addToCart);

// Update quantity (typed integer, incremented, or decremented value)
router.put("/item/:itemId", updateQuantity);

// Remove specific item from cart
router.delete("/item/:itemId", removeFromCart);

// Clear entire cart
router.delete("/clear", clearCart);

export default router;
