import express from "express";
import { verifyToken, requireRole } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/upload.middleware.js";
import { cacheRoute } from "../middlewares/cache.middleware.js";
import {
    getActiveBanners,
    getAllBanners,
    getBannerById,
    createBanner,
    updateBanner,
    deleteBanner,
    restoreBanner,
    toggleBannerStatus,
    reorderBanners,
} from "../controllers/banner.controller.js";

const bannerRouter = express.Router();

// ── Public Routes ──
bannerRouter.get("/active", cacheRoute("banners:active", 600), getActiveBanners);

// ── Admin Routes ──
bannerRouter.use(verifyToken, requireRole("admin"));

bannerRouter.get("/", getAllBanners);
bannerRouter.get("/:id", getBannerById);

bannerRouter.post(
    "/",
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "mobileImage", maxCount: 1 },
        { name: "tabletImage", maxCount: 1 },
    ]),
    createBanner
);

bannerRouter.put(
    "/:id",
    upload.fields([
        { name: "image", maxCount: 1 },
        { name: "mobileImage", maxCount: 1 },
        { name: "tabletImage", maxCount: 1 },
    ]),
    updateBanner
);

bannerRouter.delete("/:id", deleteBanner);
bannerRouter.patch("/:id/restore", restoreBanner);
bannerRouter.patch("/:id/toggle", toggleBannerStatus);
bannerRouter.put("/reorder", reorderBanners);

export default bannerRouter;
