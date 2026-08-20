import couponModel from "../models/coupon.model.js";

/**
 * @desc    Get all coupons (Admin)
 * @route   GET /api/coupons
 * @access  Private (Admin only)
 */
export const getAllCoupons = async (req, res) => {
    try {
        const { search, type, status, page = 1, limit = 20 } = req.query;
        const query = {};

        if (search) {
            query.$or = [
                { code: { $regex: search, $options: "i" } },
                { description: { $regex: search, $options: "i" } },
            ];
        }

        if (type && ["fixed", "tiered"].includes(type)) {
            query.couponType = type;
        }

        if (status === "active") {
            query.isActive = true;
            query.endDate = { $gte: new Date() };
        } else if (status === "expired") {
            query.endDate = { $lt: new Date() };
        } else if (status === "disabled") {
            query.isActive = false;
        }

        const skip = (parseInt(page) - 1) * parseInt(limit);

        const [coupons, total, activeCount, tieredCount, fixedCount] = await Promise.all([
            couponModel.find(query)
                .populate("applicableCategories", "name")
                .populate("applicableProducts", "title")
                .sort({ createdAt: -1 })
                .skip(skip)
                .limit(parseInt(limit))
                .lean(),
            couponModel.countDocuments(query),
            couponModel.countDocuments({ isActive: true, endDate: { $gte: new Date() } }),
            couponModel.countDocuments({ couponType: "tiered" }),
            couponModel.countDocuments({ couponType: "fixed" }),
        ]);

        return res.status(200).json({
            success: true,
            coupons,
            total,
            page: parseInt(page),
            pages: Math.ceil(total / limit),
            stats: {
                totalCoupons: total,
                activeCoupons: activeCount,
                tieredCoupons: tieredCount,
                fixedCoupons: fixedCount,
            },
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get single coupon by ID
 * @route   GET /api/coupons/:id
 * @access  Private (Admin only)
 */
export const getCouponById = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await couponModel.findById(id)
            .populate("applicableCategories", "name")
            .populate("applicableProducts", "title");

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }

        return res.status(200).json({ success: true, coupon });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Create a new coupon
 * @route   POST /api/coupons
 * @access  Private (Admin only)
 */
export const createCoupon = async (req, res) => {
    try {
        const {
            code,
            description,
            couponType = "fixed",
            discountType,
            discountValue,
            maxDiscount,
            tiers,
            minPurchase = 0,
            usageLimit,
            perUserLimit = 1,
            startDate,
            endDate,
            isActive = true,
            applicableCategories = [],
            applicableProducts = [],
        } = req.body;

        if (!code || !startDate || !endDate) {
            return res.status(400).json({
                success: false,
                message: "Coupon code, start date, and end date are required.",
            });
        }

        const normalizedCode = code.trim().toUpperCase();

        const existing = await couponModel.findOne({ code: normalizedCode });
        if (existing) {
            return res.status(400).json({
                success: false,
                message: `Coupon code "${normalizedCode}" already exists.`,
            });
        }

        if (new Date(endDate) <= new Date(startDate)) {
            return res.status(400).json({
                success: false,
                message: "End date must be after start date.",
            });
        }

        if (couponType === "fixed") {
            if (!discountType || discountValue === undefined || discountValue === null) {
                return res.status(400).json({
                    success: false,
                    message: "Fixed coupon requires discountType and discountValue.",
                });
            }
            if (discountType === "percentage" && (discountValue <= 0 || discountValue > 100)) {
                return res.status(400).json({
                    success: false,
                    message: "Percentage discount must be between 1 and 100.",
                });
            }
        } else if (couponType === "tiered") {
            if (!tiers || !Array.isArray(tiers) || tiers.length === 0) {
                return res.status(400).json({
                    success: false,
                    message: "Tiered coupon requires at least one discount tier.",
                });
            }
        }

        const coupon = await couponModel.create({
            code: normalizedCode,
            description,
            couponType,
            discountType: couponType === "fixed" ? discountType : undefined,
            discountValue: couponType === "fixed" ? Number(discountValue) : undefined,
            maxDiscount: maxDiscount ? Number(maxDiscount) : null,
            tiers: couponType === "tiered" ? tiers : [],
            minPurchase: Number(minPurchase) || 0,
            usageLimit: usageLimit ? Number(usageLimit) : null,
            perUserLimit: perUserLimit ? Number(perUserLimit) : 1,
            startDate: new Date(startDate),
            endDate: new Date(endDate),
            isActive,
            applicableCategories,
            applicableProducts,
            createdBy: req.user._id,
        });

        return res.status(201).json({
            success: true,
            message: `Coupon "${normalizedCode}" created successfully!`,
            coupon,
        });
    } catch (error) {
        console.error("Create coupon error:", error);
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Update an existing coupon
 * @route   PUT /api/coupons/:id
 * @access  Private (Admin only)
 */
export const updateCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await couponModel.findById(id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }

        const {
            code,
            description,
            couponType,
            discountType,
            discountValue,
            maxDiscount,
            tiers,
            minPurchase,
            usageLimit,
            perUserLimit,
            startDate,
            endDate,
            isActive,
            applicableCategories,
            applicableProducts,
        } = req.body;

        if (code) {
            const normalizedCode = code.trim().toUpperCase();
            if (normalizedCode !== coupon.code) {
                const existing = await couponModel.findOne({ code: normalizedCode });
                if (existing) {
                    return res.status(400).json({
                        success: false,
                        message: `Coupon code "${normalizedCode}" is already in use.`,
                    });
                }
                coupon.code = normalizedCode;
            }
        }

        if (description !== undefined) coupon.description = description;
        if (couponType) coupon.couponType = couponType;
        if (discountType) coupon.discountType = discountType;
        if (discountValue !== undefined) coupon.discountValue = Number(discountValue);
        if (maxDiscount !== undefined) coupon.maxDiscount = maxDiscount ? Number(maxDiscount) : null;
        if (tiers !== undefined) coupon.tiers = tiers;
        if (minPurchase !== undefined) coupon.minPurchase = Number(minPurchase);
        if (usageLimit !== undefined) coupon.usageLimit = usageLimit ? Number(usageLimit) : null;
        if (perUserLimit !== undefined) coupon.perUserLimit = Number(perUserLimit);
        if (startDate) coupon.startDate = new Date(startDate);
        if (endDate) coupon.endDate = new Date(endDate);
        if (isActive !== undefined) coupon.isActive = isActive;
        if (applicableCategories !== undefined) coupon.applicableCategories = applicableCategories;
        if (applicableProducts !== undefined) coupon.applicableProducts = applicableProducts;

        await coupon.save();

        return res.status(200).json({
            success: true,
            message: `Coupon "${coupon.code}" updated successfully.`,
            coupon,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Toggle coupon active status
 * @route   PATCH /api/coupons/:id/toggle
 * @access  Private (Admin only)
 */
export const toggleCouponStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await couponModel.findById(id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }

        coupon.isActive = !coupon.isActive;
        await coupon.save();

        return res.status(200).json({
            success: true,
            message: `Coupon "${coupon.code}" is now ${coupon.isActive ? "Active" : "Disabled"}.`,
            coupon,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Delete coupon
 * @route   DELETE /api/coupons/:id
 * @access  Private (Admin only)
 */
export const deleteCoupon = async (req, res) => {
    try {
        const { id } = req.params;
        const coupon = await couponModel.findByIdAndDelete(id);

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Coupon not found." });
        }

        return res.status(200).json({
            success: true,
            message: `Coupon "${coupon.code}" deleted successfully.`,
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Validate and calculate coupon discount for checkout/cart
 * @route   POST /api/coupons/validate
 * @access  Public / Authenticated
 */
export const validateCoupon = async (req, res) => {
    try {
        const { code, cartItems = [], totalAmount = 0 } = req.body;

        if (!code) {
            return res.status(400).json({ success: false, message: "Coupon code is required." });
        }

        const normalizedCode = code.trim().toUpperCase();
        const coupon = await couponModel.findOne({ code: normalizedCode });

        if (!coupon) {
            return res.status(404).json({ success: false, message: "Invalid coupon code." });
        }

        const now = new Date();

        if (!coupon.isActive) {
            return res.status(400).json({ success: false, message: "This coupon is currently inactive." });
        }

        if (now < new Date(coupon.startDate)) {
            return res.status(400).json({
                success: false,
                message: `This coupon will be valid starting ${new Date(coupon.startDate).toLocaleDateString()}.`,
            });
        }

        if (now > new Date(coupon.endDate)) {
            return res.status(400).json({ success: false, message: "This coupon has expired." });
        }

        if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) {
            return res.status(400).json({ success: false, message: "This coupon has reached its maximum usage limit." });
        }

        if (totalAmount < coupon.minPurchase) {
            return res.status(400).json({
                success: false,
                message: `Minimum order value of ₹${coupon.minPurchase.toLocaleString()} required for this coupon.`,
            });
        }

        let discountAmount = 0;
        let appliedMessage = "";

        const totalQuantity = cartItems.reduce((acc, item) => acc + (item.quantity || 1), 0);

        if (coupon.couponType === "fixed") {
            if (coupon.discountType === "percentage") {
                discountAmount = (totalAmount * coupon.discountValue) / 100;
                if (coupon.maxDiscount && discountAmount > coupon.maxDiscount) {
                    discountAmount = coupon.maxDiscount;
                }
                appliedMessage = `${coupon.discountValue}% discount applied (Save ₹${discountAmount.toLocaleString()})!`;
            } else {
                discountAmount = Math.min(coupon.discountValue, totalAmount);
                appliedMessage = `Flat ₹${discountAmount.toLocaleString()} discount applied!`;
            }
        } else if (coupon.couponType === "tiered") {
            // Sort tiers descending by minQuantity to match highest qualified tier
            const sortedTiers = [...coupon.tiers].sort((a, b) => b.minQuantity - a.minQuantity);
            const qualifiedTier = sortedTiers.find((t) => totalQuantity >= t.minQuantity);

            if (!qualifiedTier) {
                const minReq = Math.min(...coupon.tiers.map((t) => t.minQuantity));
                return res.status(400).json({
                    success: false,
                    message: `Buy at least ${minReq} items to qualify for this volume discount coupon.`,
                });
            }

            if (qualifiedTier.discountType === "percentage") {
                discountAmount = (totalAmount * qualifiedTier.discountValue) / 100;
                appliedMessage = `Tier discount applied: ${qualifiedTier.discountValue}% off for ${totalQuantity}+ items!`;
            } else {
                discountAmount = Math.min(qualifiedTier.discountValue, totalAmount);
                appliedMessage = `Tier discount applied: Flat ₹${discountAmount} off for ${totalQuantity}+ items!`;
            }
        }

        return res.status(200).json({
            success: true,
            message: appliedMessage,
            code: coupon.code,
            couponId: coupon._id,
            couponType: coupon.couponType,
            discountAmount: Math.round(discountAmount),
            finalAmount: Math.max(0, Math.round(totalAmount - discountAmount)),
        });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @desc    Get active coupons list (Public customer view)
 * @route   GET /api/coupons/active
 * @access  Public
 */
export const getActivePublicCoupons = async (req, res) => {
    try {
        const now = new Date();
        const coupons = await couponModel.find({
            isActive: true,
            startDate: { $lte: now },
            endDate: { $gte: now },
        })
            .select("code description couponType discountType discountValue maxDiscount minPurchase tiers")
            .limit(6)
            .lean();

        return res.status(200).json({ success: true, coupons });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};
