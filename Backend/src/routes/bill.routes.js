import express from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import { createBill, decideBillChange, deleteSellerBill, getBill, getMyBills, listSellerBills, markBillPaid, requestBillChange, searchBillCustomers, searchSellerCatalog, updateDraftBill } from "../controllers/bill.controller.js";

const router = express.Router();
router.use(verifyToken);
router.get("/my", requireRole("buyer", "seller"), getMyBills);
router.get("/customers", requireRole("seller", "admin"), searchBillCustomers);
router.get("/catalog", requireRole("seller", "admin"), searchSellerCatalog);
router.get("/seller", requireRole("seller", "admin"), listSellerBills);
router.post("/", requireRole("seller", "admin"), createBill);
router.delete("/:id", requireRole("seller", "admin"), deleteSellerBill);
router.get("/:id", requireRole("buyer", "seller", "admin"), getBill);
router.put("/:id", requireRole("seller", "admin"), updateDraftBill);
router.post("/:id/pay", requireRole("seller", "admin"), markBillPaid);
router.post("/:id/change-request", requireRole("seller", "admin"), requestBillChange);
router.post("/:id/change-request/:requestId/decision", requireRole("buyer", "seller"), decideBillChange);

export default router;
