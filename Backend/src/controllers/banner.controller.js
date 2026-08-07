import bannerModel from "../models/banner.model.js";
import { uploadFile, deleteFile } from "../services/imageKit.service.js";
import { broadcastUpdate } from "../services/socket.service.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

/**
 * Upload a single image buffer to ImageKit and return { url, fileId }
 */
const uploadBannerImage = async (fileBuffer, filename, folder = "banners") => {
    const result = await uploadFile({
        file: fileBuffer,
        filename,
        folder,
    });
    return { url: result.url, fileId: result.fileId };
};

/**
 * Delete an ImageKit file by fileId (silent on failure)
 */
const cleanupImage = async (fileId) => {
    if (fileId) {
        try {
            await deleteFile(fileId);
        } catch (err) {
            console.error("Failed to cleanup ImageKit file:", fileId, err.message);
        }
    }
};

/**
 * Build a Mongo filter for "currently active" banners
 */
const buildActiveFilter = (placement, page) => {
    const now = new Date();
    const filter = {
        isActive: true,
        isDeleted: false,
        isDraft: { $ne: true },
        $or: [
            { startDate: null, endDate: null },
            { startDate: { $lte: now }, endDate: null },
            { startDate: null, endDate: { $gte: now } },
            { startDate: { $lte: now }, endDate: { $gte: now } },
        ],
    };
    if (placement) filter.placement = placement;
    if (page) filter.targetPages = page;
    return filter;
};

// ─── Public Endpoints ───────────────────────────────────────────────────────

/**
 * GET /api/banners/active?placement=hero&page=home
 * Public — fetch currently active banners filtered by placement and page
 */
export const getActiveBanners = async (req, res) => {
    try {
        const { placement, page } = req.query;
        const filter = buildActiveFilter(placement, page);
        const banners = await bannerModel
            .find(filter)
            .sort({ position: 1, createdAt: -1 })
            .lean();
        res.status(200).json({ success: true, banners });
    } catch (error) {
        console.error("getActiveBanners error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch banners" });
    }
};

// ─── Admin Endpoints ────────────────────────────────────────────────────────

/**
 * GET /api/banners?placement=hero&status=active&page=1&limit=20&trash=false
 * Admin — list all banners with filters and pagination
 */
export const getAllBanners = async (req, res) => {
    try {
        const {
            placement,
            status,
            page = 1,
            limit = 20,
            trash = "false",
            search,
        } = req.query;

        const filter = {};
        filter.isDeleted = trash === "true";

        if (placement) filter.placement = placement;
        if (search) {
            filter.$or = [
                { title: { $regex: search, $options: "i" } },
                { subtitle: { $regex: search, $options: "i" } },
            ];
        }

        const now = new Date();
        if (status === "draft") {
            filter.isDraft = true;
        } else if (status === "active") {
            filter.isActive = true;
            filter.isDraft = { $ne: true };
        } else if (status === "inactive") {
            filter.isActive = false;
            filter.isDraft = { $ne: true };
        } else if (status === "scheduled") {
            filter.isActive = true;
            filter.isDraft = { $ne: true };
            filter.startDate = { $gt: now };
        } else if (status === "expired") {
            filter.endDate = { $lt: now };
            filter.isDraft = { $ne: true };
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);
        const [banners, total] = await Promise.all([
            bannerModel
                .find(filter)
                .sort({ position: 1, createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .populate("createdBy", "fullname email profilePic")
                .lean(),
            bannerModel.countDocuments(filter),
        ]);

        res.status(200).json({
            success: true,
            banners,
            pagination: {
                total,
                page: parseInt(page),
                limit: parseInt(limit),
                totalPages: Math.ceil(total / parseInt(limit)),
            },
        });
    } catch (error) {
        console.error("getAllBanners error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch banners" });
    }
};

/**
 * GET /api/banners/:id
 * Admin — get single banner detail
 */
export const getBannerById = async (req, res) => {
    try {
        const banner = await bannerModel
            .findById(req.params.id)
            .populate("createdBy", "fullname email profilePic")
            .lean();

        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }
        res.status(200).json({ success: true, banner });
    } catch (error) {
        console.error("getBannerById error:", error);
        res.status(500).json({ success: false, message: "Failed to fetch banner" });
    }
};

/**
 * POST /api/banners
 * Admin — create a new banner with image upload
 */
export const createBanner = async (req, res) => {
    try {
        const {
            title,
            subtitle,
            link,
            buttonText,
            placement,
            position,
            targetPages,
            deviceTargets,
            altText,
            backgroundColor,
            dismissible,
            popupDelay,
            autoCloseSeconds,
            showTimesPerDay,
            isActive,
            isDraft,
            startDate,
            endDate,
            buttons,
            textOverlays,
            timerOverlay,
            elements,
            canvasWidth,
            canvasHeight,
            aspectRatio,
        } = req.body;

        if (!title) {
            return res.status(400).json({ success: false, message: "Title is required" });
        }

        // Handle image uploads
        const files = req.files || {};
        let imageData = { url: null, fileId: null };
        let mobileImageData = { url: null, fileId: null };
        let tabletImageData = { url: null, fileId: null };

        if (files.image && files.image[0]) {
            imageData = await uploadBannerImage(
                files.image[0].buffer,
                `banner_${Date.now()}_desktop`,
                "banners"
            );
        } else {
            return res.status(400).json({ success: false, message: "Banner image is required" });
        }

        if (files.mobileImage && files.mobileImage[0]) {
            mobileImageData = await uploadBannerImage(
                files.mobileImage[0].buffer,
                `banner_${Date.now()}_mobile`,
                "banners/mobile"
            );
        }

        if (files.tabletImage && files.tabletImage[0]) {
            tabletImageData = await uploadBannerImage(
                files.tabletImage[0].buffer,
                `banner_${Date.now()}_tablet`,
                "banners/tablet"
            );
        }

        // Parse JSON fields
        let parsedButtons = [];
        if (buttons) {
            try {
                parsedButtons = typeof buttons === "string" ? JSON.parse(buttons) : buttons;
            } catch (e) {
                parsedButtons = [];
            }
        }

        let parsedTextOverlays = [];
        if (textOverlays) {
            try {
                parsedTextOverlays = typeof textOverlays === "string" ? JSON.parse(textOverlays) : textOverlays;
            } catch (e) {
                parsedTextOverlays = [];
            }
        }

        let parsedTimerOverlay = {};
        if (timerOverlay) {
            try {
                parsedTimerOverlay = typeof timerOverlay === "string" ? JSON.parse(timerOverlay) : timerOverlay;
            } catch (e) {
                parsedTimerOverlay = {};
            }
        }

        let parsedTargetPages = ["home"];
        if (targetPages) {
            try {
                parsedTargetPages = typeof targetPages === "string" ? JSON.parse(targetPages) : targetPages;
            } catch (e) {
                parsedTargetPages = ["home"];
            }
        }

        let parsedDeviceTargets = [];
        if (deviceTargets) {
            try {
                parsedDeviceTargets = typeof deviceTargets === "string" ? JSON.parse(deviceTargets) : deviceTargets;
            } catch (e) {
                parsedDeviceTargets = [];
            }
        }

        const banner = await bannerModel.create({
            title,
            subtitle: subtitle || "",
            image: imageData.url,
            imageId: imageData.fileId,
            mobileImage: mobileImageData.url,
            mobileImageId: mobileImageData.fileId,
            tabletImage: tabletImageData.url,
            tabletImageId: tabletImageData.fileId,
            link: link || "#",
            buttonText: buttonText || "Shop Now",
            placement: placement || "hero",
            position: position ? parseInt(position) : 0,
            targetPages: parsedTargetPages,
            deviceTargets: parsedDeviceTargets,
            altText: altText || "Promotional banner",
            backgroundColor: backgroundColor || null,
            dismissible: dismissible !== undefined ? dismissible === "true" || dismissible === true : true,
            popupDelay: popupDelay ? parseInt(popupDelay) : 3,
            autoCloseSeconds: autoCloseSeconds ? parseInt(autoCloseSeconds) : 0,
            showTimesPerDay: showTimesPerDay ? parseInt(showTimesPerDay) : 1,
            isActive: isActive !== undefined ? isActive === "true" || isActive === true : true,
            isDraft: isDraft !== undefined ? isDraft === "true" || isDraft === true : false,
            startDate: startDate || null,
            endDate: endDate || null,
            buttons: parsedButtons,
            textOverlays: parsedTextOverlays,
            timerOverlay: parsedTimerOverlay,
            elements: elements ? (typeof elements === "string" ? JSON.parse(elements) : elements) : [],
            canvasWidth: canvasWidth ? parseInt(canvasWidth) : 1200,
            canvasHeight: canvasHeight ? parseInt(canvasHeight) : 500,
            aspectRatio: aspectRatio || "21:9",
            createdBy: req.user._id,
        });

        const populated = await bannerModel
            .findById(banner._id)
            .populate("createdBy", "fullname email profilePic")
            .lean();

        // Broadcast real-time update to all clients
        broadcastUpdate("BANNER_CREATED", populated);

        res.status(201).json({ success: true, message: "Banner created successfully", banner: populated });
    } catch (error) {
        console.error("createBanner error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to create banner" });
    }
};

/**
 * PUT /api/banners/:id
 * Admin — update an existing banner
 */
export const updateBanner = async (req, res) => {
    try {
        const banner = await bannerModel.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        const {
            title,
            subtitle,
            link,
            buttonText,
            placement,
            position,
            targetPages,
            deviceTargets,
            altText,
            backgroundColor,
            dismissible,
            popupDelay,
            autoCloseSeconds,
            showTimesPerDay,
            isActive,
            isDraft,
            startDate,
            endDate,
            buttons,
            textOverlays,
            timerOverlay,
            elements,
            canvasWidth,
            canvasHeight,
            aspectRatio,
        } = req.body;

        // Handle image replacements
        const files = req.files || {};

        if (files.image && files.image[0]) {
            // Cleanup old desktop image
            await cleanupImage(banner.imageId);
            const imageData = await uploadBannerImage(
                files.image[0].buffer,
                `banner_${Date.now()}_desktop`,
                "banners"
            );
            banner.image = imageData.url;
            banner.imageId = imageData.fileId;
        }

        if (files.mobileImage && files.mobileImage[0]) {
            await cleanupImage(banner.mobileImageId);
            const mobileData = await uploadBannerImage(
                files.mobileImage[0].buffer,
                `banner_${Date.now()}_mobile`,
                "banners/mobile"
            );
            banner.mobileImage = mobileData.url;
            banner.mobileImageId = mobileData.fileId;
        }

        if (files.tabletImage && files.tabletImage[0]) {
            await cleanupImage(banner.tabletImageId);
            const tabletData = await uploadBannerImage(
                files.tabletImage[0].buffer,
                `banner_${Date.now()}_tablet`,
                "banners/tablet"
            );
            banner.tabletImage = tabletData.url;
            banner.tabletImageId = tabletData.fileId;
        }

        // Update text fields
        if (title !== undefined) banner.title = title;
        if (subtitle !== undefined) banner.subtitle = subtitle;
        if (link !== undefined) banner.link = link;
        if (buttonText !== undefined) banner.buttonText = buttonText;
        if (placement !== undefined) banner.placement = placement;
        if (position !== undefined) banner.position = parseInt(position);
        if (altText !== undefined) banner.altText = altText;
        if (backgroundColor !== undefined) banner.backgroundColor = backgroundColor;
        if (elements !== undefined) banner.elements = typeof elements === "string" ? JSON.parse(elements) : elements;
        if (canvasWidth !== undefined) banner.canvasWidth = parseInt(canvasWidth);
        if (canvasHeight !== undefined) banner.canvasHeight = parseInt(canvasHeight);
        if (aspectRatio !== undefined) banner.aspectRatio = aspectRatio;
        if (dismissible !== undefined) banner.dismissible = dismissible === "true" || dismissible === true;
        if (popupDelay !== undefined) banner.popupDelay = parseInt(popupDelay);
        if (autoCloseSeconds !== undefined) banner.autoCloseSeconds = parseInt(autoCloseSeconds);
        if (showTimesPerDay !== undefined) banner.showTimesPerDay = parseInt(showTimesPerDay);
        if (isActive !== undefined) banner.isActive = isActive === "true" || isActive === true;
        if (isDraft !== undefined) banner.isDraft = isDraft === "true" || isDraft === true;
        if (startDate !== undefined) banner.startDate = startDate || null;
        if (endDate !== undefined) banner.endDate = endDate || null;

        if (buttons !== undefined) {
            try {
                banner.buttons = typeof buttons === "string" ? JSON.parse(buttons) : buttons;
            } catch (e) {}
        }

        if (textOverlays !== undefined) {
            try {
                banner.textOverlays = typeof textOverlays === "string" ? JSON.parse(textOverlays) : textOverlays;
            } catch (e) {}
        }

        if (timerOverlay !== undefined) {
            try {
                banner.timerOverlay = typeof timerOverlay === "string" ? JSON.parse(timerOverlay) : timerOverlay;
            } catch (e) {}
        }

        if (targetPages !== undefined) {
            try {
                banner.targetPages = typeof targetPages === "string" ? JSON.parse(targetPages) : targetPages;
            } catch (e) {
                // keep existing
            }
        }

        if (deviceTargets !== undefined) {
            try {
                banner.deviceTargets = typeof deviceTargets === "string" ? JSON.parse(deviceTargets) : deviceTargets;
            } catch (e) {
                // keep existing
            }
        }

        await banner.save();

        const populated = await bannerModel
            .findById(banner._id)
            .populate("createdBy", "fullname email profilePic")
            .lean();

        broadcastUpdate("BANNER_UPDATED", populated);

        res.status(200).json({ success: true, message: "Banner updated successfully", banner: populated });
    } catch (error) {
        console.error("updateBanner error:", error);
        res.status(500).json({ success: false, message: error.message || "Failed to update banner" });
    }
};

/**
 * DELETE /api/banners/:id?permanent=false
 * Admin — soft delete (move to trash) or permanent delete (cleanup ImageKit)
 */
export const deleteBanner = async (req, res) => {
    try {
        const { permanent } = req.query;
        const banner = await bannerModel.findById(req.params.id);

        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        if (permanent === "true") {
            // Permanent delete — cleanup all ImageKit files
            await Promise.all([
                cleanupImage(banner.imageId),
                cleanupImage(banner.mobileImageId),
                cleanupImage(banner.tabletImageId),
            ]);
            await bannerModel.findByIdAndDelete(req.params.id);
            broadcastUpdate("BANNER_DELETED", { _id: req.params.id });
            return res.status(200).json({ success: true, message: "Banner permanently deleted" });
        }

        // Soft delete — move to trash
        banner.isDeleted = true;
        banner.isActive = false;
        banner.deletedAt = new Date();
        await banner.save();

        broadcastUpdate("BANNER_TRASHED", { _id: req.params.id });

        res.status(200).json({ success: true, message: "Banner moved to trash" });
    } catch (error) {
        console.error("deleteBanner error:", error);
        res.status(500).json({ success: false, message: "Failed to delete banner" });
    }
};

/**
 * PATCH /api/banners/:id/restore
 * Admin — restore a trashed banner
 */
export const restoreBanner = async (req, res) => {
    try {
        const banner = await bannerModel.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        banner.isDeleted = false;
        banner.deletedAt = null;
        await banner.save();

        const populated = await bannerModel
            .findById(banner._id)
            .populate("createdBy", "fullname email profilePic")
            .lean();

        broadcastUpdate("BANNER_RESTORED", populated);

        res.status(200).json({ success: true, message: "Banner restored from trash", banner: populated });
    } catch (error) {
        console.error("restoreBanner error:", error);
        res.status(500).json({ success: false, message: "Failed to restore banner" });
    }
};

/**
 * PATCH /api/banners/:id/toggle
 * Admin — toggle isActive on/off
 */
export const toggleBannerStatus = async (req, res) => {
    try {
        const banner = await bannerModel.findById(req.params.id);
        if (!banner) {
            return res.status(404).json({ success: false, message: "Banner not found" });
        }

        banner.isActive = !banner.isActive;
        await banner.save();

        broadcastUpdate("BANNER_TOGGLED", { _id: banner._id, isActive: banner.isActive });

        res.status(200).json({
            success: true,
            message: `Banner ${banner.isActive ? "activated" : "deactivated"}`,
            isActive: banner.isActive,
        });
    } catch (error) {
        console.error("toggleBannerStatus error:", error);
        res.status(500).json({ success: false, message: "Failed to toggle banner status" });
    }
};

/**
 * PUT /api/banners/reorder
 * Admin — batch update banner positions
 * Body: { banners: [{ _id, position }] }
 */
export const reorderBanners = async (req, res) => {
    try {
        const { banners } = req.body;
        if (!Array.isArray(banners)) {
            return res.status(400).json({ success: false, message: "banners array is required" });
        }

        const bulkOps = banners.map(({ _id, position }) => ({
            updateOne: {
                filter: { _id },
                update: { position },
            },
        }));

        await bannerModel.bulkWrite(bulkOps);

        broadcastUpdate("BANNERS_REORDERED", {});

        res.status(200).json({ success: true, message: "Banners reordered successfully" });
    } catch (error) {
        console.error("reorderBanners error:", error);
        res.status(500).json({ success: false, message: "Failed to reorder banners" });
    }
};
