import mongoose from "mongoose";

const { Schema } = mongoose;

// ── Single product view event ────────────────────────────────────────────────
const viewEventSchema = new Schema(
  {
    product: {
      type: Schema.Types.ObjectId,
      ref: "Product",
      required: true,
    },
    // Total dwell time in milliseconds accumulated across visits
    dwellMs: { type: Number, default: 0 },
    // How many times this product was viewed
    viewCount: { type: Number, default: 1 },
    lastViewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

// ── Main UserActivity schema ─────────────────────────────────────────────────
// One document per user — stores their entire behavioral footprint.
// Instagram-style algorithm uses viewCount, dwellMs, and recency to compute
// an interest score per product.
const userActivitySchema = new Schema(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    // Ordered array: most recent view first. Capped at 100 entries.
    views: {
      type: [viewEventSchema],
      default: [],
    },
    // Derived interest vectors: category IDs the user engages with most
    // Recalculated on every trackView call (lightweight — just counts).
    categoryInterests: {
      type: Map,
      of: Number, // categoryId → interest score
      default: {},
    },
    // Brand affinity scores
    brandInterests: {
      type: Map,
      of: Number, // brandId → interest score
      default: {},
    },
  },
  { timestamps: true }
);

// Fast lookup by user
userActivitySchema.index({ user: 1 });
// Fast lookup for recently viewed products sorted by recency
userActivitySchema.index({ "views.lastViewedAt": -1 });

const UserActivity = mongoose.model("UserActivity", userActivitySchema);

export default UserActivity;
