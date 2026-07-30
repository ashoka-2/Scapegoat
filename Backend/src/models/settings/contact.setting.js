import mongoose from "mongoose";

const contactSettingSchema = new mongoose.Schema(
    {
        email: {
            type: String,
            default: "hello@scapegoat.com",
            trim: true,
            lowercase: true,
        },
        phone: {
            type: String,
            default: "+91 98765 43210",
            trim: true,
        },
        address: {
            type: String,
            default: "123 Fashion Street, Mumbai 400001",
            trim: true,
            maxlength: [500, "Address cannot exceed 500 characters"],
        },
        mapLat: {
            type: Number,
            default: 19.076,
        },
        mapLng: {
            type: Number,
            default: 72.8777,
        },
        mapZoom: {
            type: Number,
            default: 14,
            min: [1, "Zoom must be at least 1"],
            max: [20, "Zoom cannot exceed 20"],
        },
    },
    { timestamps: true }
);

const ContactSetting = mongoose.model("ContactSetting", contactSettingSchema);

export default ContactSetting;
