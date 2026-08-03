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
  getYouMayAlsoLikeProducts,
  getAllProducts,
  aiSearchProducts,
  aiImageSearchProducts,
  suggestProductDescription,
} from "../controllers/product.controller.js";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import {
  validateCreateProduct,
  validateUpdateProduct,
} from "../validators/product.validator.js";

const router = express.Router();

// ── Public Routes ─────────────────────────────────────────────────────────────

// Get all published products (search, filter, sort, paginate)
router.get("/", getAllProducts);

// Suggest catalog description based on title, category, and shortDescription
router.post("/suggest-description", suggestProductDescription);

// AI Smart Hybrid Search (Natural text prompt & keyword matching)
router.get("/search/ai", aiSearchProducts);

// AI Visual Photo Search (Camera photo upload / Google Lens style)
router.post("/search/visual", upload.array("images", 1), aiImageSearchProducts);

// Get single product by ID or Slug (with optional token verification so sellers can edit drafts)
router.get("/single/:identifier", (req, res, next) => {
  if (req.cookies && req.cookies.token) {
    return verifyToken(req, res, () => getSingleProduct(req, res, next));
  }
  return getSingleProduct(req, res, next);
});

// Get products by Category (ID or Slug)
router.get("/category/:categoryIdentifier", getProductsByCategory);

// Get products by Brand (ID or Slug)
router.get("/brand/:brandIdentifier", getProductsByBrand);

// Get products by Seller ID (Public caller sees published items, logged-in seller sees all)
router.get("/seller/:sellerId", (req, res, next) => {
  if (req.cookies && req.cookies.token) {
    return verifyToken(req, res, () => getProductsBySeller(req, res, next));
  }
  return getProductsBySeller(req, res, next);
});

// Get similar / "You May Also Like" product recommendations (AI Vector Similarity + Multi-Seller boost)
router.get("/:id/similar", getSimilarProducts);
router.get("/:id/you-may-also-like", getYouMayAlsoLikeProducts);

// ── Protected Seller / Admin Routes ──────────────────────────────────────────

// Create a new product (supports up to 7 image uploads)
router.post(
  "/",
  verifyToken,
  requireRole("seller", "admin"),
  upload.array("images", 7),
  validateCreateProduct,
  createProduct
);

// Update an existing product (supports up to 7 image uploads)
router.put(
  "/:id",
  verifyToken,
  requireRole("seller", "admin"),
  upload.array("images", 7),
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
