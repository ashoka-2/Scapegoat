import express from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import {
    getSettings,
    updateSettings,
    updateAboutSettings,
    updateContactSettings,
    updateFooterSettings,
    updateLegalSettings,
    updatePrivacyPolicy,
    updateReturnPolicy,
    updateTermsOfService,
} from "../controllers/setting.controller.js";

const router = express.Router();

// Public: fetch site settings
router.get("/", getSettings);

// Admin only: update site settings
router.put("/", verifyToken, requireRole("admin"), updateSettings);
router.put("/about", verifyToken, requireRole("admin"), updateAboutSettings);
router.put("/contact", verifyToken, requireRole("admin"), updateContactSettings);
router.put("/footer", verifyToken, requireRole("admin"), updateFooterSettings);
router.put("/legal", verifyToken, requireRole("admin"), updateLegalSettings);
router.put("/legal/privacy", verifyToken, requireRole("admin"), updatePrivacyPolicy);
router.put("/legal/returns", verifyToken, requireRole("admin"), updateReturnPolicy);
router.put("/legal/terms", verifyToken, requireRole("admin"), updateTermsOfService);

export default router;
