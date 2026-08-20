import mongoose from "mongoose";

const webhookEventSchema = new mongoose.Schema(
    {
        eventId: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        eventType: {
            type: String,
            required: true,
            index: true,
        },
        entityId: {
            type: String,
            default: null,
            index: true,
        },
        provider: {
            type: String,
            default: "razorpay",
        },
        status: {
            type: String,
            enum: ["processed", "failed", "ignored"],
            default: "processed",
        },
        payload: {
            type: mongoose.Schema.Types.Mixed,
            default: {},
        },
        errorMessage: {
            type: String,
            default: null,
        },
        processedAt: {
            type: Date,
            default: Date.now,
            expires: 30 * 24 * 60 * 60, // Auto-expire logs after 30 days
        },
    },
    {
        timestamps: true,
    }
);

const WebhookEvent = mongoose.model("WebhookEvent", webhookEventSchema);

export default WebhookEvent;
