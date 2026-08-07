import mongoose from "mongoose";

const buttonSchema = new mongoose.Schema(
    {
        text: {
            type: String,
            required: true,
            trim: true,
            maxlength: [80, "Button text cannot exceed 80 characters"],
        },
        link: {
            type: String,
            trim: true,
            default: "#",
        },
        // Position as percentage (0-100) from top-left corner of the banner
        positionX: {
            type: Number,
            default: 50,
            min: 0,
            max: 100,
        },
        positionY: {
            type: Number,
            default: 80,
            min: 0,
            max: 100,
        },
        bgColor: {
            type: String,
            default: "#ffffff",
        },
        textColor: {
            type: String,
            default: "#000000",
        },
        borderColor: {
            type: String,
            default: "#ffffff",
        },
        borderWidth: {
            type: Number,
            default: 0,
        },
        borderRadius: {
            type: Number,
            default: 8,
        },
        fontSize: {
            type: Number,
            default: 14,
        },
        paddingX: {
            type: Number,
            default: 24,
        },
        paddingY: {
            type: Number,
            default: 12,
        },
        shadow: {
            type: Boolean,
            default: true,
        },
    },
    { _id: true }
);

const textOverlaySchema = new mongoose.Schema(
    {
        text: {
            type: String,
            default: "",
        },
        positionX: {
            type: Number,
            default: 50,
        },
        positionY: {
            type: Number,
            default: 30,
        },
        fontSize: {
            type: Number,
            default: 20,
        },
        textColor: {
            type: String,
            default: "#ffffff",
        },
        bgColor: {
            type: String,
            default: "transparent",
        },
        fontWeight: {
            type: String,
            default: "bold",
        },
    },
    { _id: true }
);

const timerOverlaySchema = new mongoose.Schema(
    {
        showTimer: {
            type: Boolean,
            default: false,
        },
        label: {
            type: String,
            default: "Offer ends in:",
        },
        endDate: {
            type: Date,
            default: null,
        },
        positionX: {
            type: Number,
            default: 50,
        },
        positionY: {
            type: Number,
            default: 50,
        },
        bgColor: {
            type: String,
            default: "rgba(0, 0, 0, 0.75)",
        },
        textColor: {
            type: String,
            default: "#ffffff",
        },
        accentColor: {
            type: String,
            default: "#f59e0b",
        },
        fontSize: {
            type: Number,
            default: 14,
        },
        borderRadius: {
            type: Number,
            default: 12,
        },
        paddingX: {
            type: Number,
            default: 16,
        },
        paddingY: {
            type: Number,
            default: 10,
        },
    },
    { _id: false }
);

const bannerSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Banner title is required"],
            trim: true,
            maxlength: [150, "Title cannot exceed 150 characters"],
        },
        subtitle: {
            type: String,
            trim: true,
            maxlength: [300, "Subtitle cannot exceed 300 characters"],
        },

        // ── Images per device ──
        image: {
            type: String,
            required: [true, "Banner image is required"],
        },
        imageId: {
            type: String,
            default: null,
        },
        mobileImage: {
            type: String,
            default: null,
        },
        mobileImageId: {
            type: String,
            default: null,
        },
        tabletImage: {
            type: String,
            default: null,
        },
        tabletImageId: {
            type: String,
            default: null,
        },

        altText: {
            type: String,
            trim: true,
            default: "Promotional banner",
        },
        backgroundColor: {
            type: String,
            default: null,
        },

        // ── Custom Aspect Ratios & Canvas Dimensions ──
        canvasWidth: {
            type: Number,
            default: 1200,
        },
        canvasHeight: {
            type: Number,
            default: 500,
        },
        aspectRatio: {
            type: String,
            default: "21:9",
        },

        // Where the banner links to when clicked (e.g. "/category/t-shirts")
        link: {
            type: String,
            trim: true,
            default: "#",
        },
        buttonText: {
            type: String,
            trim: true,
            default: "Shop Now",
            maxlength: [50, "Button text cannot exceed 50 characters"],
        },

        // ── Overlay CTA buttons & text & countdown timer ──
        buttons: [buttonSchema],
        textOverlays: [textOverlaySchema],
        timerOverlay: {
            type: timerOverlaySchema,
            default: () => ({}),
        },
        elements: {
            type: Array,
            default: [],
        },

        // Controls the order of banners in the slider (lower = first)
        position: {
            type: Number,
            default: 0,
        },

        // Where this banner appears on the site:
        // "hero" = homepage slider, "promotional" = popup overlay,
        // "inline" = inline banner within a page, "sidebar" = sidebar ad
        placement: {
            type: String,
            enum: ["hero", "promotional", "inline", "sidebar"],
            default: "hero",
        },

        // Which pages this banner should appear on
        targetPages: {
            type: [String],
            default: ["home"],
        },

        // Which device types to show this banner to
        // Empty array = show on all devices
        deviceTargets: {
            type: [String],
            enum: ["desktop", "mobile", "tablet"],
            default: [],
        },

        // ── Popup-specific settings (used when placement is "promotional") ──
        dismissible: {
            type: Boolean,
            default: true,
        },
        // Delay in seconds before popup appears after page load
        popupDelay: {
            type: Number,
            default: 3,
            min: 0,
        },
        // Auto-close after N seconds (0 = no auto-close, user must click X)
        autoCloseSeconds: {
            type: Number,
            default: 0,
            min: 0,
        },
        // How many times per day to show the popup to the same user (default 1)
        showTimesPerDay: {
            type: Number,
            default: 1,
            min: 1,
        },

        isActive: {
            type: Boolean,
            default: true,
        },

        // ── Draft Status ──
        isDraft: {
            type: Boolean,
            default: false,
        },

        // ── Soft delete / Trash ──
        isDeleted: {
            type: Boolean,
            default: false,
        },
        deletedAt: {
            type: Date,
            default: null,
        },

        // Optional: schedule banners for sales events
        startDate: {
            type: Date,
            default: null,
        },
        endDate: {
            type: Date,
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

// Fetch active banners sorted by position for a specific placement and page
bannerSchema.index({ placement: 1, isActive: 1, isDraft: 1, isDeleted: 1, position: 1 });
bannerSchema.index({ targetPages: 1 });

const bannerModel = mongoose.model("Banner", bannerSchema);

export default bannerModel;
