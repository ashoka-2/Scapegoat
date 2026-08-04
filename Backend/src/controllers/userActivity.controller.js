import UserActivity from "../models/userActivity.model.js";
import productModel from "../models/product.model.js";
import orderModel from "../models/order.model.js";

// ── Constants ────────────────────────────────────────────────────────────────
const MAX_VIEWS = 100; // Cap stored views per user
const INTEREST_WEIGHTS = {
  view: 1,        // Each view adds 1 point
  dwell: 0.001,   // Each ms of dwell adds 0.001 (1 second = 1 point)
  recency: 2,     // Bonus for items viewed in last 24h
};

// ──────────────────────────────────────────────────────────────────────────────
// Helper: Recalculate category & brand interest scores from view history
// ──────────────────────────────────────────────────────────────────────────────
const recalculateInterests = async (activity) => {
  const catScores = {};
  const brandScores = {};

  // Fetch product details for all viewed products
  const productIds = activity.views.map((v) => v.product);
  const products = await productModel
    .find({ _id: { $in: productIds } })
    .select("category brand")
    .lean();

  const productMap = {};
  products.forEach((p) => {
    productMap[p._id.toString()] = p;
  });

  const now = Date.now();

  activity.views.forEach((view) => {
    const prod = productMap[view.product.toString()];
    if (!prod) return;

    // Compute interest score: views + dwell + recency bonus
    const hoursSinceView = (now - new Date(view.lastViewedAt).getTime()) / 3600000;
    const recencyBonus = hoursSinceView < 24 ? INTEREST_WEIGHTS.recency : 0;
    const score =
      view.viewCount * INTEREST_WEIGHTS.view +
      view.dwellMs * INTEREST_WEIGHTS.dwell +
      recencyBonus;

    // Accumulate category interest
    if (prod.category) {
      const catId = prod.category.toString();
      catScores[catId] = (catScores[catId] || 0) + score;
    }

    // Accumulate brand interest
    if (prod.brand) {
      const brandId = prod.brand.toString();
      brandScores[brandId] = (brandScores[brandId] || 0) + score;
    }
  });

  activity.categoryInterests = catScores;
  activity.brandInterests = brandScores;
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/activity/view — Track a product view
// ──────────────────────────────────────────────────────────────────────────────
export const trackView = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    let activity = await UserActivity.findOne({ user: userId });
    if (!activity) {
      activity = new UserActivity({ user: userId, views: [] });
    }

    // Check if this product was already viewed
    const existingIdx = activity.views.findIndex(
      (v) => v.product.toString() === productId
    );

    if (existingIdx > -1) {
      // Update existing view: increment count, refresh timestamp
      activity.views[existingIdx].viewCount += 1;
      activity.views[existingIdx].lastViewedAt = new Date();

      // Move to front (most recent first)
      const [moved] = activity.views.splice(existingIdx, 1);
      activity.views.unshift(moved);
    } else {
      // New view — push to front
      activity.views.unshift({
        product: productId,
        dwellMs: 0,
        viewCount: 1,
        lastViewedAt: new Date(),
      });

      // Cap at MAX_VIEWS
      if (activity.views.length > MAX_VIEWS) {
        activity.views = activity.views.slice(0, MAX_VIEWS);
      }
    }

    // Recalculate interest scores
    await recalculateInterests(activity);
    await activity.save();

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error tracking view:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/activity/dwell — Track dwell time on a product page
// ──────────────────────────────────────────────────────────────────────────────
export const trackDwell = async (req, res) => {
  try {
    const userId = req.user._id;
    const { productId, dwellMs } = req.body;

    if (!productId || !dwellMs || dwellMs < 0) {
      return res.status(400).json({ success: false, message: "productId and dwellMs required" });
    }

    // Cap dwell time at 10 minutes per call to prevent abuse
    const cappedDwell = Math.min(Number(dwellMs), 600000);

    let activity = await UserActivity.findOne({ user: userId });
    if (!activity) {
      return res.status(200).json({ success: true }); // No activity to update
    }

    const existingIdx = activity.views.findIndex(
      (v) => v.product.toString() === productId
    );

    if (existingIdx > -1) {
      activity.views[existingIdx].dwellMs += cappedDwell;
      await recalculateInterests(activity);
      await activity.save();
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error tracking dwell:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/activity/recently-viewed — Get user's recently viewed product IDs
// ──────────────────────────────────────────────────────────────────────────────
export const getRecentlyViewed = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const activity = await UserActivity.findOne({ user: userId }).lean();
    if (!activity || !activity.views || activity.views.length === 0) {
      return res.status(200).json({ success: true, data: [] });
    }

    // Get the most recent product IDs
    const recentProductIds = activity.views
      .slice(0, limit)
      .map((v) => v.product);

    // Fetch full product details
    const products = await productModel
      .find({ _id: { $in: recentProductIds }, status: { $ne: "trash" } })
      .populate("category", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic")
      .lean();

    // Maintain the order from views (most recent first)
    const productMap = {};
    products.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    const ordered = recentProductIds
      .map((id) => productMap[id.toString()])
      .filter(Boolean);

    return res.status(200).json({ success: true, data: ordered });
  } catch (error) {
    console.error("Error fetching recently viewed:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/activity/for-you — Instagram-style "For You" recommendations
// Uses category + brand interest scores + recency to rank products
// ──────────────────────────────────────────────────────────────────────────────
export const getForYouProducts = async (req, res) => {
  try {
    const userId = req.user._id;
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);

    const activity = await UserActivity.findOne({ user: userId }).lean();

    // If no activity, return newest products as fallback
    if (!activity || !activity.views || activity.views.length === 0) {
      const newest = await productModel
        .find({ status: "published" })
        .sort({ createdAt: -1 })
        .limit(limit)
        .populate("category", "name slug")
        .populate("brand", "name slug image")
        .populate("seller", "fullname profilePic")
        .lean();
      return res.status(200).json({ success: true, data: newest });
    }

    // Collect viewed product IDs to exclude from recommendations
    const viewedIds = new Set(activity.views.map((v) => v.product.toString()));

    // Get top interested categories & brands
    const catInterests = activity.categoryInterests instanceof Map
      ? Object.fromEntries(activity.categoryInterests)
      : (activity.categoryInterests || {});
    const brandInterests = activity.brandInterests instanceof Map
      ? Object.fromEntries(activity.brandInterests)
      : (activity.brandInterests || {});

    // Sort categories and brands by score
    const topCats = Object.entries(catInterests)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);
    const topBrands = Object.entries(brandInterests)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([id]) => id);

    // Fetch candidate products from top categories/brands
    const filter = {
      status: "published",
    };

    if (topCats.length > 0 || topBrands.length > 0) {
      filter.$or = [];
      if (topCats.length > 0) filter.$or.push({ category: { $in: topCats } });
      if (topBrands.length > 0) filter.$or.push({ brand: { $in: topBrands } });
    }

    const candidates = await productModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(100) // Fetch a larger pool to score from
      .populate("category", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic")
      .lean();

    // Score each candidate
    const scored = candidates
      .filter((p) => !viewedIds.has(p._id.toString())) // Exclude already viewed
      .map((p) => {
        let score = 0;
        const catId = p.category?._id?.toString() || p.category?.toString();
        const brandId = p.brand?._id?.toString() || p.brand?.toString();

        // Category affinity score
        if (catId && catInterests[catId]) {
          score += catInterests[catId] * 3; // Heavy weight on category match
        }

        // Brand affinity score
        if (brandId && brandInterests[brandId]) {
          score += brandInterests[brandId] * 2;
        }

        // Freshness bonus (newer products get a small boost)
        const daysSinceCreated = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
        if (daysSinceCreated < 7) score += 5;
        else if (daysSinceCreated < 30) score += 2;

        return { product: p, score };
      });

    // Sort by score descending, then by createdAt
    scored.sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      return new Date(b.product.createdAt) - new Date(a.product.createdAt);
    });

    const results = scored.slice(0, limit).map((s) => s.product);

    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching for-you products:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/products/:id/frequently-bought-together
// Algorithm: Find products that appear in the same ORDER as the target product.
// Score by co-occurrence frequency. Return top 10.
// ──────────────────────────────────────────────────────────────────────────────
export const getFrequentlyBoughtTogether = async (req, res) => {
  try {
    const { id: productId } = req.params;

    // Find all completed orders that contain this product
    const orders = await orderModel
      .find({
        "orderItems.product": productId,
        status: { $in: ["Processing", "Shipped", "Delivered"] },
      })
      .select("orderItems.product")
      .lean();

    if (!orders || orders.length === 0) {
      // Fallback: return similar products instead
      return res.status(200).json({ success: true, data: [], fallback: true });
    }

    // Count co-occurrence of other products in those orders
    const coCount = {};
    orders.forEach((order) => {
      order.orderItems.forEach((item) => {
        const otherId = item.product.toString();
        if (otherId !== productId) {
          coCount[otherId] = (coCount[otherId] || 0) + 1;
        }
      });
    });

    // Sort by co-occurrence frequency
    const sortedIds = Object.entries(coCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([id]) => id);

    if (sortedIds.length === 0) {
      return res.status(200).json({ success: true, data: [], fallback: true });
    }

    // Fetch full product details
    const products = await productModel
      .find({ _id: { $in: sortedIds }, status: "published" })
      .populate("category", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic")
      .lean();

    // Maintain co-occurrence order
    const productMap = {};
    products.forEach((p) => {
      productMap[p._id.toString()] = p;
    });

    const ordered = sortedIds
      .map((id) => productMap[id])
      .filter(Boolean);

    return res.status(200).json({ success: true, data: ordered });
  } catch (error) {
    console.error("Error fetching frequently bought together:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};
