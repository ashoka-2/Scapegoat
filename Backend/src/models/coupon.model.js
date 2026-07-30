import mongoose from "mongoose";

// ── Tiered Discount Schema ───────────────────────────────────────────────────
// Allows volume-based discounts like:
// Buy 6+ items → 10% off, Buy 30+ items → 20% off, Buy 100+ items → 50% off
const discountTierSchema = new mongoose.Schema(
    {
        minQuantity: {
            type: Number,
            required: [true, "Minimum quantity is required"],
            min: [1, "Minimum quantity must be at least 1"],
        },
        discountType: {
            type: String,
            enum: ["percentage", "flat"],
            required: [true, "Discount type is required"],
        },
        discountValue: {
            type: Number,
            required: [true, "Discount value is required"],
            min: [0, "Discount value cannot be negative"],
        },
    },
    { _id: false }
);

const couponSchema = new mongoose.Schema(
    {
        code: {
            type: String,
            required: [true, "Coupon code is required"],
            unique: true,
            trim: true,
            uppercase: true,
            maxlength: [30, "Coupon code cannot exceed 30 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [300, "Description cannot exceed 300 characters"],
        },
        // "fixed" = single discount, "tiered" = volume-based discount tiers
        couponType: {
            type: String,
            enum: ["fixed", "tiered"],
            default: "fixed",
        },

        // ── Fixed Discount Fields ────────────────────────────────────────────
        // Used when couponType is "fixed"
        discountType: {
            type: String,
            enum: ["percentage", "flat"],
        },
        discountValue: {
            type: Number,
            min: [0, "Discount value cannot be negative"],
        },
        // Maximum discount amount (only relevant for percentage discounts)
        // e.g. 20% off but max ₹500 discount
        maxDiscount: {
            type: Number,
            default: null,
        },

        // ── Tiered Discount Fields ───────────────────────────────────────────
        // Used when couponType is "tiered"
        // e.g. [{ minQuantity: 6, discountType: "percentage", discountValue: 10 },
        //       { minQuantity: 30, discountType: "percentage", discountValue: 20 },
        //       { minQuantity: 100, discountType: "percentage", discountValue: 50 }]
        tiers: [discountTierSchema],

        // ── Usage Rules ──────────────────────────────────────────────────────
        // Minimum order amount required to use this coupon
        minPurchase: {
            type: Number,
            default: 0,
            min: [0, "Minimum purchase cannot be negative"],
        },
        // How many times this coupon can be used in total (null = unlimited)
        usageLimit: {
            type: Number,
            default: null,
            min: [1, "Usage limit must be at least 1"],
        },
        // How many times it has been used so far
        usedCount: {
            type: Number,
            default: 0,
            min: 0,
        },
        // How many times a single user can use this coupon (null = unlimited)
        perUserLimit: {
            type: Number,
            default: 1,
            min: [1, "Per user limit must be at least 1"],
        },

        // ── Validity Window ──────────────────────────────────────────────────
        startDate: {
            type: Date,
            required: [true, "Start date is required"],
        },
        endDate: {
            type: Date,
            required: [true, "End date is required"],
        },
        isActive: {
            type: Boolean,
            default: true,
        },

        // ── Targeting ────────────────────────────────────────────────────────
        // Which categories or products this coupon applies to (empty = all)
        applicableCategories: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Category",
            },
        ],
        applicableProducts: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

// Fast lookup by coupon code (already unique, but explicit index for queries)
couponSchema.index({ code: 1 });
// Find active coupons within a date range
couponSchema.index({ isActive: 1, startDate: 1, endDate: 1 });

const couponModel = mongoose.model("Coupon", couponSchema);

export default couponModel;
