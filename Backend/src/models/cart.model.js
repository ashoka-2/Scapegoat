import mongoose from "mongoose";

const cartItemSchema = new mongoose.Schema({
    product: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
        required: [true, "Product is required"],
    },
    variantId: {
        type: mongoose.Schema.Types.ObjectId,
        default: null,
    },
    // Stores the selected attribute combination for this cart item
    // e.g. { "Color": "Red", "Size": "M" }
    selectedAttributes: {
        type: Map,
        of: String,
        default: {},
    },
    quantity: {
        type: Number,
        required: [true, "Quantity is required"],
        min: [1, "Quantity cannot be less than 1"],
        default: 1,
    },
});

const cartSchema = new mongoose.Schema(
    {
        // One cart per user (unique constraint ensures this)
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
            unique: true,
        },
        items: [cartItemSchema],
    },
    { timestamps: true }
);

const cartModel = mongoose.model("Cart", cartSchema);

export default cartModel;
