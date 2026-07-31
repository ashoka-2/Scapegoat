import categoryModel from "../models/category.model.js";
import productModel from "../models/product.model.js";

/**
 * Get all active categories (including parent & subcategories)
 */
export const getAllCategories = async (req, res) => {
  try {
    const categories = await categoryModel.find({ isActive: true }).lean();
    return res.status(200).json({
      success: true,
      data: categories,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch categories",
    });
  }
};

/**
 * Create a new Category or Subcategory
 */
export const createCategory = async (req, res) => {
  try {
    const { name, description, image, parentCategory } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Category name is required",
      });
    }

    const existing = await categoryModel.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Category with this name already exists",
      });
    }

    const category = await categoryModel.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      image: image || "https://placehold.co/400x400/18181b/ffffff?text=Category",
      parentCategory: parentCategory || null,
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Category created successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create category",
    });
  }
};

/**
 * Update Category (Admin can update any, Seller can update only if created by them)
 */
export const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, parentCategory, isActive } = req.body;

    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Permission check: Admin can update any, Seller can only update if created by them
    const isAdmin = req.user?.role === "admin";
    const isOwner = category.createdBy && category.createdBy.toString() === req.user?._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only edit categories created by you.",
      });
    }

    if (name && name.trim()) category.name = name.trim();
    if (description !== undefined) category.description = description.trim();
    if (image) category.image = image;
    if (parentCategory !== undefined) category.parentCategory = parentCategory || null;
    if (isActive !== undefined) category.isActive = Boolean(isActive);

    await category.save();

    return res.status(200).json({
      success: true,
      message: "Category updated successfully",
      data: category,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update category",
    });
  }
};

/**
 * Delete Category (Admin can delete any, Seller can delete only if created by them)
 * PREVENT DELETION IF CATEGORY IS USED BY ANY ACTIVE PRODUCT!
 */
export const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const category = await categoryModel.findById(id);
    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found",
      });
    }

    // Permission check: Admin can delete any, Seller can only delete if created by them
    const isAdmin = req.user?.role === "admin";
    const isOwner = category.createdBy && category.createdBy.toString() === req.user?._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete categories created by you.",
      });
    }

    // Referential Integrity Check: Block deletion if category is assigned to any product!
    const productCount = await productModel.countDocuments({
      $or: [{ category: id }, { subcategories: id }],
    });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete category "${category.name}" because it is currently assigned to ${productCount} product(s). Please reassign or delete those products first.`,
      });
    }

    await categoryModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Category "${category.name}" deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete category",
    });
  }
};
