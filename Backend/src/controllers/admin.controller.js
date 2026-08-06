import mongoose from "mongoose";
import userModel from "../models/user.model.js";
import productModel from "../models/product.model.js";
import orderModel from "../models/order.model.js";
import categoryModel from "../models/category.model.js";
import brandModel from "../models/brand.model.js";
import unitModel from "../models/unit.model.js";
import messageModel from "../models/message.model.js";
import reviewModel from "../models/review.model.js";
import userActivityModel from "../models/userActivity.model.js";
import cartModel from "../models/cart.model.js";
import wishlistModel from "../models/wishlist.model.js";
import { broadcastUpdate } from "../services/socket.service.js";

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  ADMIN DASHBOARD STATS & REALTIME MONITORING
 * ══════════════════════════════════════════════════════════════════════════════
 */
export const getDashboardStats = async (req, res) => {
  try {
    const { startDate, endDate, timeframe = "monthly" } = req.query;

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // 1. User Metrics
    const [
      totalUsers,
      totalBuyers,
      totalSellers,
      totalAdmins,
      newUsersToday,
      bannedUsers,
    ] = await Promise.all([
      userModel.countDocuments(),
      userModel.countDocuments({ role: "buyer" }),
      userModel.countDocuments({ role: "seller" }),
      userModel.countDocuments({ role: "admin" }),
      userModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      userModel.countDocuments({ isBanned: true }),
    ]);

    // 2. Product Metrics
    const [totalProducts, activeProducts, outOfStockProducts] = await Promise.all([
      productModel.countDocuments(),
      productModel.countDocuments({ status: { $in: ["active", "published"] } }),
      productModel.countDocuments({ stock: 0 }),
    ]);

    // 3. Order Metrics & Revenue
    const [
      totalOrders,
      processingOrders,
      shippedOrders,
      deliveredOrders,
      cancelledOrders,
      ordersToday,
      revenueResult,
      revenueTodayResult,
    ] = await Promise.all([
      orderModel.countDocuments(),
      orderModel.countDocuments({ status: "Processing" }),
      orderModel.countDocuments({ status: "Shipped" }),
      orderModel.countDocuments({ status: "Delivered" }),
      orderModel.countDocuments({ status: "Cancelled" }),
      orderModel.countDocuments({ createdAt: { $gte: startOfToday } }),
      orderModel.aggregate([
        { $match: { status: { $ne: "Cancelled" } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
      orderModel.aggregate([
        { $match: { status: { $ne: "Cancelled" }, createdAt: { $gte: startOfToday } } },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;
    const revenueToday = revenueTodayResult[0]?.total || 0;

    // 4. Catalog & Message Metrics
    const [totalCategories, totalBrands, totalUnits, unreadMessages] = await Promise.all([
      categoryModel.countDocuments(),
      brandModel.countDocuments(),
      unitModel.countDocuments(),
      messageModel.countDocuments({ isRead: false }),
    ]);

    // 5. Recent Activity (Orders & Messages)
    const recentOrders = await orderModel
      .find()
      .populate("user", "fullname email profilePic role")
      .sort({ createdAt: -1 })
      .limit(8)
      .lean();

    const recentMessages = await messageModel
      .find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // 6. Realtime Active Non-Admin Users (Viewing site in last 15 minutes, or recent buyers)
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
    const rawActiveUsers = await userModel
      .find({
        role: { $ne: "admin" },
        isBanned: false,
      })
      .select("fullname email profilePic role contact lastActiveAt lastLoginAt deviceInfo createdAt")
      .sort({ lastActiveAt: -1, updatedAt: -1 })
      .limit(10)
      .lean();

    const activeNonAdminUsers = rawActiveUsers.map((u) => ({
      ...u,
      deviceInfo: {
        device: u.deviceInfo?.device || "Desktop",
        browser: u.deviceInfo?.browser || "Chrome",
        os: u.deviceInfo?.os || "Windows",
        model: u.deviceInfo?.model || (u.deviceInfo?.device === "Mobile" ? "Mobile Device" : "Desktop PC"),
        ip: u.deviceInfo?.ip || "127.0.0.1",
      },
    }));

    const onlineShoppersCount = activeNonAdminUsers.filter(
      (u) => u.lastActiveAt && new Date(u.lastActiveAt) >= fifteenMinsAgo
    ).length;

    // Device breakdown calculation
    const deviceCounts = { Desktop: 0, Mobile: 0, Tablet: 0 };
    activeNonAdminUsers.forEach((u) => {
      const dev = u.deviceInfo?.device || "Desktop";
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });

    // 7. Dynamic Revenue Tracking with Calendar / Date Filter & Timeframe Grouping (NO FAKE DATA)
    const dateMatch = { status: { $ne: "Cancelled" } };
    if (startDate && endDate) {
      dateMatch.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    let dateFormat = "%Y-%m";
    if (timeframe === "daily") dateFormat = "%Y-%m-%d";
    else if (timeframe === "yearly") dateFormat = "%Y";

    const revenueAggregation = await orderModel.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const chartData = revenueAggregation.map((item) => ({
      dateLabel: item._id,
      revenue: item.revenue || 0,
      orders: item.orders || 0,
    }));

    // 8. Real Best Performing Products (MongoDB Aggregation Pipeline on Order Items)
    const bestSellingAgg = await orderModel.aggregate([
      { $match: { status: { $ne: "Cancelled" } } },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.product",
          totalQuantitySold: { $sum: "$orderItems.quantity" },
          totalRevenueEarned: {
            $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] },
          },
        },
      },
      { $sort: { totalQuantitySold: -1 } },
      { $limit: 6 },
    ]);

    const calculateUnitPrice = (p) => {
      if (typeof p.sellingPrice === "number") return p.sellingPrice;
      if (p.sellingPrice?.amount) return p.sellingPrice.amount;
      if (p.maxPrice?.amount) return p.maxPrice.amount;
      if (typeof p.price === "number") return p.price;
      if (p.price?.amount) return p.price.amount;
      if (p.price?.salePrice) return p.price.salePrice;
      if (p.price?.mrp) return p.price.mrp;
      if (p.variants?.[0]?.price?.amount) return p.variants[0].price.amount;
      if (p.variants?.[0]?.price?.salePrice) return p.variants[0].price.salePrice;
      if (typeof p.variants?.[0]?.price === "number") return p.variants[0].price;
      return 0;
    };

    let topProducts = [];
    if (bestSellingAgg.length > 0) {
      const prodIds = bestSellingAgg.map((b) => b._id).filter(Boolean);
      const prods = await productModel
        .find({ _id: { $in: prodIds } })
        .populate("category", "name")
        .select("title images sellingPrice maxPrice price stock rating numReviews category status variants")
        .lean();

      const prodMap = new Map(prods.map((p) => [p._id.toString(), p]));

      topProducts = bestSellingAgg
        .map((b) => {
          if (!b._id) return null;
          const p = prodMap.get(b._id.toString());
          if (!p) return null;
          return {
            ...p,
            unitPrice: calculateUnitPrice(p),
            totalSold: b.totalQuantitySold,
            totalRevenueEarned: b.totalRevenueEarned,
          };
        })
        .filter(Boolean);
    }

    // Fallback if no order items aggregated yet
    if (topProducts.length === 0) {
      const fallbackProds = await productModel
        .find({ status: { $in: ["active", "published"] } })
        .populate("category", "name")
        .sort({ views: -1, createdAt: -1 })
        .limit(5)
        .select("title images sellingPrice maxPrice price stock rating numReviews category variants")
        .lean();

      topProducts = fallbackProds.map((p) => ({
        ...p,
        unitPrice: calculateUnitPrice(p),
        totalSold: 0,
        totalRevenueEarned: 0,
      }));
    }

    return res.status(200).json({
      success: true,
      stats: {
        users: {
          total: totalUsers,
          buyers: totalBuyers,
          sellers: totalSellers,
          admins: totalAdmins,
          newToday: newUsersToday,
          banned: bannedUsers,
          activeNow: onlineShoppersCount || activeNonAdminUsers.length,
          activeUsersList: activeNonAdminUsers,
        },
        products: {
          total: totalProducts,
          active: activeProducts,
          outOfStock: outOfStockProducts,
        },
        orders: {
          total: totalOrders,
          processing: processingOrders,
          shipped: shippedOrders,
          delivered: deliveredOrders,
          cancelled: cancelledOrders,
          today: ordersToday,
          totalRevenue,
          revenueToday,
        },
        catalog: {
          categories: totalCategories,
          brands: totalBrands,
          units: totalUnits,
        },
        inbox: {
          unread: unreadMessages,
        },
        analytics: {
          devices: deviceCounts,
        },
        chartData,
        topProducts,
        recentOrders,
        recentMessages,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch dashboard stats",
    });
  }
};

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  USER MANAGEMENT
 * ══════════════════════════════════════════════════════════════════════════════
 */
export const getAllUsers = async (req, res) => {
  try {
    const { role, search, isBanned, page = 1, limit = 20 } = req.query;
    const query = { _id: { $ne: req.user._id } };

    if (role && role !== "all") query.role = role;
    if (isBanned !== undefined && isBanned !== "all") query.isBanned = isBanned === "true";

    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), "i");
      query.$or = [
        { fullname: searchRegex },
        { email: searchRegex },
        { contact: searchRegex },
      ];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total] = await Promise.all([
      userModel
        .find(query)
        .select("-password")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      userModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      users,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch users",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ success: false, message: "Invalid User ID format" });
    }

    const user = await userModel.findById(id).select("-password").lean();

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    const [orders, activity, reviews, cart, wishlist, sellerProducts] = await Promise.all([
      orderModel
        .find({ $or: [{ user: id }, { "items.seller": id }] })
        .populate("items.product", "title images price")
        .sort({ createdAt: -1 })
        .limit(20)
        .lean()
        .catch(() => []),
      userActivityModel ? userActivityModel.findOne({ user: id }).lean().catch(() => null) : Promise.resolve(null),
      reviewModel.find({ user: id }).populate("product", "title images").lean().catch(() => []),
      cartModel.findOne({ user: id }).populate("items.product", "title images price stock").lean().catch(() => null),
      wishlistModel.findOne({ user: id }).populate("products", "title images price stock rating").lean().catch(() => null),
      user.role === "seller" ? productModel.find({ seller: id }).lean().catch(() => []) : Promise.resolve([]),
    ]);

    return res.status(200).json({
      success: true,
      user,
      orders: orders || [],
      activity: activity || null,
      reviews: reviews || [],
      cart: cart?.items || [],
      wishlist: wishlist?.products || [],
      sellerProducts: sellerProducts || [],
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch user details",
    });
  }
};

export const updateUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body;

    if (!["buyer", "seller", "admin"].includes(role)) {
      return res.status(400).json({ success: false, message: "Invalid role specified" });
    }

    const user = await userModel.findByIdAndUpdate(
      id,
      { $set: { role } },
      { new: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    broadcastUpdate("user_role_updated", { userId: user._id, role: user.role });

    return res.status(200).json({
      success: true,
      message: `User role updated to ${role}`,
      user,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update user role",
    });
  }
};

export const toggleBanUser = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await userModel.findById(id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res.status(400).json({ success: false, message: "You cannot ban yourself" });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    broadcastUpdate("user_banned_status", { userId: user._id, isBanned: user.isBanned });

    return res.status(200).json({
      success: true,
      message: `User has been ${user.isBanned ? "banned" : "unbanned"}`,
      user: {
        _id: user._id,
        fullname: user.fullname,
        email: user.email,
        isBanned: user.isBanned,
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to toggle ban status",
    });
  }
};

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  PRODUCT MANAGEMENT FOR ADMIN
 * ══════════════════════════════════════════════════════════════════════════════
 */
export const getAllProductsAdmin = async (req, res) => {
  try {
    const { search, category, brand, status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (category && category !== "all") query.category = category;
    if (brand && brand !== "all") query.brand = brand;
    if (status && status !== "all") query.status = status;

    if (search && search.trim()) {
      query.title = { $regex: search.trim(), $options: "i" };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [products, total] = await Promise.all([
      productModel
        .find(query)
        .populate("category", "name")
        .populate("brand", "name")
        .populate("seller", "fullname email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      productModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      products,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch products",
    });
  }
};

export const getProductDetailAdmin = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productModel
      .findById(id)
      .populate("category", "name description image")
      .populate("brand", "name description image")
      .populate("unit", "name abbreviation")
      .populate("seller", "fullname email contact profilePic")
      .lean();

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const reviews = await reviewModel
      .find({ product: id })
      .populate("user", "fullname profilePic email")
      .sort({ createdAt: -1 })
      .lean();

    return res.status(200).json({
      success: true,
      product,
      reviews,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch product details",
    });
  }
};

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  ORDER MANAGEMENT FOR ADMIN
 * ══════════════════════════════════════════════════════════════════════════════
 */
export const getAllOrdersAdmin = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;
    const query = {};

    if (status && status !== "all") query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [orders, total] = await Promise.all([
      orderModel
        .find(query)
        .populate("user", "fullname email contact")
        .populate("orderItems.product", "title images price")
        .populate("orderItems.seller", "fullname email")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      orderModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      orders,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch orders",
    });
  }
};

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  INBOX & MESSAGES
 * ══════════════════════════════════════════════════════════════════════════════
 */
export const getAllMessages = async (req, res) => {
  try {
    const { type, isRead, page = 1, limit = 20 } = req.query;
    const query = {};

    if (type && type !== "all") query.type = type;
    if (isRead !== undefined && isRead !== "all") query.isRead = isRead === "true";

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [messages, total] = await Promise.all([
      messageModel
        .find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      messageModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      messages,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch messages",
    });
  }
};

export const markMessageRead = async (req, res) => {
  try {
    const { id } = req.params;
    const message = await messageModel.findById(id);

    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    message.isRead = !message.isRead;
    await message.save();

    broadcastUpdate("inbox_updated", { messageId: message._id, isRead: message.isRead });

    return res.status(200).json({
      success: true,
      message: `Message marked as ${message.isRead ? "read" : "unread"}`,
      data: message,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update message status",
    });
  }
};

export const deleteMessage = async (req, res) => {
  try {
    const { id } = req.params;
    await messageModel.findByIdAndDelete(id);

    broadcastUpdate("inbox_updated", { messageId: id, deleted: true });

    return res.status(200).json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete message",
    });
  }
};

/**
 * ══════════════════════════════════════════════════════════════════════════════
 *  ADMIN REVIEWS MANAGEMENT
 * ══════════════════════════════════════════════════════════════════════════════
 */
export const getAllReviewsAdmin = async (req, res) => {
  try {
    const { product, user, search, page = 1, limit = 20 } = req.query;
    const query = {};

    if (product) query.product = product;
    if (user) query.user = user;

    if (search && search.trim()) {
      const regex = new RegExp(search.trim(), "i");
      query.$or = [{ title: regex }, { comment: regex }];
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reviews, total] = await Promise.all([
      reviewModel
        .find(query)
        .populate("product", "title images price category")
        .populate("user", "fullname email profilePic role")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      reviewModel.countDocuments(query),
    ]);

    return res.status(200).json({
      success: true,
      reviews,
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch reviews",
    });
  }
};

export const updateReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const { rating, title, comment } = req.body;

    const review = await reviewModel.findById(id);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    if (rating !== undefined) review.rating = Number(rating);
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Recalculate product rating summary
    const stats = await reviewModel.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await productModel.findByIdAndUpdate(review.product, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        numReviews: stats[0].count,
      });
    }

    broadcastUpdate("review_updated", { reviewId: review._id });

    return res.status(200).json({
      success: true,
      message: "Review updated successfully",
      review,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update review",
    });
  }
};

export const deleteReviewAdmin = async (req, res) => {
  try {
    const { id } = req.params;
    const review = await reviewModel.findByIdAndDelete(id);

    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Recalculate product rating summary
    const stats = await reviewModel.aggregate([
      { $match: { product: review.product } },
      { $group: { _id: "$product", avgRating: { $avg: "$rating" }, count: { $sum: 1 } } },
    ]);

    if (stats.length > 0) {
      await productModel.findByIdAndUpdate(review.product, {
        rating: Math.round(stats[0].avgRating * 10) / 10,
        numReviews: stats[0].count,
      });
    } else {
      await productModel.findByIdAndUpdate(review.product, {
        rating: 0,
        numReviews: 0,
      });
    }

    broadcastUpdate("review_deleted", { reviewId: id });

    return res.status(200).json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete review",
    });
  }
};
