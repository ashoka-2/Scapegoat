import { Router } from "express";
import {
  getAllBrands,
  createBrand,
  updateBrand,
  deleteBrand,
} from "../controllers/brand.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getAllBrands);
router.post("/", verifyToken, createBrand);
router.put("/:id", verifyToken, updateBrand);
router.delete("/:id", verifyToken, deleteBrand);

export default router;
