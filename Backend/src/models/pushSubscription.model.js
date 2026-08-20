import mongoose from "mongoose";

const pushSubscriptionSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
            index: true,
        },
        endpoint: {
            type: String,
            required: true,
            unique: true,
            index: true,
        },
        keys: {
            p256dh: {
                type: String,
                required: true,
            },
            auth: {
                type: String,
                required: true,
            },
        },
        role: {
            type: String,
            enum: ["buyer", "seller", "admin", "guest"],
            default: "buyer",
            index: true,
        },
        userAgent: {
            type: String,
            default: "",
        },
        isActive: {
            type: Boolean,
            default: true,
            index: true,
        },
        lastNotifiedAt: {
            type: Date,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

const PushSubscription = mongoose.model("PushSubscription", pushSubscriptionSchema);

export default PushSubscription;
