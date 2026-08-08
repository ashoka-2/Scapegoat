import mongoose from "mongoose";
import priceSchema from "./price.schema.js";

const { Schema } = mongoose;

// ── Sub-schemas ──────────────────────────────────────────────────────────────

const imageSchema = new Schema(
  {
    url: { type: String, required: true },
    isPrimary: { type: Boolean, default: false },
    embedding: {
      type: [Number],
      default: [],
      select: false,
    },
  },
  { _id: false }
);

// ── Downloadable file schema (for digital products) ─────────────────────────

const downloadableFileSchema = new Schema(
  {
    url: { type: String, required: true },
    name: { type: String, required: true, trim: true },
    // How many times the buyer can download this file (null = unlimited)
    downloadLimit: { type: Number, default: null, min: 1 },
    // How many days after purchase the download link expires (null = never)
    expiryDays: { type: Number, default: null, min: 1 },
  },
  { _id: false }
);

// ── Variant schema ──────────────────────────────────────────────────────────

const variantSchema = new Schema({
  name: {
    type: String,
    trim: true,
  },
  images: {
    type: [imageSchema],
    default: [],
    validate: [
      (val) => val.length <= 7,
      "Variant cannot have more than 7 images",
    ],
  },
  attributes: {
    type: Map,
    of: Schema.Types.Mixed,
    default: {},
  },
  barcode: {
    type: String,
    trim: true,
  },
  price: {
    type: priceSchema,
    required: true,
  },
  costPrice: {
    type: priceSchema,
    select: false,
  },
  sku: {
    type: String,
    trim: true,
  },
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
});

// ── Main Product Schema ─────────────────────────────────────────────────────

const productSchema = new Schema(
  {
    // ── Basic Info ─────────────────────────────────────────────────────────
    title: {
      type: String,
      required: [true, "Product title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    slug: {
      type: String,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Product description is required"],
      // Rich HTML descriptions (formatted text + up to 7 image tags) can legitimately
      // reach 10-20k chars. 50k is a safe ceiling for full rich descriptions.
      maxlength: [50000, "Description cannot exceed 50000 characters"],
    },
    shortDescription: {
      type: String,
      trim: true,
      maxlength: [500, "Short description cannot exceed 500 characters"],
    },

    // ── SEO Metadata ──────────────────────────────────────────────────────
    seo: {
      metaTitle: { type: String, trim: true },
      metaDescription: { type: String, trim: true },
      canonicalUrl: { type: String, trim: true },
    },

    // ── Relationships ─────────────────────────────────────────────────────
    seller: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: "Category",
      required: true,
    },
    // Multiple subcategories can belong to a product (e.g. ["Shirts", "Casual Wear", "Summer Collection"])
    subcategories: [
      {
        type: Schema.Types.ObjectId,
        ref: "Category",
      },
    ],
    brand: {
      type: Schema.Types.ObjectId,
      ref: "Brand",
    },
    unit: {
      type: Schema.Types.ObjectId,
      ref: "Unit",
    },
    tags: [
      {
        type: String,
        lowercase: true,
        trim: true,
      },
    ],

    // ── Product Type Architecture ──────────────────────────────────────────
    productType: {
      type: String,
      enum: [
        "physical",
        "downloadable",
      ],
      default: "physical",
    },

    // ── Downloadable Product Fields ───────────────────────────────────────
    // Only used when productType is "downloadable"
    downloadableFiles: [downloadableFileSchema],

    // ── Shipping / Physical Product Fields ────────────────────────────────
    // Only relevant when productType is "physical"
    weight: {
      type: Number,
      default: null,
      min: [0, "Weight cannot be negative"],
    },
    // Weight unit: grams, kilograms, pounds, ounces
    weightUnit: {
      type: String,
      enum: ["g", "kg", "lb", "oz"],
      default: "g",
    },
    dimensions: {
      _id: false,
      length: { type: Number, default: null, min: 0 },
      width: { type: Number, default: null, min: 0 },
      height: { type: Number, default: null, min: 0 },
      // Dimension unit: centimeters, inches
      unit: { type: String, enum: ["cm", "in"], default: "cm" },
    },

    // ── Status & Visibility ───────────────────────────────────────────────
    status: {
      type: String,
      enum: ["draft", "published", "trash"],
      default: "draft",
    },
    // Controls storefront visibility based on stock availability
    // "instock" = visible & buyable, "outofstock" = hidden/disabled, "onbackorder" = visible but ships later
    stockStatus: {
      type: String,
      enum: ["instock", "outofstock", "onbackorder"],
      default: "instock",
    },

    // ── Pricing ───────────────────────────────────────────────────────────
    sku: {
      type: String,
      trim: true,
    },
    maxPrice: {
      type: priceSchema,
      required: true,
    },
    sellingPrice: {
      type: priceSchema,
    },
    // Cost Price (strictly confidential to seller/admin, hidden by default from public queries)
    costPrice: {
      type: priceSchema,
      select: false,
    },

    // ── Stock Management ──────────────────────────────────────────────────
    // If true, stock quantity is tracked and decremented on purchase.
    // If false, the seller just sells without tracking inventory.
    manageStock: {
      type: Boolean,
      default: false,
    },
    stock: {
      type: Number,
      default: 0,
      min: 0,
    },
    // Alert threshold: notify seller when stock drops below this number
    lowStockThreshold: {
      type: Number,
      default: 5,
      min: 0,
    },

    // ── Attributes & Variants ─────────────────────────────────────────────
    // What this product can be varied by (empty = no variants, simple product)
    // e.g. { name: "Color", options: ["Red", "Blue"] }, { name: "Size", options: ["S", "M", "L"] }
    attributes: [
      {
        _id: false,
        name: { type: String, required: true, trim: true },
        options: [{ type: String, trim: true }],
      },
    ],
    // Actual buyable combinations, each with its own price/stock/images
    variants: [variantSchema],

    // ── Media ─────────────────────────────────────────────────────────────
    images: {
      type: [imageSchema],
      default: [],
      validate: [
        (val) => val.length <= 7,
        "Product cannot have more than 7 images",
      ],
    },

    // ── Product Page Options ──────────────────────────────────────────────
    // A note shown to the customer after purchase (e.g. "Wash before first use")
    purchaseNote: { type: String, trim: true },
    // Whether customers can leave reviews on this product
    enableReviews: { type: Boolean, default: true },
    // Show size chart on product page (useful for clothing/footwear)
    showSizeChart: { type: Boolean, default: false },
    // Cash on Delivery availability (seller can toggle per product)
    isCodAvailable: { type: Boolean, default: true },

    // ── Bulk / Quantity Discount Rules ────────────────────────────────────
    // Tiered pricing for bulk purchases e.g. Buy 10+ → 10% OFF, Buy 50+ → ₹200 OFF
    bulkDiscountRules: [
      {
        _id: false,
        minQty: { type: Number, required: true, min: 2 },
        discType: { type: String, enum: ["percentage", "fixed"], required: true },
        discValue: { type: Number, required: true, min: 0 },
      },
    ],

    // ── Ratings (computed from reviews, cached here for fast queries) ─────
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
      set: (v) => Math.round(v * 10) / 10, // always 1 decimal place
    },
    totalReviews: {
      type: Number,
      default: 0,
      min: 0,
    },

    // ── AI Vector Embeddings (Semantic & Visual Search) ──────────────────
    // Stores 384-dimensional text vector embedding generated from title + description + tags
    embedding: {
      type: [Number],
      default: [],
      select: false,
    },
    // Stores image vector embedding generated from product photos (for camera scan & Snap2Bill visual search)
    imageEmbedding: {
      type: [Number],
      default: [],
      select: false,
    },
  },
  {
    timestamps: true,
    // Enables virtual fields (like computed properties) in JSON/Object output
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
    // Optimistic concurrency: prevents race conditions on stock updates.
    // When two users try to buy the last item simultaneously, Mongoose adds a
    // __v (version) field. Each save increments __v. If two saves happen on the
    // same version, the second one fails with a VersionError, so you can retry
    // or tell the user "Sorry, this item just sold out."
    optimisticConcurrency: true,
  }
);

// ── Virtuals ──────────────────────────────────────────────────────────────────

// Returns true if stock is critically low (useful for "Only 3 left!" badges)
productSchema.virtual("isLowStock").get(function () {
  if (!this.manageStock) return false;
  return this.stock > 0 && this.stock <= this.lowStockThreshold;
});

// ── Pre-save Hooks ────────────────────────────────────────────────────────────

productSchema.pre("save", function () {
  // Auto-generate slug from title
  if (!this.slug || this.isModified("title")) {
    this.slug = this.title
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
  }

  // Auto-update stockStatus based on stock quantity (only if managing stock)
  if (this.manageStock && this.isModified("stock")) {
    if (this.stock <= 0) {
      this.stockStatus = "outofstock";
    } else {
      this.stockStatus = "instock";
    }
  }
});

// ── Indexes ───────────────────────────────────────────────────────────────────

productSchema.index({ slug: 1 }, { unique: true, sparse: true });
productSchema.index({ seller: 1, status: 1 });
productSchema.index({ category: 1, status: 1 });
productSchema.index({ title: "text", description: "text", tags: "text" });
// Storefront query: show only published + in-stock products
productSchema.index({ status: 1, stockStatus: 1 });

const productModel = mongoose.model("Product", productSchema);
export default productModel;
