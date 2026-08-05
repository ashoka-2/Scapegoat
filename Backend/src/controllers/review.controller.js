import mongoose from "mongoose";
import reviewModel from "../models/review.model.js";
import productModel from "../models/product.model.js";
import orderModel from "../models/order.model.js";
import { handleServerError } from "../utils/errorHandler.js";
import { broadcastUpdate } from "../services/socket.service.js";

// Helper function to recalculate average rating and total reviews for a product
const updateProductRatingStats = async (productId, rawProductId) => {
  const queryIds = [productId];
  if (rawProductId && rawProductId !== String(productId)) {
    queryIds.push(rawProductId);
  }
  const reviews = await reviewModel.find({ product: { $in: queryIds } });
  const totalReviews = reviews.length;
  const sumRatings = reviews.reduce((sum, r) => sum + r.rating, 0);
  const averageRating = totalReviews > 0 ? Number((sumRatings / totalReviews).toFixed(1)) : 0;

  await productModel.findByIdAndUpdate(productId, { averageRating, totalReviews });
};

// Helper to resolve product ID from ObjectId or slug
const resolveProduct = async (identifier) => {
  if (!identifier) return null;
  const isObjId = mongoose.Types.ObjectId.isValid(identifier);
  if (isObjId) {
    const prod = await productModel.findById(identifier);
    if (prod) return prod;
  }
  return await productModel.findOne({ slug: identifier });
};

/**
 * @desc    Create or Update a Product Review
 * @route   POST /api/reviews
 * @access  Private (Verified buyers, Admins, or Product Sellers)
 */
export const createOrUpdateReview = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId: rawProductId, rating, title, comment, images } = req.body;

    if (!rawProductId || !rating || !title || !comment) {
      return res.status(400).json({
        success: false,
        message: "Product ID, rating (1-5), headline, and comment are required.",
      });
    }

    const product = await resolveProduct(rawProductId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const productId = product._id;

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5 stars.",
      });
    }

    if (images && Array.isArray(images) && images.length > 3) {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 3 photos for a review.",
      });
    }

    // Check if user purchased this product
    const hasPurchased = await orderModel.findOne({
      user: userId,
      $or: [
        { "orderItems.product": productId },
        { "orderItems.product": rawProductId }
      ],
      status: { $ne: "Cancelled" },
    });

    const isSeller = product.seller && product.seller.toString() === userId.toString();
    const isAdmin = req.user.role === "admin";

    if (!hasPurchased && !isAdmin && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "Verified Purchase Required: You can only review products you have purchased.",
      });
    }

    // Upsert review (User can only leave one review per product, editing existing if present)
    const review = await reviewModel.findOneAndUpdate(
      { product: productId, user: userId },
      {
        product: productId,
        user: userId,
        rating: Number(rating),
        title,
        comment,
        images: Array.isArray(images) ? images.slice(0, 3) : [],
        isVerifiedPurchase: Boolean(hasPurchased),
      },
      { upsert: true, new: true, runValidators: true }
    );

    // Recalculate product rating stats
    await updateProductRatingStats(productId, rawProductId);

    // Real-time broadcast to all users
    broadcastUpdate("review_updated", { productId, rawProductId });

    return res.status(200).json({
      success: true,
      message: "Review submitted successfully!",
      review,
    });
  } catch (error) {
    return handleServerError(res, error);
  }
};

/**
 * @desc    Get all reviews for a product with breakdown stats
 * @route   GET /api/reviews/product/:productId
 * @access  Public (Optional Verify Token for logged-in user check)
 */
export const getProductReviews = async (req, res) => {
  try {
    const { productId: rawProductId } = req.params;
    const userId = req.user?._id;

    const product = await resolveProduct(rawProductId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    const productId = product._id;

    // Search for reviews matching either product._id or rawProductId
    const queryIds = [productId];
    if (rawProductId && rawProductId !== String(productId)) {
      queryIds.push(rawProductId);
    }

    const reviews = await reviewModel
      .find({ product: { $in: queryIds } })
      .populate("user", "fullname profilePic role")
      .sort({ createdAt: -1 })
      .lean();

    // Rating breakdown (5 stars to 1 star)
    const breakdown = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
    reviews.forEach((r) => {
      if (breakdown[r.rating] !== undefined) {
        breakdown[r.rating] += 1;
      }
    });

    let canReview = false;
    let userReview = null;

    if (userId) {
      userReview = reviews.find((r) => r.user?._id?.toString() === userId.toString()) || null;
      const hasPurchased = await orderModel.exists({
        user: userId,
        $or: [
          { "orderItems.product": productId },
          { "orderItems.product": rawProductId }
        ],
        status: { $ne: "Cancelled" },
      });

      const isSeller = product.seller && product.seller.toString() === userId.toString();
      const isAdmin = req.user.role === "admin";

      canReview = Boolean(hasPurchased || isAdmin || isSeller);
    }

    return res.status(200).json({
      success: true,
      total: reviews.length,
      breakdown,
      canReview,
      userReview,
      reviews,
    });
  } catch (error) {
    return handleServerError(res, error);
  }
};

/**
 * @desc    Get all reviews created by the logged-in user
 * @route   GET /api/reviews/user
 * @access  Private
 */
export const getUserReviews = async (req, res) => {
  try {
    const userId = req.user._id;
    const reviews = await reviewModel
      .find({ user: userId })
      .populate({
        path: "product",
        select: "title slug images maxPrice sellingPrice",
      })
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      count: reviews.length,
      reviews,
    });
  } catch (error) {
    return handleServerError(res, error);
  }
};

/**
 * @desc    Delete a review
 * @route   DELETE /api/reviews/:id
 * @access  Private (Author, Admin, or Product Seller)
 */
export const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user._id.toString();
    const userRole = req.user.role;

    const review = await reviewModel.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found." });
    }

    const product = await productModel.findById(review.product);
    if (!product) {
      return res.status(404).json({ success: false, message: "Associated product not found." });
    }

    const isAuthor = review.user.toString() === userId;
    const isAdmin = userRole === "admin";
    const isSeller = product.seller && product.seller.toString() === userId;

    if (!isAuthor && !isAdmin && !isSeller) {
      return res.status(403).json({
        success: false,
        message: "Not authorized to delete this review.",
      });
    }

    await reviewModel.findByIdAndDelete(id);

    // Recalculate product rating stats
    await updateProductRatingStats(review.product);

    // Real-time broadcast to all users
    broadcastUpdate("review_updated", { productId: review.product });

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully.",
    });
  } catch (error) {
    return handleServerError(res, error);
  }
};
