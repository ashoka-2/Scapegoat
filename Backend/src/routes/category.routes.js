import { Router } from "express";
import {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../controllers/category.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";
import { cacheRoute } from "../middlewares/cache.middleware.js";

const router = Router();

router.get("/", cacheRoute("categories", 900), getAllCategories);
router.get("/:id", cacheRoute("categories", 900), getCategoryById);
router.post("/", verifyToken, createCategory);
router.put("/:id", verifyToken, updateCategory);
router.delete("/:id", verifyToken, deleteCategory);

export default router;
