import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
    {
        // One wishlist per user (unique constraint ensures this)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            unique: true,
        },
        products: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Product",
            },
        ],
    },
    { timestamps: true }
);

const wishlistModel = mongoose.model("Wishlist", wishlistSchema);

export default wishlistModel;
