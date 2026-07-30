import wishlistModel from "../models/wishlist.model.js";
import productModel from "../models/product.model.js";

/**
 * @desc    Get user's wishlist
 * @route   GET /api/wishlist
 * @access  Private
 */
export const getWishlist = async (req, res) => {
  try {
    let wishlist = await wishlistModel.findOne({ user: req.user._id }).populate({
      path: "products",
      select: "title slug maxPrice sellingPrice images stockStatus averageRating category brand",
      populate: [
        { path: "category", select: "name slug" },
        { path: "brand", select: "name slug image" },
      ],
    });

    if (!wishlist) {
      wishlist = await wishlistModel.create({ user: req.user._id, products: [] });
    }

    return res.status(200).json({
      success: true,
      count: wishlist.products.length,
      data: wishlist,
    });
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch wishlist",
    });
  }
};

/**
 * @desc    Add a product to wishlist
 * @route   POST /api/wishlist/add
 * @access  Private
 */
export const addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await productModel.findById(productId);
    if (!product || product.status !== "published") {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let wishlist = await wishlistModel.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await wishlistModel.create({ user: req.user._id, products: [] });
    }

    // Check if already in wishlist
    if (!wishlist.products.includes(productId)) {
      wishlist.products.push(productId);
      await wishlist.save();
    }

    const updatedWishlist = await wishlistModel.findById(wishlist._id).populate({
      path: "products",
      select: "title slug maxPrice sellingPrice images stockStatus averageRating",
    });

    return res.status(200).json({
      success: true,
      message: "Product added to wishlist",
      count: updatedWishlist.products.length,
      data: updatedWishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to add to wishlist",
    });
  }
};

/**
 * @desc    Remove a product from wishlist
 * @route   DELETE /api/wishlist/:productId
 * @access  Private
 */
export const removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await wishlistModel.findOne({ user: req.user._id });
    if (!wishlist) {
      return res.status(404).json({ success: false, message: "Wishlist not found" });
    }

    wishlist.products.pull(productId);
    await wishlist.save();

    const updatedWishlist = await wishlistModel.findById(wishlist._id).populate({
      path: "products",
      select: "title slug maxPrice sellingPrice images stockStatus averageRating",
    });

    return res.status(200).json({
      success: true,
      message: "Product removed from wishlist",
      count: updatedWishlist.products.length,
      data: updatedWishlist,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to remove from wishlist",
    });
  }
};

/**
 * @desc    Toggle product in wishlist (Adds if not present, removes if present)
 * @route   POST /api/wishlist/toggle
 * @access  Private
 */
export const toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    const product = await productModel.findById(productId);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    let wishlist = await wishlistModel.findOne({ user: req.user._id });
    if (!wishlist) {
      wishlist = await wishlistModel.create({ user: req.user._id, products: [] });
    }

    const index = wishlist.products.indexOf(productId);
    let isWishlisted = false;

    if (index > -1) {
      // Remove
      wishlist.products.splice(index, 1);
      isWishlisted = false;
    } else {
      // Add
      wishlist.products.push(productId);
      isWishlisted = true;
    }

    await wishlist.save();

    return res.status(200).json({
      success: true,
      isWishlisted,
      message: isWishlisted ? "Added to wishlist" : "Removed from wishlist",
      count: wishlist.products.length,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle wishlist",
    });
  }
};

/**
 * @desc    Clear all products from wishlist
 * @route   DELETE /api/wishlist/clear
 * @access  Private
 */
export const clearWishlist = async (req, res) => {
  try {
    const wishlist = await wishlistModel.findOne({ user: req.user._id });
    if (wishlist) {
      wishlist.products = [];
      await wishlist.save();
    }

    return res.status(200).json({
      success: true,
      message: "Wishlist cleared successfully",
      count: 0,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to clear wishlist",
    });
  }
};
