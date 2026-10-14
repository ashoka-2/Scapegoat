import mongoose from "mongoose";

const billItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: "Product", required: true },
  variantId: { type: String, default: null },
  name: { type: String, required: true, trim: true, maxlength: 160 },
  image: { type: String, default: "" },
  price: { type: Number, required: true, min: 0 },
  quantity: { type: Number, required: true, min: 1, max: 9999 },
}, { _id: false });

const customerSchema = new mongoose.Schema({
  name: { type: String, trim: true, maxlength: 120 },
  phone: { type: String, trim: true, maxlength: 30 },
}, { _id: false });

const billSchema = new mongoose.Schema({
  billNumber: { type: String, required: true, unique: true },
  seller: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  customer: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
  guestCustomer: { type: customerSchema, default: () => ({}) },
  items: { type: [billItemSchema], default: [] },
  subtotal: { type: Number, default: 0, min: 0 },
  status: { type: String, enum: ["draft", "paid", "cancelled"], default: "draft", index: true },
  paymentMethod: { type: String, enum: ["cash", "upi", "card", "other", null], default: null },
  paidAt: { type: Date, default: null },
  changeRequest: {
    requestId: { type: String, default: null },
    state: { type: String, enum: ["pending", "processing", "approved", "rejected", "expired", null], default: null },
    items: { type: [billItemSchema], default: undefined },
    subtotal: { type: Number, default: null },
    requestedAt: { type: Date, default: null },
    decidedAt: { type: Date, default: null },
  },
}, { timestamps: true, optimisticConcurrency: true });

billSchema.index({ seller: 1, updatedAt: -1 });
billSchema.index({ customer: 1, createdAt: -1 });

export default mongoose.models.Bill || mongoose.model("Bill", billSchema);
