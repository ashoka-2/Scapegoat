import mongoose from "mongoose";
import productModel from "../../models/product.model.js";
import cartModel from "../../models/cart.model.js";
import wishlistModel from "../../models/wishlist.model.js";
import reviewModel from "../../models/review.model.js";
import { generateTextEmbedding } from "../../utils/aiEmbedding.js";
import { queryTextVectors, queryImageVectors, pineconeReady } from "../pinecone.service.js";
import { vectorSearchText } from "../mongoVectorSearch.service.js";
import { buildHierarchicalOutfits, buildTechSetupBundle } from "./outfitBuilder.service.js";

const SEARCH_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "for", "of", "in", "on", "at", "to", "with",
  "buy", "get", "show", "me", "want", "need", "looking", "best", "cheap",
  "online", "price", "new", "latest", "top", "under", "from", "my",
  "this", "that", "please", "help", "product", "products", "item", "items",
  "only", "just", "give", "suggest", "find", "search", "can", "you",
]);

/**
 * Extracts core search keywords by removing conversational stop words
 */
const extractSearchKeywords = (query = "") => {
  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !SEARCH_STOP_WORDS.has(w));
};

/**
 * Searches the catalog using Pinecone vector similarity with strict relevance threshold
 * and multi-signal metadata scoring — exactly matching the main navbar AI search.
 */
export const searchCatalog = async ({
  query = "",
  vector = null,
  maxPrice = null,
  minPrice = null,
  category = null,
  limit = 20,
}) => {
  const queryLower = (query || "").trim().toLowerCase();
  const cleanKeywords = extractSearchKeywords(queryLower);

  let productIdsWithScores = new Map(); // productId -> similarity score

  // 1. Generate text embedding from query if vector not passed
  let searchVector = vector;
  if (!searchVector && query) {
    searchVector = await generateTextEmbedding(query);
  }

  // 2. Query Pinecone vector database
  if (searchVector && searchVector.length > 0 && pineconeReady()) {
    const pcRes = await queryTextVectors(searchVector, limit * 3);
    if (pcRes.ok && Array.isArray(pcRes.matches)) {
      pcRes.matches.forEach((m) => {
        const pid = m.metadata?.productId || m.id.replace(/^p:/, "");
        // Strict threshold: only accept matches with cosine similarity >= 0.42
        if (pid && m.score >= 0.42) {
          productIdsWithScores.set(pid, m.score);
        }
      });
    }
  }

  // 3. Fallback to MongoDB Vector Search if Pinecone returned nothing
  if (productIdsWithScores.size === 0 && searchVector && searchVector.length > 0) {
    try {
      const mongoMatches = await vectorSearchText(searchVector, limit * 2);
      mongoMatches.forEach((r) => {
        const pid = String(r.product?._id || r._id);
        const score = r.score || 0;
        if (pid && score >= 0.42) {
          productIdsWithScores.set(pid, score);
        }
      });
    } catch {
      // Ignore and fallback
    }
  }

  // 4. Construct MongoDB query
  const filter = { status: "published" };
  const matchedIds = Array.from(productIdsWithScores.keys())
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  if (matchedIds.length > 0) {
    filter._id = { $in: matchedIds };
  } else if (cleanKeywords.length > 0) {
    // Regex keyword search fallback ONLY if we have valid non-stop words
    filter.$or = cleanKeywords.map((kw) => ({
      $or: [
        { title: { $regex: kw, $options: "i" } },
        { tags: { $in: [new RegExp(kw, "i")] } },
        { description: { $regex: kw, $options: "i" } },
      ],
    }));
  } else {
    // If no vector match and no clean keywords, return empty (don't return random products)
    return [];
  }

  if (typeof maxPrice === "number" && maxPrice > 0) {
    filter["$or"] = [
      { "sellingPrice.amount": { $lte: maxPrice } },
      { "maxPrice.amount": { $lte: maxPrice } },
    ];
  }

  let products = await productModel
    .find(filter)
    .populate("category", "name")
    .populate("brand", "name")
    .limit(limit)
    .lean();

  // 5. Score & Rank Candidates
  const scoredProducts = products.map((prod) => {
    let score = productIdsWithScores.get(String(prod._id)) || 0;
    const titleLower = (prod.title || "").toLowerCase();
    const catLower = (prod.category?.name || "").toLowerCase();
    const tagsLower = Array.isArray(prod.tags) ? prod.tags.join(" ").toLowerCase() : "";

    // Keyword match bonuses
    cleanKeywords.forEach((kw) => {
      if (titleLower.includes(kw)) score += 0.5;
      if (catLower.includes(kw)) score += 0.3;
      if (tagsLower.includes(kw)) score += 0.2;
    });

    return { product: prod, score };
  });

  // Filter out products with 0 relevance score
  const relevantProducts = scoredProducts
    .filter((sp) => sp.score > 0 || cleanKeywords.length > 0)
    .sort((a, b) => b.score - a.score)
    .map((sp) => sp.product);

  return relevantProducts.slice(0, limit);
};

/**
 * Executes a full Cart action: add single item or bulk outfit bundle directly
 */
export const executeCartAction = async ({ user, items = [] }) => {
  if (!user?._id) {
    return { success: false, message: "Please sign in to add items to your cart." };
  }

  if (!items.length) {
    return { success: false, message: "No items provided to add to cart." };
  }

  let cart = await cartModel.findOne({ user: user._id });
  if (!cart) {
    cart = new cartModel({ user: user._id, items: [] });
  }

  const addedItems = [];

  for (const item of items) {
    const { productId, variantId, quantity = 1, selectedAttributes = {} } = item;
    if (!productId || !mongoose.Types.ObjectId.isValid(productId)) continue;

    const prod = await productModel.findById(productId).lean();
    if (!prod || prod.status !== "published") continue;

    const existingIndex = cart.items.findIndex(
      (ci) => String(ci.product) === String(productId) && String(ci.variantId || "") === String(variantId || "")
    );

    if (existingIndex > -1) {
      cart.items[existingIndex].quantity += quantity;
    } else {
      cart.items.push({
        product: prod._id,
        variantId: variantId || null,
        selectedAttributes: new Map(Object.entries(selectedAttributes || {})),
        quantity,
        addedAt: new Date(),
      });
    }

    addedItems.push({
      title: prod.title,
      price: prod.sellingPrice?.amount || prod.maxPrice?.amount || 0,
      quantity,
    });
  }

  await cart.save();

  return {
    success: true,
    addedCount: addedItems.length,
    items: addedItems,
    message: `Successfully added ${addedItems.length} item(s) to your cart!`,
  };
};

/**
 * Executes a Wishlist action: adds or removes items/bundles
 */
export const executeWishlistAction = async ({ user, productIds = [], action = "add" }) => {
  if (!user?._id) {
    return { success: false, message: "Please sign in to save items to your wishlist." };
  }

  if (!productIds.length) {
    return { success: false, message: "No product specified." };
  }

  let wishlist = await wishlistModel.findOne({ user: user._id });
  if (!wishlist) {
    wishlist = new wishlistModel({ user: user._id, products: [] });
  }

  const validOids = productIds.filter((id) => mongoose.Types.ObjectId.isValid(id));

  if (action === "add") {
    const currentSet = new Set(wishlist.products.map(String));
    validOids.forEach((id) => currentSet.add(String(id)));
    wishlist.products = Array.from(currentSet).map((id) => new mongoose.Types.ObjectId(id));
  } else {
    const removeSet = new Set(validOids.map(String));
    wishlist.products = wishlist.products.filter((id) => !removeSet.has(String(id)));
  }

  await wishlist.save();

  return {
    success: true,
    action,
    count: validOids.length,
    message: action === "add" ? `Added ${validOids.length} item(s) to your wishlist!` : `Removed item(s) from your wishlist.`,
  };
};

/**
 * Fetches real customer reviews and computes sentiment breakdown
 */
export const getProductReviewInsights = async ({ productId }) => {
  if (!productId || !mongoose.Types.ObjectId.isValid(productId)) {
    return { found: false, message: "Invalid product ID." };
  }

  const [product, reviews] = await Promise.all([
    productModel.findById(productId).select("title rating totalReviews").lean(),
    reviewModel.find({ product: productId }).sort({ createdAt: -1 }).limit(10).lean(),
  ]);

  if (!product) {
    return { found: false, message: "Product not found." };
  }

  const totalReviews = reviews.length;
  if (totalReviews === 0) {
    return {
      found: true,
      productTitle: product.title,
      hasReviews: false,
      averageRating: product.rating || 0,
      summary: "This product currently has no customer reviews yet.",
    };
  }

  const avgRating = (reviews.reduce((acc, r) => acc + (r.rating || 0), 0) / totalReviews).toFixed(1);
  const positiveSnippets = reviews.filter((r) => r.rating >= 4).map((r) => `${r.title}: ${r.comment}`).slice(0, 3);
  const criticalSnippets = reviews.filter((r) => r.rating <= 3).map((r) => `${r.title}: ${r.comment}`).slice(0, 2);

  return {
    found: true,
    productTitle: product.title,
    hasReviews: true,
    totalReviews,
    averageRating: parseFloat(avgRating),
    positiveHighlights: positiveSnippets,
    criticalHighlights: criticalSnippets,
    recentComments: reviews.slice(0, 4).map((r) => ({
      rating: r.rating,
      title: r.title,
      comment: r.comment,
      verified: r.isVerifiedPurchase,
    })),
  };
};
