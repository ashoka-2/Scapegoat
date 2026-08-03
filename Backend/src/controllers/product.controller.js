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
  const sellerId = product.seller?._id ? product.seller._id : product.seller;
  const userId = user._id ? user._id : user.id;
  if (!sellerId || !userId) return false;
  return String(sellerId) === String(userId);
};

/**
 * Helper to generate 384-dimensional text vector embedding for a product (title, description, tags, category)
 */
const processProductTextEmbedding = async (targetProduct) => {
  try {
    const textToEmbed = buildProductTextForEmbedding(targetProduct);
    if (textToEmbed) {
      const textVec = await generateTextEmbedding(textToEmbed);
      if (textVec && textVec.length > 0) {
        targetProduct.embedding = textVec;
      }
    }
  } catch (err) {
    console.warn("[AI Search] Text embedding generation warning:", err.message);
  }
};

/**
 * Helper to generate visual vector embeddings for all main product images & variant images
 */
const processProductImageEmbeddings = async (targetProduct) => {
  try {
    // 1. Process Main Product Images (up to 7 images)
    if (targetProduct.images && Array.isArray(targetProduct.images) && targetProduct.images.length > 0) {
      for (let i = 0; i < targetProduct.images.length; i++) {
        const imgObj = targetProduct.images[i];
        const imgUrl = typeof imgObj === "string" ? imgObj : imgObj?.url;
        if (imgUrl) {
          try {
            const imgVec = await generateImageEmbedding(imgUrl);
            if (imgVec && imgVec.length > 0) {
              if (typeof imgObj === "object") {
                imgObj.embedding = imgVec;
              }
              // Set root-level imageEmbedding as primary cover photo shortcut
              if (i === 0 || imgObj?.isPrimary) {
                targetProduct.imageEmbedding = imgVec;
              }
            }
          } catch (err) {
            console.warn(`[AI Visual Search] Main image ${i} embedding warning:`, err.message);
          }
        }
      }
    }

    // 2. Process Variant Images (up to 7 images per variant)
    if (targetProduct.variants && Array.isArray(targetProduct.variants) && targetProduct.variants.length > 0) {
      for (let vIdx = 0; vIdx < targetProduct.variants.length; vIdx++) {
        const variant = targetProduct.variants[vIdx];
        if (variant && variant.images && Array.isArray(variant.images) && variant.images.length > 0) {
          for (let imgIdx = 0; imgIdx < variant.images.length; imgIdx++) {
            const vImgObj = variant.images[imgIdx];
            const vImgUrl = typeof vImgObj === "string" ? vImgObj : vImgObj?.url;
            if (vImgUrl) {
              try {
                const vImgVec = await generateImageEmbedding(vImgUrl);
                if (vImgVec && vImgVec.length > 0 && typeof vImgObj === "object") {
                  vImgObj.embedding = vImgVec;
                }
              } catch (err) {
                console.warn(`[AI Visual Search] Variant ${vIdx} image ${imgIdx} embedding warning:`, err.message);
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[AI Visual Search] Error processing product image embeddings:", err.message);
  }
};

/**
 * Master Helper to generate both Text & Image AI Vector Embeddings for a Product
 */
const generateAllProductEmbeddings = async (targetProduct) => {
  await Promise.all([
    processProductTextEmbedding(targetProduct),
    processProductImageEmbeddings(targetProduct),
  ]);
};

/**
 * Helper to upload raw image files & external URLs to ImageKit in PARALLEL with a safety timeout
 */
const processImageUploadsParallel = async (files = [], rawUrls = []) => {
  const tasks = [];

  // 1. Process Multer file buffers in parallel
  if (files && files.length > 0) {
    files.forEach((file, i) => {
      tasks.push(
        (async () => {
          try {
            const ext = file.originalname ? file.originalname.split(".").pop() : "jpg";
            const uploadRes = await Promise.race([
              uploadFile({
                file: file.buffer,
                filename: `product_${Date.now()}_${i}.${ext}`,
                folder: "/products",
              }),
              new Promise((_, reject) => setTimeout(() => reject(new Error("Upload timeout")), 5000)),
            ]);
            if (uploadRes && uploadRes.url) {
              return { url: uploadRes.url };
            }
          } catch (err) {
            console.warn(`[ImageKit File Upload Warning]:`, err.message);
          }
          return null;
        })()
      );
    });
  }

  // 2. Process image URLs (ImageKit URLs, Base64, or external URLs) in parallel
  if (rawUrls && rawUrls.length > 0) {
    rawUrls.forEach((urlStr, i) => {
      if (!urlStr || typeof urlStr !== "string" || !urlStr.trim()) return;
      const cleanUrl = urlStr.trim();

      tasks.push(
        (async () => {
          // If already ImageKit URL, return immediately without re-uploading!
          if (cleanUrl.includes("imagekit.io")) {
            return { url: cleanUrl };
          }

          if (cleanUrl.startsWith("data:image")) {
            try {
              const uploadRes = await Promise.race([
                uploadFile({
                  file: cleanUrl,
                  filename: `product_b64_${Date.now()}_${i}.jpg`,
                  folder: "/products",
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("Base64 upload timeout")), 5000)),
              ]);
              if (uploadRes && uploadRes.url) return { url: uploadRes.url };
            } catch (err) {
              console.warn(`[ImageKit Base64 Upload Warning]:`, err.message);
            }
            return null;
          }

          if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
            try {
              const uploadRes = await Promise.race([
                uploadFile({
                  file: cleanUrl,
                  filename: `product_ext_${Date.now()}_${i}.jpg`,
                  folder: "/products",
                }),
                new Promise((_, reject) => setTimeout(() => reject(new Error("External URL upload timeout")), 4000)),
              ]);
              if (uploadRes && uploadRes.url) return { url: uploadRes.url };
            } catch (err) {
              console.warn(`[ImageKit External URL Upload Warning]: ${err.message} - Using original URL.`);
            }
            return { url: cleanUrl };
          }

          return null;
        })()
      );
    });
  }

  const results = await Promise.all(tasks);
  const uploadedImages = [];

  results.forEach((res) => {
    if (res && res.url) {
      uploadedImages.push({
        url: res.url,
        isPrimary: uploadedImages.length === 0,
      });
    }
  });

  return uploadedImages;
};

/**
 * Helper to upload variant base64 & external image links to ImageKit in parallel
 */
const processVariantImagesUpload = async (variants = []) => {
  if (!variants || !Array.isArray(variants) || variants.length === 0) return;

  for (let vIdx = 0; vIdx < variants.length; vIdx++) {
    const variant = variants[vIdx];
    if (variant && variant.images && Array.isArray(variant.images) && variant.images.length > 0) {
      const tasks = [];

      variant.images.forEach((imgObj, imgIdx) => {
        const cleanUrl = typeof imgObj === "string" ? imgObj.trim() : imgObj?.url?.trim();
        if (!cleanUrl) return;

        tasks.push(
          (async () => {
            if (cleanUrl.includes("imagekit.io")) {
              return { url: cleanUrl };
            }

            if (cleanUrl.startsWith("data:image")) {
              try {
                const uploadRes = await Promise.race([
                  uploadFile({
                    file: cleanUrl,
                    filename: `variant_${vIdx}_${Date.now()}_${imgIdx}.jpg`,
                    folder: "/products/variants",
                  }),
                  new Promise((_, reject) => setTimeout(() => reject(new Error("Base64 upload timeout")), 5000)),
                ]);
                if (uploadRes && uploadRes.url) return { url: uploadRes.url };
              } catch (err) {
                console.warn(`[ImageKit Variant Base64 Upload Warning]:`, err.message);
              }
              return null;
            }

            if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
              try {
                const uploadRes = await Promise.race([
                  uploadFile({
                    file: cleanUrl,
                    filename: `variant_${vIdx}_${Date.now()}_${imgIdx}.jpg`,
                    folder: "/products/variants",
                  }),
                  new Promise((_, reject) => setTimeout(() => reject(new Error("External URL upload timeout")), 4000)),
                ]);
                if (uploadRes && uploadRes.url) return { url: uploadRes.url };
              } catch (err) {
                console.warn(`[ImageKit Variant External URL Upload Warning]: ${err.message} - Using original URL.`);
              }
              return { url: cleanUrl };
            }

            return { url: cleanUrl };
          })()
        );
      });

      const results = await Promise.all(tasks);
      const updatedImages = [];

      results.forEach((res) => {
        if (res && res.url) {
          updatedImages.push({ url: res.url });
        }
      });

      variant.images = updatedImages;
    }
  }
};

/**
 * Helper to ensure every variant has an explicitly populated attributes map (e.g. { Size: "S", Color: "Pink" })
 */
const ensureVariantAttributesMap = (variants = [], mainAttributes = []) => {
  if (!Array.isArray(variants) || variants.length === 0) return variants;

  return variants.map((v) => {
    const attrMap = {};

    // 1. Check existing attributes object/map
    if (v.attributes) {
      const raw =
        typeof v.attributes.forEach === "function"
          ? Object.fromEntries(v.attributes)
          : v.attributes instanceof Map
          ? Object.fromEntries(v.attributes)
          : v.attributes._doc || v.attributes;

      if (raw && typeof raw === "object") {
        Object.entries(raw).forEach(([k, val]) => {
          if (val) {
            const cleanVals = Array.isArray(val)
              ? val
              : typeof val === "string" && val.includes(",")
              ? val.split(",").map((s) => s.trim()).filter(Boolean)
              : [val];
            attrMap[k] = cleanVals.length > 1 ? cleanVals : cleanVals[0];
          }
        });
      }
    }

    // 2. Infer missing attributes from variant.name against mainAttributes
    if (Array.isArray(mainAttributes) && mainAttributes.length > 0) {
      const vTokens = (v.name || "").toLowerCase().split(/[\s/\-,_]+/);

      mainAttributes.forEach((attr) => {
        const attrName = attr.name || attr.key;
        if (!attrName) return;

        const keyLower = attrName.toLowerCase();
        const hasKey = Object.keys(attrMap).some((k) => k.toLowerCase() === keyLower);

        if (!hasKey) {
          const options = attr.options || attr.values || [];
          const foundOpt = options.find((opt) => {
            const optLower = String(opt).trim().toLowerCase();
            const optWords = optLower.split(/\s+/).filter(Boolean);
            if (optWords.length > 1) {
              return optWords.every((w) => (v.name || "").toLowerCase().includes(w));
            }
            return vTokens.some((t) => t === optLower);
          });

          if (foundOpt) {
            attrMap[attrName] = foundOpt;
          }
        }
      });
    }

    return {
      ...v,
      attributes: attrMap,
    };
  });
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

    // Extract rawUrls from request body
    let rawUrls = [];
    if (req.body.imageUrls) {
      rawUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls];
    } else {
      Object.keys(req.body).forEach((key) => {
        if (key.startsWith("imageUrls")) {
          rawUrls.push(req.body[key]);
        }
      });
    }

    // Process all file uploads and external image URLs in PARALLEL (<1-2s total!)
    const uploadedImages = await processImageUploadsParallel(req.files || [], rawUrls);

    if (uploadedImages.length > 0) {
      productData.images = uploadedImages;
    }

    const finalStatus = productData.status || "published";
    if (finalStatus === "published" && uploadedImages.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least 1 product image is required to publish a product listing.",
      });
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

    if (typeof productData.downloadableFiles === "string") {
      try {
        productData.downloadableFiles = JSON.parse(productData.downloadableFiles);
      } catch (e) {}
    }

    if (typeof productData.bulkDiscountRules === "string") {
      try {
        productData.bulkDiscountRules = JSON.parse(productData.bulkDiscountRules);
      } catch (e) {}
    }

    if (typeof productData.seo === "string") {
      try {
        productData.seo = JSON.parse(productData.seo);
      } catch (e) {}
    }

    // Process & upload any variant base64/external image links in parallel to ImageKit
    if (productData.variants) {
      productData.variants = ensureVariantAttributesMap(productData.variants, productData.attributes);
      await processVariantImagesUpload(productData.variants);
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

    // Trigger AI Text & Image vector embedding generation in background (Non-Blocking)
    setImmediate(async () => {
      try {
        const doc = await productModel.findById(newProduct._id);
        if (doc) {
          await generateAllProductEmbeddings(doc);
          await doc.save();
          console.log(`[AI Search] Background embeddings generated for: ${doc.title}`);
        }
      } catch (err) {
        console.warn("[AI Search] Background embedding notice:", err.message);
      }
    });

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

    let rawUrls = [];
    if (req.body.imageUrls) {
      rawUrls = Array.isArray(req.body.imageUrls) ? req.body.imageUrls : [req.body.imageUrls];
    } else {
      Object.keys(req.body).forEach((key) => {
        if (key.startsWith("imageUrls")) {
          rawUrls.push(req.body[key]);
        }
      });
    }

    // Process all file uploads and external image URLs in PARALLEL (<1-2s total!)
    const updatedUploadedImages = await processImageUploadsParallel(req.files || [], rawUrls);
    // Parse JSON strings for complex fields sent via FormData
    const updateData = { ...req.body };

    if (typeof updateData.variants === "string") {
      try { updateData.variants = JSON.parse(updateData.variants); } catch (e) {}
    }
    if (typeof updateData.attributes === "string") {
      try { updateData.attributes = JSON.parse(updateData.attributes); } catch (e) {}
    }
    if (typeof updateData.downloadableFiles === "string") {
      try { updateData.downloadableFiles = JSON.parse(updateData.downloadableFiles); } catch (e) {}
    }
    if (typeof updateData.bulkDiscountRules === "string") {
      try { updateData.bulkDiscountRules = JSON.parse(updateData.bulkDiscountRules); } catch (e) {}
    }
    if (typeof updateData.seo === "string") {
      try { updateData.seo = JSON.parse(updateData.seo); } catch (e) {}
    }

    // Process & upload any variant base64/external image links in parallel to ImageKit
    if (updateData.variants) {
      updateData.variants = ensureVariantAttributesMap(updateData.variants, updateData.attributes || product.attributes);
      await processVariantImagesUpload(updateData.variants);
    }

    // Update fields
    Object.assign(product, updateData);

    if (updatedUploadedImages.length > 0) {
      product.images = updatedUploadedImages;
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

    // Trigger AI Text & Image vector embedding update in background (Non-Blocking)
    setImmediate(async () => {
      try {
        const doc = await productModel.findById(updatedProduct._id);
        if (doc) {
          await generateAllProductEmbeddings(doc);
          await doc.save();
          console.log(`[AI Search] Background embeddings updated for: ${doc.title}`);
        }
      } catch (err) {
        console.warn("[AI Search] Background embedding update notice:", err.message);
      }
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

    let product = await productModel
      .findOne(query)
      .populate("category", "name slug description image")
      .populate("brand", "name slug description image")
      .populate("unit", "name abbreviation")
      .populate("seller", "fullname email profilePic contact role");

    let matchedVariantId = null;

    // If not found by main product ID or slug, check if identifier is a Variant ID or SKU!
    if (!product) {
      const variantQuery = isMongoId
        ? { "variants._id": identifier }
        : { "variants.sku": identifier };

      product = await productModel
        .findOne(variantQuery)
        .populate("category", "name slug description image")
        .populate("brand", "name slug description image")
        .populate("unit", "name abbreviation")
        .populate("seller", "fullname email profilePic contact role");

      if (product && isMongoId) {
        const foundVariant = product.variants?.find((v) => String(v._id) === identifier);
        if (foundVariant) {
          matchedVariantId = foundVariant._id;
        }
      }
    }

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

    const productObj = product.toObject ? product.toObject() : product;
    if (matchedVariantId) {
      productObj.selectedVariantId = matchedVariantId;
    }

    // Clean top-level attributes: exclude variant-specific attributes and deduplicate options
    if (Array.isArray(productObj.attributes)) {
      const variantAttrKeys = new Set();
      if (Array.isArray(productObj.variants)) {
        productObj.variants.forEach((v) => {
          (v.dynamicAttributes || []).forEach((da) => {
            const k = da.key || da.name;
            if (k) variantAttrKeys.add(String(k).trim().toLowerCase());
          });
          if (v.attributes) {
            const raw = typeof v.attributes.forEach === "function" ? Object.fromEntries(v.attributes) : (v.attributes._doc || v.attributes);
            if (raw && typeof raw === "object") {
              Object.keys(raw).forEach((k) => variantAttrKeys.add(String(k).trim().toLowerCase()));
            }
          }
        });
      }

      productObj.attributes = productObj.attributes
        .filter((attr) => {
          const name = String(attr.name || attr.key || "").trim().toLowerCase();
          return !variantAttrKeys.has(name);
        })
        .map((attr) => ({
          ...attr,
          options: Array.from(new Set((attr.options || attr.values || []).map((o) => String(o).trim()))).filter(Boolean),
        }));
    }

    return res.status(200).json({
      success: true,
      data: productObj,
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
    const product = await productModel.findById(id).select("+embedding");

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Hard filter: same category only. productType/subcategory are no longer
    // part of an $or here — "physical" alone matched almost everything on the
    // platform, which is why unrelated items (t-shirt vs. shoe) were showing up.
    const filter = {
      _id: { $ne: product._id },
      status: "published",
      category: product.category,
    };

    let candidates = await productModel
      .find(filter)
      .select("+embedding")
      .populate("category", "name slug")
      .populate("subcategories", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic email contact");

    // If the category is thin, widen just enough to fill results — same
    // productType as a secondary (not primary) signal, still ranked below.
    if (candidates.length < 4) {
      const excludeIds = [product._id, ...candidates.map((c) => c._id)];
      const fallback = await productModel
        .find({
          _id: { $nin: excludeIds },
          status: "published",
          productType: product.productType,
        })
        .select("+embedding")
        .limit(12)
        .populate("category", "name slug")
        .populate("subcategories", "name slug")
        .populate("brand", "name slug image")
        .populate("seller", "fullname profilePic email contact");
      candidates = [...candidates, ...fallback];
    }

    // Rank by cosine similarity of text embeddings + category-match boost,
    // then drop anything below a relevance floor instead of just sorting it low.
    if (product.embedding && product.embedding.length > 0) {
      const rankedCandidates = candidates.map((item) => {
        let similarityScore = 0;
        if (item.embedding && item.embedding.length === product.embedding.length) {
          similarityScore = cosineSimilarity(product.embedding, item.embedding);
        }

        const itemCatId = item.category?._id ? item.category._id.toString() : item.category?.toString();
        const prodCatId = product.category?.toString();

        if (itemCatId && prodCatId && itemCatId === prodCatId) {
          similarityScore += 0.4;
        } else {
          similarityScore -= 0.5;
        }

        return { product: item, similarityScore };
      });

      rankedCandidates.sort((a, b) => b.similarityScore - a.similarityScore);

      // Relevance floor — cuts unrelated items rather than just ranking them last
      const relevant = rankedCandidates.filter((c) => c.similarityScore > 0.15);
      candidates = (relevant.length > 0 ? relevant : rankedCandidates).map((c) => c.product);
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

export const getYouMayAlsoLikeProducts = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await productModel.findById(id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // Same fix here: category is a hard requirement now. Brand/tags only
    // widen the pool for products that ARE already in-category.
    const filter = {
      _id: { $ne: product._id },
      status: "published",
      category: product.category,
    };

    let candidates = await productModel
      .find(filter)
      .populate("category", "name slug")
      .populate("subcategories", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic email contact");

    if (candidates.length < 4) {
      const excludeIds = [product._id, ...candidates.map((c) => c._id)];
      const fallback = await productModel
        .find({
          _id: { $nin: excludeIds },
          status: "published",
          $or: [
            { subcategories: { $in: product.subcategories || [] } },
            { brand: product.brand },
            { tags: { $in: product.tags || [] } },
          ],
        })
        .limit(12)
        .populate("category", "name slug")
        .populate("subcategories", "name slug")
        .populate("brand", "name slug image")
        .populate("seller", "fullname profilePic email contact");
      candidates = [...candidates, ...fallback];
    }

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
      .select("+imageEmbedding +images.embedding +variants.images.embedding")
      .populate("category", "name slug")
      .populate("brand", "name slug image")
      .populate("seller", "fullname profilePic");

    let results = [];

    if (imageEmbedding && imageEmbedding.length > 0) {
      results = candidates.map((product) => {
        let maxScore = 0;

        // 1. Compare against Root imageEmbedding (primary photo)
        if (product.imageEmbedding && product.imageEmbedding.length === imageEmbedding.length) {
          const s = cosineSimilarity(imageEmbedding, product.imageEmbedding);
          if (s > maxScore) maxScore = s;
        }

        // 2. Compare against every Main Product Image embedding (up to 7 images)
        if (product.images && product.images.length > 0) {
          product.images.forEach((img) => {
            if (img.embedding && img.embedding.length === imageEmbedding.length) {
              const s = cosineSimilarity(imageEmbedding, img.embedding);
              if (s > maxScore) maxScore = s;
            }
          });
        }

        // 3. Compare against every Variant Image embedding (up to 7 images per variant)
        if (product.variants && product.variants.length > 0) {
          product.variants.forEach((variant) => {
            if (variant.images && variant.images.length > 0) {
              variant.images.forEach((vImg) => {
                if (vImg.embedding && vImg.embedding.length === imageEmbedding.length) {
                  const s = cosineSimilarity(imageEmbedding, vImg.embedding);
                  if (s > maxScore) maxScore = s;
                }
              });
            }
          });
        }

        return { product, score: maxScore };
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

/**
 * @desc    Suggest catalog description based on title, category, and shortDescription
 * @route   POST /api/products/suggest-description
 * @access  Public / Private
 */
export const suggestProductDescription = async (req, res) => {
  try {
    const { title, category, shortDescription } = req.body;
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: "Product title is required to suggest a description",
      });
    }

    const titleTrim = title.trim();
    const titleWords = titleTrim.toLowerCase().split(/\s+/).filter((w) => w.length > 2);

    // 1. Search products in database with description
    const candidates = await productModel
      .find({
        description: { $exists: true, $ne: "" },
      })
      .populate("category", "name")
      .lean();

    // 2. Find best matching product based on title/category alignment
    let bestMatch = null;
    let maxScore = 0;

    for (const prod of candidates) {
      if (!prod.description || prod.description.length < 20) continue;
      if (prod.title?.toLowerCase() === titleTrim.toLowerCase()) continue;

      const candidateTitle = (prod.title || "").toLowerCase();
      const candidateCat = (prod.category?.name || "").toLowerCase();
      const candidateShort = (prod.shortDescription || "").toLowerCase();

      let score = 0;
      titleWords.forEach((w) => {
        if (candidateTitle.includes(w)) score += 3;
        if (candidateCat.includes(w)) score += 2;
        if (candidateShort.includes(w)) score += 1;
      });

      if (score > maxScore) {
        maxScore = score;
        bestMatch = prod;
      }
    }

    if (bestMatch && maxScore >= 2) {
      return res.status(200).json({
        success: true,
        matchedProductTitle: bestMatch.title,
        matchedCategory: bestMatch.category?.name || "",
        description: bestMatch.description,
      });
    }

    return res.status(200).json({
      success: true,
      matchedProductTitle: null,
      description: null,
      message: "No matching catalog description found for this title/category",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to suggest description",
    });
  }
};
