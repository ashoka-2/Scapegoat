import mongoose from "mongoose";

const sellerCustomerSchema = new mongoose.Schema(
  {
    seller: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    lastInteractionType: {
      type: String,
      enum: ["order", "cart", "wishlist"],
      default: "order",
    },
    lastInteractionAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// Ensure unique (seller, customer) pair so we only store one record per relation
sellerCustomerSchema.index({ seller: 1, customer: 1 }, { unique: true });

const sellerCustomerModel = mongoose.model("sellerCustomer", sellerCustomerSchema);
export default sellerCustomerModel;
