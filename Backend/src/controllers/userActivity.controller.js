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
// Identity: logged-in user (req.user) OR anonymous visitor (X-Visitor-Id header)
// ──────────────────────────────────────────────────────────────────────────────
const resolveIdentity = (req) => {
  if (req.user) return { type: "user", id: req.user._id };
  const visitorId = (req.headers["x-visitor-id"] || req.query.visitorId || "")
    .toString()
    .trim()
    .slice(0, 128);
  if (visitorId) return { type: "visitor", id: visitorId };
  return null;
};

// Returns a Mongoose QUERY (not a promise) so callers can chain .lean()
const findActivity = (identity) => {
  const query = identity.type === "user" ? { user: identity.id } : { visitorId: identity.id };
  return UserActivity.findOne(query);
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
    const identity = resolveIdentity(req);
    if (!identity) {
      return res.status(400).json({ success: false, message: "Authentication or X-Visitor-Id header required" });
    }
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ success: false, message: "productId is required" });
    }

    let activity = await findActivity(identity);
    if (!activity) {
      activity = identity.type === "user"
        ? new UserActivity({ user: identity.id, views: [] })
        : new UserActivity({ visitorId: identity.id, views: [] });
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
    const identity = resolveIdentity(req);
    if (!identity) {
      return res.status(200).json({ success: true }); // No identity → nothing to track
    }
    const { productId, dwellMs } = req.body;

    if (!productId || !dwellMs || dwellMs < 0) {
      return res.status(400).json({ success: false, message: "productId and dwellMs required" });
    }

    // Cap dwell time at 10 minutes per call to prevent abuse
    const cappedDwell = Math.min(Number(dwellMs), 600000);

    let activity = await findActivity(identity);
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
    const identity = resolveIdentity(req);
    if (!identity) {
      return res.status(200).json({ success: true, data: [] });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 50);

    const activity = await findActivity(identity).lean();
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
// Shared scorer: rank published products by this visitor's activity
// (views + dwell + recency + search-term affinity). Excludes already-viewed.
// Returns the ranked product array (up to `limit`).
// ──────────────────────────────────────────────────────────────────────────────
const SEARCH_STOP = new Set([
  "the", "a", "an", "and", "or", "for", "of", "in", "on", "at", "to", "with",
  "buy", "get", "show", "me", "want", "need", "looking", "best", "cheap",
  "online", "price", "new", "latest", "top", "under", "from", "for", "my",
  "this", "that", "please", "help", "products", "product", "only", "no", "not",
]);

const fuzzyIncludes = (text, term) => {
  if (!text) return false;
  const t = text.toLowerCase();
  if (t.includes(term)) return true;
  return text.toLowerCase().split(/\s+/).some((w) => w.length >= 4 && Math.abs(w.length - term.length) <= 1 && (w.includes(term) || term.includes(w)));
};

export const scoreForYouProducts = async (activity, limit) => {
  const viewedIds = new Set(activity.views.map((v) => v.product.toString()));
  const catInterests = activity.categoryInterests instanceof Map
    ? Object.fromEntries(activity.categoryInterests)
    : (activity.categoryInterests || {});
  const brandInterests = activity.brandInterests instanceof Map
    ? Object.fromEntries(activity.brandInterests)
    : (activity.brandInterests || {});
  const searchInterests = activity.searchInterests instanceof Map
    ? Object.fromEntries(activity.searchInterests)
    : (activity.searchInterests || {});
  const topSearchTerms = Object.entries(searchInterests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([term]) => term);

  const topCats = Object.entries(catInterests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);
  const topBrands = Object.entries(brandInterests)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([id]) => id);

  const filter = { status: "published" };
  const interestRestriction = [];
  if (topCats.length > 0) interestRestriction.push({ category: { $in: topCats } });
  if (topBrands.length > 0) interestRestriction.push({ brand: { $in: topBrands } });
  // Restrict to interest categories/brands ONLY when there are no search terms —
  // otherwise search affinity should get a chance to rank the whole catalog.
  if (interestRestriction.length > 0 && topSearchTerms.length === 0) {
    filter.$or = interestRestriction;
  }

  const scoreCandidate = (p) => {
    let score = 0;
    const catId = p.category?._id?.toString() || p.category?.toString();
    const brandId = p.brand?._id?.toString() || p.brand?.toString();

    // Category affinity score
    if (catId && catInterests[catId]) score += catInterests[catId] * 3;
    // Brand affinity score
    if (brandId && brandInterests[brandId]) score += brandInterests[brandId] * 2;

    // Search-term affinity: products matching what the user searches get a
    // solid boost (the "which user searches more" signal)
    if (topSearchTerms.length > 0) {
      const haystack = `${p.title || ""} ${p.description || ""} ${p.category?.name || ""} ${p.brand?.name || ""} ${Array.isArray(p.tags) ? p.tags.join(" ") : ""} ${(p.attributes || []).map((a) => `${a.name} ${a.options?.join(" ")}`).join(" ")}`;
      for (const term of topSearchTerms) {
        if (fuzzyIncludes(haystack, term)) score += searchInterests[term] * 4;
      }
    }

    // Freshness bonus (newer products get a small boost)
    const daysSinceCreated = (Date.now() - new Date(p.createdAt).getTime()) / 86400000;
    if (daysSinceCreated < 7) score += 5;
    else if (daysSinceCreated < 30) score += 2;

    return score;
  };

  const fetchCandidates = async (f) =>
    productModel
      .find(f)
      .sort({ createdAt: -1 })
      .limit(100)
      .populate("category", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic")
      .lean();

  let candidates = await fetchCandidates(filter);

  // Thin pool (e.g. the visitor viewed everything in their interest category):
  // broaden to the whole catalog so recommendations never come back empty.
  if (candidates.length < 5) {
    candidates = await fetchCandidates({ status: "published" });
  }

  const scored = candidates
    .filter((p) => !viewedIds.has(p._id.toString()))
    .map((p) => ({ product: p, score: scoreCandidate(p) }));

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return new Date(b.product.createdAt) - new Date(a.product.createdAt);
  });

  return scored.slice(0, limit).map((s) => s.product);
};

// ──────────────────────────────────────────────────────────────────────────────
// GET /api/activity/for-you — Instagram-style "For You" recommendations
// Uses category + brand interest scores + recency + search affinity to rank
// ──────────────────────────────────────────────────────────────────────────────
export const getForYouProducts = async (req, res) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      // No identity → newest products as fallback (matches the no-activity case)
      const newest = await productModel
        .find({ status: "published" })
        .sort({ createdAt: -1 })
        .limit(10)
        .populate("category", "name slug")
        .populate("brand", "name slug image")
        .populate("seller", "fullname profilePic")
        .lean();
      return res.status(200).json({ success: true, data: newest });
    }
    const limit = Math.min(parseInt(req.query.limit, 10) || 10, 30);

    const activity = await findActivity(identity).lean();

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

    const results = await scoreForYouProducts(activity, limit);
    return res.status(200).json({ success: true, data: results });
  } catch (error) {
    console.error("Error fetching for-you products:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ──────────────────────────────────────────────────────────────────────────────
// POST /api/activity/search — Record what the visitor searches for
// (the "which user searches more" signal for personalization)
// ──────────────────────────────────────────────────────────────────────────────
export const trackSearch = async (req, res) => {
  try {
    const identity = resolveIdentity(req);
    if (!identity) {
      return res.status(200).json({ success: true }); // nothing to track
    }
    const { query } = req.body;
    if (!query || typeof query !== "string" || query.trim().length < 3) {
      return res.status(400).json({ success: false, message: "query (min 3 chars) is required" });
    }
    const q = query.trim().slice(0, 120);

    let activity = await findActivity(identity);
    if (!activity) {
      activity = identity.type === "user"
        ? new UserActivity({ user: identity.id })
        : new UserActivity({ visitorId: identity.id });
    }

    // Upsert the search (case-insensitive)
    const lower = q.toLowerCase();
    const idx = activity.searches.findIndex((s) => s.query.toLowerCase() === lower);
    if (idx > -1) {
      activity.searches[idx].count += 1;
      activity.searches[idx].lastSearchedAt = new Date();
      const [moved] = activity.searches.splice(idx, 1);
      activity.searches.unshift(moved);
    } else {
      activity.searches.unshift({ query: q, count: 1, lastSearchedAt: new Date() });
      if (activity.searches.length > 50) activity.searches = activity.searches.slice(0, 50);
    }

    // Rebuild searchInterests: term → weighted score (count + recency)
    const interests = {};
    const now = Date.now();
    activity.searches.slice(0, 25).forEach((s) => {
      const hours = (now - new Date(s.lastSearchedAt).getTime()) / 3600000;
      const recencyBoost = hours < 24 ? 3 : hours < 168 ? 1 : 0;
      const weight = s.count * 2 + recencyBoost;
      s.query
        .toLowerCase()
        .split(/\s+/)
        .filter((w) => w.length > 2 && !SEARCH_STOP.has(w))
        .forEach((term) => {
          interests[term] = (interests[term] || 0) + weight;
        });
    });
    activity.searchInterests = interests;

    await activity.save();
    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error tracking search:", error);
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
