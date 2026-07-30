import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: [true, "User is required"],
        },
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Product",
            required: [true, "Product is required"],
        },
        order: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Order",
            required: [true, "Order is required"],
        },
        rating: {
            type: Number,
            required: [true, "Rating is required"],
            min: [1, "Rating must be at least 1"],
            max: [5, "Rating cannot exceed 5"],
        },
        title: {
            type: String,
            trim: true,
            maxlength: [150, "Title cannot exceed 150 characters"],
        },
        comment: {
            type: String,
            trim: true,
            maxlength: [2000, "Comment cannot exceed 2000 characters"],
        },
        // Customers can upload images of the product they received
        images: [
            {
                _id: false,
                url: { type: String, required: true },
            },
        ],
        // Admin can approve/reject reviews before they go live
        status: {
            type: String,
            enum: ["pending", "approved", "rejected"],
            default: "pending",
        },
    },
    { timestamps: true }
);

// One review per user per product (prevents duplicate reviews)
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
// Fast lookup: get all approved reviews for a product, sorted by newest
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });

const reviewModel = mongoose.model("Review", reviewSchema);

export default reviewModel;
