import productModel from "../models/product.model.js";
import categoryModel from "../models/category.model.js";
import brandModel from "../models/brand.model.js";
import { generateTextEmbedding, buildProductTextForEmbedding } from "../utils/aiEmbedding.js";
import { uploadFile } from "../services/imageKit.service.js";

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

    // If images were uploaded via multipart form data (req.files buffer)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const uploadedImages = [];
      for (let i = 0; i < req.files.length; i++) {
        const file = req.files[i];
        const uploadRes = await uploadFile({
          file: file.buffer,
          filename: `product_${Date.now()}_${i}.${file.originalname.split(".").pop() || "jpg"}`,
          folder: "/products",
        });
        uploadedImages.push({
          url: uploadRes.url,
          isPrimary: i === 0,
        });
      }
      productData.images = uploadedImages;
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
 * @desc    Get Similar / Related Products (for product detail page recommendations)
 * @route   GET /api/products/:id/similar
 * @access  Public
 */
export const getSimilarProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // Find published products in the same category or brand, excluding current product
    const filter = {
      _id: { $ne: product._id },
      status: "published",
      $or: [{ category: product.category }, { brand: product.brand }],
    };

    const similarProducts = await productModel
      .find(filter)
      .limit(8)
      .populate("category", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic");

    return res.status(200).json({
      success: true,
      count: similarProducts.length,
      data: similarProducts,
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch similar products",
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

    // Brand filter
    if (req.query.brand) {
      filter.brand = req.query.brand;
    }

    // In Stock Only filter
    if (req.query.inStockOnly === "true") {
      filter.stockStatus = "instock";
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
