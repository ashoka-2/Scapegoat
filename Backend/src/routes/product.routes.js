import express from "express";
import {
  createProduct,
  updateProduct,
  deleteProduct,
  restoreProduct,
  getSingleProduct,
  getProductsByCategory,
  getProductsByBrand,
  getProductsBySeller,
  getSimilarProducts,
  getAllProducts,
} from "../controllers/product.controller.js";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import {
  validateCreateProduct,
  validateUpdateProduct,
} from "../validators/product.validator.js";

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────

// Get all published products (search, filter, sort, paginate)
router.get("/", getAllProducts);

// Get single product by ID or Slug
router.get("/single/:identifier", getSingleProduct);

// Get products by Category (ID or Slug)
router.get("/category/:categoryIdentifier", getProductsByCategory);

// Get products by Brand (ID or Slug)
router.get("/brand/:brandIdentifier", getProductsByBrand);

// Get products by Seller ID (Public caller sees published items, logged-in seller sees all)
router.get("/seller/:sellerId", (req, res, next) => {
  // Optional auth: if cookie token exists, decode user so getProductsBySeller knows if it's the owner
  if (req.cookies && req.cookies.token) {
    return verifyToken(req, res, () => getProductsBySeller(req, res, next));
  }
  return getProductsBySeller(req, res, next);
});

// Get similar products recommendation
router.get("/:id/similar", getSimilarProducts);

// ── Protected Seller / Admin Routes ──────────────────────────────────────────

// Create a new product
router.post(
  "/",
  verifyToken,
  requireRole("seller", "admin"),
  validateCreateProduct,
  createProduct
);

// Update an existing product
router.put(
  "/:id",
  verifyToken,
  requireRole("seller", "admin"),
  validateUpdateProduct,
  updateProduct
);

// Soft delete product (move to trash)
router.delete(
  "/:id",
  verifyToken,
  requireRole("seller", "admin"),
  deleteProduct
);

// Restore product from trash
router.patch(
  "/:id/restore",
  verifyToken,
  requireRole("seller", "admin"),
  restoreProduct
);

export default router;
