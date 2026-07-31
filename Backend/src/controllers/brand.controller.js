import brandModel from "../models/brand.model.js";
import productModel from "../models/product.model.js";

/**
 * Get all active brands
 */
export const getAllBrands = async (req, res) => {
  try {
    const brands = await brandModel.find({ isActive: true }).lean();
    return res.status(200).json({
      success: true,
      data: brands,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch brands",
    });
  }
};

/**
 * Create a new Brand
 */
export const createBrand = async (req, res) => {
  try {
    const { name, description, image } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Brand name is required",
      });
    }

    const existing = await brandModel.findOne({ name: name.trim() });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Brand with this name already exists",
      });
    }

    const brand = await brandModel.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      image: image || "https://placehold.co/400x400/18181b/ffffff?text=Brand",
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Brand created successfully",
      data: brand,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create brand",
    });
  }
};

/**
 * Update Brand (Admin can update any, Seller can update only if created by them)
 */
export const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, image, isActive } = req.body;

    const brand = await brandModel.findById(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Permission check: Admin can update any, Seller can only update if created by them
    const isAdmin = req.user?.role === "admin";
    const isOwner = brand.createdBy && brand.createdBy.toString() === req.user?._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only edit brands created by you.",
      });
    }

    if (name && name.trim()) brand.name = name.trim();
    if (description !== undefined) brand.description = description.trim();
    if (image) brand.image = image;
    if (isActive !== undefined) brand.isActive = Boolean(isActive);

    await brand.save();

    return res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: brand,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update brand",
    });
  }
};

/**
 * Delete Brand (Admin can delete any, Seller can delete only if created by them)
 * PREVENT DELETION IF BRAND IS USED BY ANY ACTIVE PRODUCT!
 */
export const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    const brand = await brandModel.findById(id);
    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    // Permission check: Admin can delete any, Seller can only delete if created by them
    const isAdmin = req.user?.role === "admin";
    const isOwner = brand.createdBy && brand.createdBy.toString() === req.user?._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete brands created by you.",
      });
    }

    // Referential Integrity Check: Block deletion if brand is assigned to any product!
    const productCount = await productModel.countDocuments({ brand: id });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete brand "${brand.name}" because it is currently assigned to ${productCount} product(s). Please reassign or delete those products first.`,
      });
    }

    await brandModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Brand "${brand.name}" deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete brand",
    });
  }
};
