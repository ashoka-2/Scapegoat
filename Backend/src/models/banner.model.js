import mongoose from "mongoose";

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
        image: {
            type: String,
            required: [true, "Banner image is required"],
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
        // Controls the order of banners in the slider (lower = first)
        position: {
            type: Number,
            default: 0,
        },
        // Where this banner appears on the site:
        // "hero" = homepage slider, "promotional" = popup on site entry (e.g. "Login to get 10% off!"),
        // "category" = category page banner, "sidebar" = sidebar ad
        placement: {
            type: String,
            enum: ["hero", "promotional", "category", "sidebar"],
            default: "hero",
        },

        // ── Popup-specific settings (used when placement is "promotional") ──
        // Whether user can dismiss the popup
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
        // How often to show the popup to the same user (in hours)
        // e.g. 24 = show once per day, null = show every visit
        showFrequencyHours: {
            type: Number,
            default: 24,
        },

        isActive: {
            type: Boolean,
            default: true,
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

// Fetch active banners sorted by position for a specific placement
bannerSchema.index({ placement: 1, isActive: 1, position: 1 });

const bannerModel = mongoose.model("Banner", bannerSchema);

export default bannerModel;
