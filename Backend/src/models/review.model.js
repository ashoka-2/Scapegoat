import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema(
  {
    product: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    rating: {
      type: Number,
      required: [true, "Rating between 1 and 5 is required"],
      min: 1,
      max: 5,
    },
    title: {
      type: String,
      required: [true, "Review headline is required"],
      trim: true,
      maxlength: 120,
    },
    comment: {
      type: String,
      required: [true, "Review comment is required"],
      trim: true,
      maxlength: 1000,
    },
    images: {
      type: [String],
      validate: [
        (val) => val.length <= 3,
        "You can upload a maximum of 3 photos for a review.",
      ],
      default: [],
    },
    isVerifiedPurchase: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true }
);

// One review per user per product
reviewSchema.index({ product: 1, user: 1 }, { unique: true });

const reviewModel = mongoose.model("Review", reviewSchema);
export default reviewModel;
