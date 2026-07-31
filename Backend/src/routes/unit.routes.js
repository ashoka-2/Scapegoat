import { Router } from "express";
import {
  getAllUnits,
  createUnit,
  updateUnit,
  deleteUnit,
} from "../controllers/unit.controller.js";
import { verifyToken } from "../middlewares/auth.middleware.js";

const router = Router();

router.get("/", getAllUnits);
router.post("/", verifyToken, createUnit);
router.put("/:id", verifyToken, updateUnit);
router.delete("/:id", verifyToken, deleteUnit);

export default router;
