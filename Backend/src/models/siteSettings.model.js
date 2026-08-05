import mongoose from "mongoose";

// Coordinator model: Links all individual setting documents together.
// This ensures there is a single entry point to fetch the entire site configuration.
const siteSettingsSchema = new mongoose.Schema(
    {
        about: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "AboutSetting",
            required: true,
        },
        contact: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "ContactSetting",
            required: true,
        },
        footer: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "FooterSetting",
            required: true,
        },
        legal: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "LegalSetting",
            required: true,
        },
    },
    { timestamps: true }
);

const SiteSettings = mongoose.model("SiteSettings", siteSettingsSchema);

export default SiteSettings;
