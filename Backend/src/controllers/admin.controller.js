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
import {
  broadcastUpdate,
  getActiveShoppersAndGuests,
} from "../services/socket.service.js";

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
    const [totalProducts, activeProducts, outOfStockProducts] =
      await Promise.all([
        productModel.countDocuments(),
        productModel.countDocuments({
          status: { $in: ["active", "published"] },
        }),
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
        {
          $match: {
            status: { $ne: "Cancelled" },
            createdAt: { $gte: startOfToday },
          },
        },
        { $group: { _id: null, total: { $sum: "$totalPrice" } } },
      ]),
    ]);

    const totalRevenue = revenueResult[0]?.total || 0;
    const revenueToday = revenueTodayResult[0]?.total || 0;

    // 4. Catalog & Message Metrics
    const [totalCategories, totalBrands, totalUnits, unreadMessages] =
      await Promise.all([
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

    // 6. Realtime Active Live Visitors (Registered Shoppers + Guest Visitors)
    const liveSockets = getActiveShoppersAndGuests();

    const twoMinsAgo = new Date(Date.now() - 2 * 60 * 1000);
    const dbActiveUsers = await userModel
      .find({
        role: { $ne: "admin" },
        isBanned: false,
        lastActiveAt: { $gte: twoMinsAgo },
      })
      .select(
        "fullname email profilePic role contact lastActiveAt lastLoginAt deviceInfo createdAt",
      )
      .sort({ lastActiveAt: -1 })
      .limit(10)
      .lean();

    const liveSocketsMap = new Map();
    liveSockets.forEach((s) => {
      if (s.userId) liveSocketsMap.set(s.userId.toString(), s);
    });

    const dbUserIds = new Set(dbActiveUsers.map((u) => u._id.toString()));

    const activeVisitorsList = dbActiveUsers.map((u) => {
      const liveSock = liveSocketsMap.get(u._id.toString());
      const dev = liveSock?.deviceInfo || u.deviceInfo || {};

      const isMob =
        dev.os === "Android" || dev.os === "iOS" || dev.device === "Mobile";
      const devCategory = isMob ? "Mobile" : dev.device || "Desktop";

      return {
        ...u,
        isGuest: false,
        deviceInfo: {
          device: devCategory,
          browser: dev.browser || "Chrome",
          os: dev.os || (isMob ? "Android" : "Windows"),
          model: dev.model || (isMob ? "Mobile Device" : "Desktop PC"),
          ip: dev.ip || "127.0.0.1",
        },
      };
    });

    liveSockets.forEach((sock) => {
      if (
        sock.isGuest ||
        (sock.userId && !dbUserIds.has(sock.userId.toString()))
      ) {
        const dev = sock.deviceInfo || {};
        const isMob =
          dev.os === "Android" || dev.os === "iOS" || dev.device === "Mobile";
        const devCategory = isMob ? "Mobile" : dev.device || "Desktop";

        activeVisitorsList.push({
          _id: sock._id,
          fullname: sock.fullname || "Guest Visitor",
          email: sock.email || null,
          profilePic: sock.profilePic || null,
          role: sock.role || "guest",
          isGuest: sock.isGuest ?? true,
          lastActiveAt: sock.lastActiveAt,
          deviceInfo: {
            device: devCategory,
            browser: dev.browser || "Chrome",
            os: dev.os || (isMob ? "Android" : "Windows"),
            model: dev.model || (isMob ? "Mobile Device" : "Desktop PC"),
            ip: dev.ip || "127.0.0.1",
          },
        });
      }
    });

    const onlineShoppersCount = activeVisitorsList.length;

    // Device breakdown calculation across live visitors
    const deviceCounts = { Desktop: 0, Mobile: 0, Tablet: 0 };
    activeVisitorsList.forEach((u) => {
      const dev = u.deviceInfo?.device || "Desktop";
      deviceCounts[dev] = (deviceCounts[dev] || 0) + 1;
    });

    // 7. Dynamic Performance Tracking with Multi-Metric MongoDB Aggregations (NO SIMULATED DATA)
    const dateMatch = {};
    if (startDate && endDate) {
      dateMatch.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    let dateFormat = "%Y-%m";
    if (timeframe === "daily") dateFormat = "%Y-%m-%d";
    else if (timeframe === "yearly") dateFormat = "%Y";

    // Pipeline A: Revenue & Order Performance Aggregation
    const orderAggPromise = orderModel.aggregate([
      { $match: { ...dateMatch, status: { $ne: "Cancelled" } } },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          revenue: { $sum: "$totalPrice" },
          orders: { $sum: 1 },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ["$status", "Delivered"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Pipeline B: New User Registration Aggregation
    const userRegAggPromise = userModel.aggregate([
      { $match: dateMatch },
      {
        $group: {
          _id: { $dateToString: { format: dateFormat, date: "$createdAt" } },
          newUsers: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Pipeline C: Wishlist Activity Aggregation (accurately counting new additions vs updates on new days)
    const wishlistAggPromise = wishlistModel.aggregate([
      { $match: dateMatch },
      {
        $project: {
          updatedAtDate: {
            $dateToString: {
              format: dateFormat,
              date: { $ifNull: ["$updatedAt", "$createdAt"] },
            },
          },
          createdAtDate: {
            $dateToString: {
              format: dateFormat,
              date: "$createdAt",
            },
          },
          productCount: { $size: { $ifNull: ["$products", []] } },
        },
      },
      {
        $project: {
          dateKey: "$updatedAtDate",
          addsCount: {
            $cond: [
              { $eq: ["$updatedAtDate", "$createdAtDate"] },
              "$productCount",
              1, // If updated on a later date, count 1 for the specific item updated on that date
            ],
          },
        },
      },
      {
        $group: {
          _id: "$dateKey",
          wishlistAdds: { $sum: "$addsCount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Pipeline D: Cart Activity Aggregation (accurately counting new additions vs updates on new days)
    const cartAggPromise = cartModel.aggregate([
      { $match: dateMatch },
      {
        $project: {
          updatedAtDate: {
            $dateToString: {
              format: dateFormat,
              date: { $ifNull: ["$updatedAt", "$createdAt"] },
            },
          },
          createdAtDate: {
            $dateToString: {
              format: dateFormat,
              date: "$createdAt",
            },
          },
          itemCount: { $size: { $ifNull: ["$items", []] } },
        },
      },
      {
        $project: {
          dateKey: "$updatedAtDate",
          addsCount: {
            $cond: [
              { $eq: ["$updatedAtDate", "$createdAtDate"] },
              "$itemCount",
              1, // If updated on a later date, count 1 for the specific item updated on that date
            ],
          },
        },
      },
      {
        $group: {
          _id: "$dateKey",
          cartItems: { $sum: "$addsCount" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    // Pipeline E: Fetch detailed items (orders, users, products, wishlists, carts) in parallel
    const ordersDetailsPromise = orderModel
      .find({ status: { $ne: "Cancelled" }, ...dateMatch })
      .populate("user", "fullname email avatar")
      .populate("orderItems.product", "title images price sellingPrice")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const usersDetailsPromise = userModel
      .find({ ...dateMatch })
      .select("fullname email contact role isBanned createdAt avatar")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const productsDetailsPromise = productModel
      .find({ ...dateMatch })
      .populate("category", "name")
      .select("title images sellingPrice price stock createdAt status category")
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    const wishlistsDetailsPromise = wishlistModel
      .find({ ...dateMatch })
      .populate("user", "fullname email avatar")
      .populate("products", "title images price sellingPrice category stock")
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    const cartsDetailsPromise = cartModel
      .find({ ...dateMatch })
      .populate("user", "fullname email avatar")
      .populate("items.product", "title images price sellingPrice category stock")
      .sort({ updatedAt: -1 })
      .limit(100)
      .lean();

    const [
      orderAgg,
      userRegAgg,
      wishlistAgg,
      cartAgg,
      recentOrdersInPeriod,
      recentUsersInPeriod,
      recentProductsInPeriod,
      recentWishlistsInPeriod,
      recentCartsInPeriod,
    ] = await Promise.all([
      orderAggPromise,
      userRegAggPromise,
      wishlistAggPromise,
      cartAggPromise,
      ordersDetailsPromise,
      usersDetailsPromise,
      productsDetailsPromise,
      wishlistsDetailsPromise,
      cartsDetailsPromise,
    ]);

    // Generate at least 10 consecutive date slots if no custom date filter is applied
    const generatedDateKeys = [];
    if (!startDate && !endDate) {
      const count = 10;
      const now = new Date();
      for (let i = count - 1; i >= 0; i--) {
        const d = new Date(now);
        if (timeframe === "daily") {
          d.setDate(d.getDate() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          generatedDateKeys.push(`${y}-${m}-${day}`);
        } else if (timeframe === "yearly") {
          const y = d.getFullYear() - i;
          generatedDateKeys.push(`${y}`);
        } else {
          // monthly default
          d.setMonth(d.getMonth() - i);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          generatedDateKeys.push(`${y}-${m}`);
        }
      }
    }

    // Merge all aggregation outputs into a unified timeline of at least 10 bars
    const allDateKeys = Array.from(
      new Set([
        ...generatedDateKeys,
        ...orderAgg.map((a) => a._id),
        ...userRegAgg.map((a) => a._id),
        ...wishlistAgg.map((a) => a._id),
        ...cartAgg.map((a) => a._id),
      ])
    ).sort();

    const orderMap = new Map(orderAgg.map((a) => [a._id, a]));
    const userRegMap = new Map(userRegAgg.map((a) => [a._id, a.newUsers]));
    const wishlistMap = new Map(wishlistAgg.map((a) => [a._id, a.wishlistAdds]));
    const cartMap = new Map(cartAgg.map((a) => [a._id, a.cartItems]));

    const chartData = allDateKeys.map((dateKey) => {
      const o = orderMap.get(dateKey) || {};

      // Match specific items for this date interval
      const dateOrders = recentOrdersInPeriod.filter((ord) => {
        const d = new Date(ord.createdAt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const key = timeframe === "daily" ? `${y}-${m}-${day}` : timeframe === "yearly" ? `${y}` : `${y}-${m}`;
        return key === dateKey;
      });

      const dateUsers = recentUsersInPeriod.filter((u) => {
        const d = new Date(u.createdAt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const key = timeframe === "daily" ? `${y}-${m}-${day}` : timeframe === "yearly" ? `${y}` : `${y}-${m}`;
        return key === dateKey;
      });

      const dateProducts = recentProductsInPeriod.filter((p) => {
        const d = new Date(p.createdAt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const key = timeframe === "daily" ? `${y}-${m}-${day}` : timeframe === "yearly" ? `${y}` : `${y}-${m}`;
        return key === dateKey;
      });

      const dateWishlists = recentWishlistsInPeriod.filter((w) => {
        const d = new Date(w.updatedAt || w.createdAt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const key = timeframe === "daily" ? `${y}-${m}-${day}` : timeframe === "yearly" ? `${y}` : `${y}-${m}`;
        return key === dateKey;
      });

      const dateCarts = recentCartsInPeriod.filter((c) => {
        const d = new Date(c.updatedAt || c.createdAt);
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const key = timeframe === "daily" ? `${y}-${m}-${day}` : timeframe === "yearly" ? `${y}` : `${y}-${m}`;
        return key === dateKey;
      });

      return {
        dateLabel: dateKey,
        revenue: o.revenue || 0,
        orders: o.orders || 0,
        deliveredOrders: o.deliveredOrders || 0,
        newUsers: userRegMap.get(dateKey) || 0,
        wishlistAdds: wishlistMap.get(dateKey) || 0,
        cartItems: cartMap.get(dateKey) || 0,
        specificItems: {
          orders: dateOrders,
          users: dateUsers,
          products: dateProducts,
          wishlists: dateWishlists,
          carts: dateCarts,
        },
      };
    });

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
      if (p.variants?.[0]?.price?.salePrice)
        return p.variants[0].price.salePrice;
      if (typeof p.variants?.[0]?.price === "number")
        return p.variants[0].price;
      return 0;
    };

    let topProducts = [];
    if (bestSellingAgg.length > 0) {
      const prodIds = bestSellingAgg.map((b) => b._id).filter(Boolean);
      const prods = await productModel
        .find({ _id: { $in: prodIds } })
        .populate("category", "name")
        .select(
          "title images sellingPrice maxPrice price stock rating numReviews category status variants",
        )
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
        .select(
          "title images sellingPrice maxPrice price stock rating numReviews category variants",
        )
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
          activeNow: onlineShoppersCount,
          activeUsersList: activeVisitorsList,
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
    if (isBanned !== undefined && isBanned !== "all")
      query.isBanned = isBanned === "true";

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
      return res
        .status(400)
        .json({ success: false, message: "Invalid User ID format" });
    }

    const user = await userModel.findById(id).select("-password").lean();

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    const userObjId = mongoose.Types.ObjectId.isValid(id) ? new mongoose.Types.ObjectId(id) : id;

    const [orders, activity, reviews, cart, wishlist, sellerProducts] =
      await Promise.all([
        orderModel
          .find({
            $or: [
              { user: userObjId },
              { user: id },
              { "orderItems.seller": userObjId },
              { "orderItems.seller": id },
            ],
          })
          .populate("user", "fullname email contact role")
          .populate("orderItems.product", "title slug images maxPrice sellingPrice price stock")
          .populate("orderItems.seller", "fullname email contact role")
          .sort({ createdAt: -1 })
          .limit(100)
          .lean()
          .catch((err) => {
            console.error("Error fetching admin user orders:", err.message || err);
            return [];
          }),
        userActivityModel
          ? userActivityModel
              .findOne({ user: id })
              .lean()
              .catch(() => null)
          : Promise.resolve(null),
        reviewModel
          .find({ user: id })
          .populate("product", "title images")
          .sort({ createdAt: -1 })
          .lean()
          .catch(() => []),
        cartModel
          .findOne({ $or: [{ user: userObjId }, { user: id }] })
          .populate("items.product", "title slug images maxPrice sellingPrice price stock stockStatus")
          .lean()
          .catch((err) => {
            console.error("Error fetching admin user cart:", err);
            return null;
          }),
        wishlistModel
          .findOne({ $or: [{ user: userObjId }, { user: id }] })
          .populate("products", "title slug images maxPrice sellingPrice price stock stockStatus rating")
          .lean()
          .catch((err) => {
            console.error("Error fetching admin user wishlist:", err);
            return null;
          }),
        user.role === "seller"
          ? productModel
              .find({ $or: [{ seller: userObjId }, { seller: id }] })
              .select("title slug images maxPrice sellingPrice price stock stockStatus status category brand createdAt")
              .sort({ createdAt: -1 })
              .lean()
              .catch((err) => {
                console.error("Error fetching admin seller products:", err);
                return [];
              })
          : Promise.resolve([]),
      ]);

    return res.status(200).json({
      success: true,
      user: {
        ...user,
        orders: orders || [],
        cart: cart?.items || [],
        wishlist: wishlist?.products || [],
        sellerProducts: sellerProducts || [],
        reviews: reviews || [],
      },
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
      return res
        .status(400)
        .json({ success: false, message: "Invalid role specified" });
    }

    const user = await userModel
      .findByIdAndUpdate(id, { $set: { role } }, { new: true })
      .select("-password");

    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
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
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (user._id.toString() === req.user._id.toString()) {
      return res
        .status(400)
        .json({ success: false, message: "You cannot ban yourself" });
    }

    user.isBanned = !user.isBanned;
    await user.save();

    broadcastUpdate("user_banned_status", {
      userId: user._id,
      isBanned: user.isBanned,
    });

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
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
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
        .populate("orderItems.seller", "fullname email contact role")
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
    if (isRead !== undefined && isRead !== "all")
      query.isRead = isRead === "true";

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
      return res
        .status(404)
        .json({ success: false, message: "Message not found" });
    }

    message.isRead = !message.isRead;
    await message.save();

    broadcastUpdate("inbox_updated", {
      messageId: message._id,
      isRead: message.isRead,
    });

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
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    if (rating !== undefined) review.rating = Number(rating);
    if (title !== undefined) review.title = title;
    if (comment !== undefined) review.comment = comment;

    await review.save();

    // Recalculate product rating summary
    const stats = await reviewModel.aggregate([
      { $match: { product: review.product } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
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
      return res
        .status(404)
        .json({ success: false, message: "Review not found" });
    }

    // Recalculate product rating summary
    const stats = await reviewModel.aggregate([
      { $match: { product: review.product } },
      {
        $group: {
          _id: "$product",
          avgRating: { $avg: "$rating" },
          count: { $sum: 1 },
        },
      },
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
