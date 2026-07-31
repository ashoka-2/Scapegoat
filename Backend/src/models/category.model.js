import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, "Category name is required"],
            unique: true,
            trim: true,
            maxlength: [100, "Category name cannot exceed 100 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxlength: [500, "Description cannot exceed 500 characters"],
        },
        slug: {
            type: String,
            unique: true,
            trim: true,
            lowercase: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        image: {
            type: String,
            required: [true, "Image is required"],
        },
        // If null, it is a main category. If set, it's a subcategory (e.g., "Shirts" under "Clothing")
        parentCategory: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Category",
            default: null,
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null,
        },
    },
    { timestamps: true }
);

categorySchema.pre("save", function () {
    if (!this.slug || this.isModified("name")) {
        this.slug = this.name
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9\s-]/g, "")
            .replace(/\s+/g, "-");
    }
});

categorySchema.index({ slug: 1 }, { unique: true });
categorySchema.index({ status: 1 });

const categoryModel = mongoose.model("Category", categorySchema);

export default categoryModel;
