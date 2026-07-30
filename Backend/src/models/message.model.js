import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
    {
        type: {
            type: String,
            enum: ["contact", "newsletter"],
            required: [true, "Message type is required"],
        },
        name: {
            type: String,
            trim: true,
            maxlength: [100, "Name cannot exceed 100 characters"],
        },
        email: {
            type: String,
            required: [true, "Email is required"],
            trim: true,
            lowercase: true,
        },
        subject: {
            type: String,
            trim: true,
            maxlength: [200, "Subject cannot exceed 200 characters"],
        },
        content: {
            type: String,
            maxlength: [5000, "Content cannot exceed 5000 characters"],
        },
        isRead: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
);

// Index for admin dashboard: quickly filter unread messages and sort by newest
messageSchema.index({ isRead: 1, createdAt: -1 });
// Index for newsletter subscribers: find all newsletter signups by email
messageSchema.index({ type: 1, email: 1 });

const messageModel = mongoose.model("Message", messageSchema);

export default messageModel;
