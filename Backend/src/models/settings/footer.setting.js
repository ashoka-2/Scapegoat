import mongoose from "mongoose";

const socialLinkSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        platform: { type: String, required: true, trim: true },
        icon: { type: String, default: "ri-link" },
        url: { type: String, required: true, trim: true },
    },
    { _id: false }
);

const footerBlockSchema = new mongoose.Schema(
    {
        id: { type: String, required: true },
        type: {
            type: String,
            enum: ["brand", "links", "socials", "legal", "newsletter"],
            required: true,
        },
        visible: { type: Boolean, default: true },
    },
    { _id: false }
);

const footerSettingSchema = new mongoose.Schema(
    {
        blocks: {
            type: [footerBlockSchema],
            default: [
                { id: "brand", type: "brand", visible: true },
                { id: "links", type: "links", visible: true },
                { id: "socials", type: "socials", visible: true },
                { id: "legal", type: "legal", visible: true },
            ],
        },
        socialLinks: {
            type: [socialLinkSchema],
            default: [
                { id: "instagram", platform: "Instagram", icon: "ri-instagram-line", url: "https://instagram.com" },
                { id: "twitter", platform: "X / Twitter", icon: "ri-twitter-x-line", url: "https://twitter.com" },
                { id: "facebook", platform: "Facebook", icon: "ri-facebook-circle-line", url: "https://facebook.com" },
            ],
        },
        privacyPolicyLink: { type: String, default: "/privacy" },
        returnPolicyLink: { type: String, default: "/returns" },
    },
    { timestamps: true }
);

const FooterSetting = mongoose.model("FooterSetting", footerSettingSchema);

export default FooterSetting;
