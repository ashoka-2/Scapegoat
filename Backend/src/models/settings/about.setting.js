import mongoose from "mongoose";

const aboutSettingSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            default: "Our Vision",
            trim: true,
            maxlength: [200, "Title cannot exceed 200 characters"],
        },
        content: {
            type: String,
            default: "ScapeGoat is a brand dedicated to redefining modern fashion.",
            maxlength: [5000, "Content cannot exceed 5000 characters"],
        },
        missionStatement: {
            type: String,
            default: "To deliver high-quality, sustainable fashion to everyone.",
            maxlength: [1000, "Mission statement cannot exceed 1000 characters"],
        },
    },
    { timestamps: true }
);

const AboutSetting = mongoose.model("AboutSetting", aboutSettingSchema);

export default AboutSetting;
