import express from "express";
import {
  getCart,
  addToCart,
  incrementQuantity,
  decrementQuantity,
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

// Add product/variant to cart (with custom quantity or default 1)
router.post("/add", addToCart);

// Increment quantity (+1)
router.patch("/item/:itemId/increment", incrementQuantity);

// Decrement quantity (-1)
router.patch("/item/:itemId/decrement", decrementQuantity);

// Manually update quantity to a typed integer value (e.g. 5, 10)
router.put("/item/:itemId", updateQuantity);

// Remove specific item from cart
router.delete("/item/:itemId", removeFromCart);

// Clear entire cart
router.delete("/clear", clearCart);

export default router;
