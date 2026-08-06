import unitModel from "../models/unit.model.js";
import productModel from "../models/product.model.js";

/**
 * Get all active units
 */
export const getAllUnits = async (req, res) => {
  try {
    const filter = req.query.all === "true" || req.user?.role === "admin" ? {} : { isActive: true };
    const units = await unitModel.find(filter).sort({ name: 1 }).lean();
    return res.status(200).json({
      success: true,
      data: units,
      units,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch units",
    });
  }
};

/**
 * Create a new Unit
 */
export const createUnit = async (req, res) => {
  try {
    const { name, abbreviation, description } = req.body;

    if (!name || !name.trim()) {
      return res.status(400).json({
        success: false,
        message: "Unit name is required",
      });
    }

    if (!abbreviation || !abbreviation.trim()) {
      return res.status(400).json({
        success: false,
        message: "Unit abbreviation is required",
      });
    }

    const existing = await unitModel.findOne({
      $or: [
        { name: { $regex: new RegExp(`^${name.trim()}$`, "i") } },
        { abbreviation: abbreviation.trim().toLowerCase() },
      ],
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: "Unit with this name or abbreviation already exists",
      });
    }

    const unit = await unitModel.create({
      name: name.trim(),
      abbreviation: abbreviation.trim().toLowerCase(),
      description: description ? description.trim() : "",
      createdBy: req.user?._id || null,
    });

    return res.status(201).json({
      success: true,
      message: "Unit created successfully",
      data: unit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create unit",
    });
  }
};

/**
 * Update Unit (Admin can update any, Seller can update only if created by them)
 */
export const updateUnit = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, abbreviation, description, isActive } = req.body;

    const unit = await unitModel.findById(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = unit.createdBy && unit.createdBy.toString() === req.user?._id.toString();

    if (unit.isLocked && !isAdmin) {
      return res.status(403).json({
        success: false,
        message: "This unit has been locked by Super Admin and cannot be modified.",
      });
    }

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only edit units created by you.",
      });
    }

    if (name && name.trim()) unit.name = name.trim();
    if (abbreviation && abbreviation.trim()) unit.abbreviation = abbreviation.trim().toLowerCase();
    if (description !== undefined) unit.description = description.trim();
    if (isActive !== undefined) unit.isActive = Boolean(isActive);
    if (isAdmin && req.body.isLocked !== undefined) unit.isLocked = Boolean(req.body.isLocked);

    await unit.save();

    return res.status(200).json({
      success: true,
      message: "Unit updated successfully",
      data: unit,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update unit",
    });
  }
};

/**
 * Delete Unit (Admin can delete any, Seller can delete only if created by them)
 * PREVENT DELETION IF UNIT IS USED BY ANY ACTIVE PRODUCT!
 */
export const deleteUnit = async (req, res) => {
  try {
    const { id } = req.params;

    const unit = await unitModel.findById(id);
    if (!unit) {
      return res.status(404).json({
        success: false,
        message: "Unit not found",
      });
    }

    const isAdmin = req.user?.role === "admin";
    const isOwner = unit.createdBy && unit.createdBy.toString() === req.user?._id.toString();

    if (unit.isLocked) {
      return res.status(403).json({
        success: false,
        message: "This unit is locked by Super Admin and cannot be deleted.",
      });
    }

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete units created by you.",
      });
    }

    const productCount = await productModel.countDocuments({ unit: id });

    if (productCount > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete unit "${unit.name}" because it is currently assigned to ${productCount} product(s). Please reassign or delete those products first.`,
      });
    }

    await unitModel.findByIdAndDelete(id);

    return res.status(200).json({
      success: true,
      message: `Unit "${unit.name}" deleted successfully`,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete unit",
    });
  }
};
