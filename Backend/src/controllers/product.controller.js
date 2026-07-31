import productModel from "../models/product.model.js";
import categoryModel from "../models/category.model.js";
import brandModel from "../models/brand.model.js";
import { generateTextEmbedding, generateImageEmbedding, buildProductTextForEmbedding } from "../utils/aiEmbedding.js";
import { uploadFile } from "../services/imageKit.service.js";
import { broadcastUpdate } from "../services/socket.service.js";

/**
 * Helper to check if current user is owner of the product or an admin
 */
const isOwnerOrAdmin = (product, user) => {
  if (!user) return false;
  if (user.role === "admin") return true;
  return product.seller.toString() === user._id.toString();
};

/**
 * @desc    Create a new product
 * @route   POST /api/products
 * @access  Private (Seller, Admin)
 */
export const createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      seller: req.user._id,
    };

    const uploadedImages = [];

    // 1. Handle uploaded image files (Multer buffers)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const uploadRes = await uploadFile({
          file: file.buffer,
          filename: `product_${Date.now()}_${i}.${file.originalname.split(".").pop() || "jpg"}`,
          folder: "/products",
        });
        uploadedImages.push({
          url: uploadRes.url,
          isPrimary: uploadedImages.length === 0,
        });
      }
    }

    // 2. Handle pasted image URLs (ImageKit uploads directly from URL string)
    if (req.body.imageUrls) {
      const urlList = Array.isArray(req.body.imageUrls)
        ? req.body.imageUrls
        : [req.body.imageUrls];
      for (let i = 0; i < urlList.length; i++) {
        const urlStr = urlList[i];
        if (urlStr && typeof urlStr === "string" && urlStr.trim()) {
          try {
            const uploadRes = await uploadFile({
              file: urlStr.trim(),
              filename: `product_url_${Date.now()}_${i}.jpg`,
              folder: "/products",
            });
            uploadedImages.push({
              url: uploadRes.url,
              isPrimary: uploadedImages.length === 0,
            });
          } catch (urlErr) {
            console.warn(`[ImageKit] Failed to upload URL (${urlStr}):`, urlErr.message);
          }
        }
      }
    }

    if (uploadedImages.length > 0) {
      productData.images = uploadedImages;
    }

    // Safely parse JSON strings for variants and attributes if sent as stringified JSON
    if (typeof productData.variants === "string") {
      try {
        productData.variants = JSON.parse(productData.variants);
      } catch (e) {}
    }

    if (typeof productData.attributes === "string") {
      try {
        productData.attributes = JSON.parse(productData.attributes);
      } catch (e) {}
    }

    // Auto-generate local AI text vector embedding for search
    try {
      const textToEmbed = buildProductTextForEmbedding(productData);
      const embedding = await generateTextEmbedding(textToEmbed);
      if (embedding && embedding.length > 0) {
        productData.embedding = embedding;
      }
    } catch (embErr) {
      console.warn("[Product Controller] Skipping embedding generation:", embErr.message);
    }

    const newProduct = await productModel.create(productData);

    // Broadcast live "Just Dropped!" notification to all online shoppers if published
    if (newProduct.status === "published") {
      broadcastUpdate("product_published", {
        id: newProduct._id,
        title: newProduct.title,
        slug: newProduct.slug,
        price: newProduct.sellingPrice?.amount || newProduct.maxPrice?.amount,
        image: newProduct.images[0]?.url || null,
      });
    }

    return res.status(201).json({
      success: true,
      message: "Product created successfully",
      data: newProduct,
    });
  } catch (error) {
    console.error("Error creating product:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to create product",
    });
  }
};

/**
 * @desc    Update an existing product
 * @route   PUT /api/products/:id
 * @access  Private (Product Owner Seller, Admin)
 */
export const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Verify ownership
    if (!isOwnerOrAdmin(product, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only edit your own products.",
      });
    }

    // Update fields
    Object.assign(product, req.body);

    // If text fields were modified, recalculate AI vector embedding
    if (
      req.body.title ||
      req.body.description ||
      req.body.tags ||
      req.body.shortDescription
    ) {
      try {
        const textToEmbed = buildProductTextForEmbedding(product);
        const embedding = await generateTextEmbedding(textToEmbed);
        if (embedding && embedding.length > 0) {
          product.embedding = embedding;
        }
      } catch (embErr) {
        console.warn("[Product Controller] Skipping embedding update:", embErr.message);
      }
    }

    const updatedProduct = await product.save();

    // Broadcast live event so clients viewing this product get updated details
    broadcastUpdate("product_updated", {
      id: updatedProduct._id,
      title: updatedProduct.title,
      slug: updatedProduct.slug,
      price: updatedProduct.sellingPrice?.amount || updatedProduct.maxPrice?.amount,
      stockStatus: updatedProduct.stockStatus,
      stock: updatedProduct.stock,
      status: updatedProduct.status,
    });

    return res.status(200).json({
      success: true,
      message: "Product updated successfully",
      data: updatedProduct,
    });
  } catch (error) {
    console.error("Error updating product:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to update product",
    });
  }
};

/**
 * @desc    Soft Delete Product (Move to Trash)
 * @route   DELETE /api/products/:id
 * @access  Private (Product Owner Seller, Admin)
 */
export const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Verify ownership
    if (!isOwnerOrAdmin(product, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied. You can only delete your own products.",
      });
    }

    // Move to trash (Soft Delete)
    product.status = "trash";
    await product.save();

    // Broadcast live deletion event so frontend users currently viewing this page see a notice and redirect to /shop
    broadcastUpdate("product_deleted", {
      id: product._id,
      title: product.title,
    });

    return res.status(200).json({
      success: true,
      message: "Product moved to trash successfully",
    });
  } catch (error) {
    console.error("Error deleting product:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to delete product",
    });
  }
};

/**
 * @desc    Restore product from trash
 * @route   PATCH /api/products/:id/restore
 * @access  Private (Product Owner Seller, Admin)
 */
export const restoreProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (!isOwnerOrAdmin(product, req.user)) {
      return res.status(403).json({
        success: false,
        message: "Access denied.",
      });
    }

    product.status = "published";
    await product.save();

    broadcastUpdate("product_published", {
      id: product._id,
      title: product.title,
      slug: product.slug,
      price: product.sellingPrice?.amount || product.maxPrice?.amount,
      image: product.images[0]?.url || null,
    });

    return res.status(200).json({
      success: true,
      message: "Product restored to published state successfully",
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to restore product",
    });
  }
};

/**
 * @desc    Get single product by ID or Slug
 * @route   GET /api/products/single/:identifier
 * @access  Public
 */
export const getSingleProduct = async (req, res) => {
  try {
    const { identifier } = req.params;
    const isMongoId = identifier.match(/^[0-9a-fA-F]{24}$/);

    const query = isMongoId ? { _id: identifier } : { slug: identifier.toLowerCase() };

    const product = await productModel
      .findOne(query)
      .populate("category", "name slug description image")
      .populate("brand", "name slug description image")
      .populate("unit", "name abbreviation")
      .populate("seller", "fullname email profilePic contact role");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Hide draft or trashed products from public callers unless they are the owner/admin
    if (product.status !== "published") {
      const canViewDraft = req.user && isOwnerOrAdmin(product, req.user);
      if (!canViewDraft) {
        return res.status(404).json({
          success: false,
          message: "Product not available",
        });
      }
    }

    return res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch product",
    });
  }
};

/**
 * @desc    Get products by Category (ID or Slug)
 * @route   GET /api/products/category/:categoryIdentifier
 * @access  Public
 */
export const getProductsByCategory = async (req, res) => {
  try {
    const { categoryIdentifier } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    // Resolve Category ID
    let categoryId = categoryIdentifier;
    if (!categoryIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      const category = await categoryModel.findOne({ slug: categoryIdentifier.toLowerCase() });
      if (!category) {
        return res.status(404).json({
          success: false,
          message: "Category not found",
        });
      }
      categoryId = category._id;
    }

    const filter = { category: categoryId, status: "published" };

    if (req.query.stockStatus) {
      filter.stockStatus = req.query.stockStatus;
    }

    // Sorting options
    let sort = { createdAt: -1 };
    if (req.query.sort === "price_asc") sort = { "maxPrice.amount": 1 };
    if (req.query.sort === "price_desc") sort = { "maxPrice.amount": -1 };
    if (req.query.sort === "rating") sort = { averageRating: -1 };

    const total = await productModel.countDocuments(filter);
    const products = await productModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic");

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch category products",
    });
  }
};

/**
 * @desc    Get products by Brand (ID or Slug)
 * @route   GET /api/products/brand/:brandIdentifier
 * @access  Public
 */
export const getProductsByBrand = async (req, res) => {
  try {
    const { brandIdentifier } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    let brandId = brandIdentifier;
    if (!brandIdentifier.match(/^[0-9a-fA-F]{24}$/)) {
      const brand = await brandModel.findOne({ slug: brandIdentifier.toLowerCase() });
      if (!brand) {
        return res.status(404).json({
          success: false,
          message: "Brand not found",
        });
      }
      brandId = brand._id;
    }

    const filter = { brand: brandId, status: "published" };

    const total = await productModel.countDocuments(filter);
    const products = await productModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic");

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch brand products",
    });
  }
};

/**
 * @desc    Get products listed by a single Seller
 * @route   GET /api/products/seller/:sellerId
 * @access  Public (Published items) / Private for seller's own draft items
 */
export const getProductsBySeller = async (req, res) => {
  try {
    const { sellerId } = req.params;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const filter = { seller: sellerId };

    // If caller is the seller themselves or an admin, allow filtering by status (draft/trash)
    const isSelf = req.user && (req.user._id.toString() === sellerId || req.user.role === "admin");
    if (isSelf && req.query.status) {
      filter.status = req.query.status;
    } else if (!isSelf) {
      filter.status = "published";
    }

    const total = await productModel.countDocuments(filter);
    const products = await productModel
      .find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .populate("brand", "name slug image");

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch seller products",
    });
  }
};

/**
 * Cosine Similarity Helper for Vector Embeddings
 */
const cosineSimilarity = (vecA, vecB) => {
  if (!vecA || !vecB || vecA.length !== vecB.length || vecA.length === 0) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
};

/**
 * @desc    Get Similar Products (AI Vector Cosine Similarity Matching)
 * @route   GET /api/products/:id/similar
 * @access  Public
 */
export const getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
    // Explicitly select embedding for AI vector similarity comparison
    const product = await productModel.findById(id).select("+embedding");

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    const filter = {
      _id: { $ne: product._id },
      status: "published",
    };

    let candidates = await productModel
      .find(filter)
      .select("+embedding")
      .populate("category", "name slug")
      .populate("subcategories", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic email contact");

    // If target product has vector embeddings, rank candidates using Cosine Similarity
    if (product.embedding && product.embedding.length > 0) {
      const rankedCandidates = candidates.map((item) => {
        let similarityScore = 0;
        if (item.embedding && item.embedding.length === product.embedding.length) {
          similarityScore = cosineSimilarity(product.embedding, item.embedding);
        } else if (item.category?.toString() === product.category?.toString()) {
          similarityScore = 0.5;
        }

        // Slight boost for other sellers
        if (item.seller?._id.toString() !== product.seller.toString()) {
          similarityScore += 0.05;
        }

        return {
          product: item,
          similarityScore,
        };
      });

      rankedCandidates.sort((a, b) => b.similarityScore - a.similarityScore);
      candidates = rankedCandidates.map((c) => c.product);
    }

    const result = candidates.slice(0, 8);

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch similar products",
    });
  }
};

/**
 * @desc    Get You May Also Like Products (Category, Subcategories, Brand, Tags & Multi-Seller Matching)
 * @route   GET /api/products/:id/you-may-also-like
 * @access  Public
 */
export const getYouMayAlsoLikeProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Match by category, subcategories, brand, or tags
    const filter = {
      _id: { $ne: product._id },
      status: "published",
      $or: [
        { category: product.category },
        { subcategories: { $in: product.subcategories || [] } },
        { brand: product.brand },
        { tags: { $in: product.tags || [] } },
      ],
    };

    let candidates = await productModel
      .find(filter)
      .populate("category", "name slug")
      .populate("subcategories", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic email contact");

    // Prioritize products from OTHER sellers so buyers see options from alternative sellers for similar items
    candidates.sort((a, b) => {
      const aOther = a.seller?._id.toString() !== product.seller.toString();
      const bOther = b.seller?._id.toString() !== product.seller.toString();
      if (aOther && !bOther) return -1;
      if (!aOther && bOther) return 1;
      return b.createdAt - a.createdAt;
    });

    const result = candidates.slice(0, 8);

    return res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch you may also like products",
    });
  }
};

/**
 * @desc    Get All Products (With Search, Filters, Sorting, and Pagination)
 * @route   GET /api/products
 * @access  Public
 */
export const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 12;
    const skip = (page - 1) * limit;

    const filter = { status: "published" };

    // Search query filter (Text Index)
    if (req.query.search) {
      filter.$text = { $search: req.query.search };
    }

    // Category filter
    if (req.query.category) {
      filter.category = req.query.category;
    }

    // Subcategory filter (matches products with this subcategory ID)
    if (req.query.subcategory) {
      filter.subcategories = req.query.subcategory;
    }

    // Brand filter
    if (req.query.brand) {
      filter.brand = req.query.brand;
    }

    // In Stock Only filter
    if (req.query.inStockOnly === "true") {
      filter.stockStatus = "instock";
    }

    // COD Availability filter
    if (req.query.isCodAvailable === "true") {
      filter.isCodAvailable = true;
    }

    // Minimum Rating filter (e.g., ?rating=4 for 4 stars and above)
    if (req.query.rating) {
      filter.averageRating = { $gte: Number(req.query.rating) };
    }

    // Attribute options filter (e.g., ?color=Red or ?size=XL)
    if (req.query.attributeName && req.query.attributeValue) {
      filter.attributes = {
        $elemMatch: {
          name: new RegExp(`^${req.query.attributeName}$`, "i"),
          options: { $in: [new RegExp(`^${req.query.attributeValue}$`, "i")] },
        },
      };
    }

    // Price range filter
    if (req.query.minPrice || req.query.maxPrice) {
      filter["maxPrice.amount"] = {};
      if (req.query.minPrice) filter["maxPrice.amount"].$gte = Number(req.query.minPrice);
      if (req.query.maxPrice) filter["maxPrice.amount"].$lte = Number(req.query.maxPrice);
    }

    // Sorting
    let sort = { createdAt: -1 };
    if (req.query.sort === "price_asc") sort = { "maxPrice.amount": 1 };
    if (req.query.sort === "price_desc") sort = { "maxPrice.amount": -1 };
    if (req.query.sort === "rating") sort = { averageRating: -1 };
    if (req.query.sort === "oldest") sort = { createdAt: 1 };

    const total = await productModel.countDocuments(filter);
    const products = await productModel
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .populate("category", "name slug")
      .populate("subcategories", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic");

    return res.status(200).json({
      success: true,
      count: products.length,
      total,
      page,
      pages: Math.ceil(total / limit),
      data: products,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch products",
    });
  }
};

/**
 * @desc    AI Smart Hybrid Search (Natural text prompt & keyword matching)
 * @route   GET /api/products/search/ai
 * @access  Public
 */
export const aiSearchProducts = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q || !q.trim()) {
      return res.status(400).json({
        success: false,
        message: "Search query string 'q' is required",
      });
    }

    const queryText = q.trim();

    // Generate local 384-dimensional vector embedding for prompt
    const queryEmbedding = await generateTextEmbedding(queryText);

    const candidates = await productModel
      .find({ status: "published" })
      .select("+embedding")
      .populate("category", "name slug")
      .populate("subcategories", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic");

    let results = [];

    if (queryEmbedding && queryEmbedding.length > 0) {
      // Calculate Cosine Similarity with vector embeddings
      results = candidates.map((product) => {
        let score = 0;
        if (product.embedding && product.embedding.length === queryEmbedding.length) {
          score = cosineSimilarity(queryEmbedding, product.embedding);
        }

        // Title match boost
        if (product.title.toLowerCase().includes(queryText.toLowerCase())) {
          score += 0.3;
        }

        return { product, score };
      });

      results.sort((a, b) => b.score - a.score);
      results = results.map((r) => r.product);
    } else {
      // Fallback: MongoDB Text Index Search
      results = await productModel
        .find({ $text: { $search: queryText }, status: "published" })
        .populate("category", "name slug")
        .populate("brand", "name slug image")
        .populate("seller", "fullname profilePic");
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results.slice(0, 20),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "AI search failed",
    });
  }
};

/**
 * @desc    AI Visual Photo Search (Camera photo matching / Google Lens style)
 * @route   POST /api/products/search/visual
 * @access  Public
 */
export const aiImageSearchProducts = async (req, res) => {
  try {
    let imageUrl = req.body.imageUrl;

    // If file uploaded via multipart form data
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadRes = await uploadFile({
        file: req.files[0].buffer,
        filename: `search_${Date.now()}.jpg`,
        folder: "/search",
      });
      imageUrl = uploadRes.url;
    }

    if (!imageUrl) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file or provide an imageUrl",
      });
    }

    // Generate visual feature vector using CLIP model
    const imageEmbedding = await generateImageEmbedding(imageUrl);

    const candidates = await productModel
      .find({ status: "published" })
      .select("+imageEmbedding")
      .populate("category", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic");

    let results = [];

    if (imageEmbedding && imageEmbedding.length > 0) {
      results = candidates.map((product) => {
        let score = 0;
        if (product.imageEmbedding && product.imageEmbedding.length === imageEmbedding.length) {
          score = cosineSimilarity(imageEmbedding, product.imageEmbedding);
        }
        return { product, score };
      });

      results.sort((a, b) => b.score - a.score);
      results = results.map((r) => r.product);
    } else {
      results = candidates;
    }

    return res.status(200).json({
      success: true,
      count: results.length,
      data: results.slice(0, 20),
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Visual image search failed",
    });
  }
};
