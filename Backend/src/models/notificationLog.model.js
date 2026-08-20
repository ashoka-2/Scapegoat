import mongoose from "mongoose";

const notificationLogSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true,
            trim: true,
        },
        body: {
            type: String,
            required: true,
            trim: true,
        },
        icon: {
            type: String,
            default: "/icon-192x192.png",
        },
        image: {
            type: String,
            default: null,
        },
        url: {
            type: String,
            default: "/",
        },
        targetAudience: {
            type: String,
            enum: ["all", "buyer", "seller", "single_user", "system"],
            default: "all",
            index: true,
        },
        targetUser: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        sentBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
        sentCount: {
            type: Number,
            default: 0,
        },
        successCount: {
            type: Number,
            default: 0,
        },
        failedCount: {
            type: Number,
            default: 0,
        },
        status: {
            type: String,
            enum: ["sent", "partial", "failed"],
            default: "sent",
        },
    },
    {
        timestamps: true,
    }
);

const NotificationLog = mongoose.model("NotificationLog", notificationLogSchema);

export default NotificationLog;
