import mongoose from "mongoose";

const elementSchema = new mongoose.Schema(
  {
    id: { type: String, required: true },
    type: {
      type: String,
      enum: ["frame", "rectangle", "circle", "vector", "text", "button", "timer", "image"],
      required: true,
    },
    name: { type: String, default: "Element" },
    x: { type: Number, default: 0 },
    y: { type: Number, default: 0 },
    width: { type: Number, default: 200 },
    height: { type: Number, default: 200 },
    rotation: { type: Number, default: 0 },
    opacity: { type: Number, default: 100 },
    zIndex: { type: Number, default: 1 },
    isLocked: { type: Boolean, default: false },
    isVisible: { type: Boolean, default: true },
    parentId: { type: String, default: null }, // For nesting elements inside Frames

    // Frame specific
    frameTitle: { type: String, default: "Frame 1" },
    clipOverflow: { type: Boolean, default: true },

    // Vector Pen specific
    vectorPoints: [
      {
        x: { type: Number, default: 0 },
        y: { type: Number, default: 0 },
        handleIn: { x: Number, y: Number },
        handleOut: { x: Number, y: Number },
      },
    ],

    // Styling & Appearance
    fill: { type: String, default: "#ffffff" },
    fillOpacity: { type: Number, default: 100 },
    fillType: { type: String, enum: ["solid", "linear", "radial", "conic", "mesh"], default: "solid" },
    fillGradient: { type: mongoose.Schema.Types.Mixed },

    stroke: { type: String, default: "#000000" },
    strokeWidth: { type: Number, default: 0 },
    strokePosition: { type: String, enum: ["inside", "center", "outside"], default: "center" },
    strokeCap: { type: String, default: "butt" },
    strokeJoin: { type: String, default: "miter" },

    cornerRadius: { type: Number, default: 0 },
    individualCorners: {
      topLeft: { type: Number, default: 0 },
      topRight: { type: Number, default: 0 },
      bottomRight: { type: Number, default: 0 },
      bottomLeft: { type: Number, default: 0 },
    },

    // Typography
    content: { type: String, default: "" },
    fontFamily: { type: String, default: "Inter" },
    fontSize: { type: Number, default: 16 },
    fontWeight: { type: String, default: "400" },
    textAlign: { type: String, default: "left" },
    lineHeight: { type: Number, default: 1.2 },
    letterSpacing: { type: Number, default: 0 },
    textColor: { type: String, default: "#ffffff" },

    // CTA Button & Timer
    linkUrl: { type: String, default: "" },
    timerEndDate: { type: Date },

    // Effects
    effects: [
      {
        type: { type: String, enum: ["dropShadow", "innerShadow", "layerBlur", "bgBlur", "noise", "glass"] },
        color: { type: String, default: "rgba(0,0,0,0.25)" },
        x: { type: Number, default: 0 },
        y: { type: Number, default: 4 },
        blur: { type: Number, default: 12 },
        spread: { type: Number, default: 0 },
        enabled: { type: Boolean, default: true },
      },
    ],

    // Image URL
    url: { type: String, default: "" },
  },
  { _id: false }
);

const pageSchema = new mongoose.Schema({
  id: { type: String, required: true },
  name: { type: String, default: "Page 1" },
  canvasBg: { type: String, default: "#1e1e1e" },
  elements: [elementSchema],
});

const figmaDocumentSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, default: "Untitled Design" },
    owner: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    pages: [pageSchema],
    activePageIndex: { type: Number, default: 0 },
    sharedWithSellers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    isPublic: { type: Boolean, default: false },
    thumbnail: { type: String, default: "" },
  },
  { timestamps: true }
);

const FigmaDocument = mongoose.model("FigmaDocument", figmaDocumentSchema);
export default FigmaDocument;
