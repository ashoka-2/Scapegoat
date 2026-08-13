import productModel from "../models/product.model.js";
import { Types as MongoTypes } from "mongoose";
import categoryModel from "../models/category.model.js";
import brandModel from "../models/brand.model.js";
import orderModel from "../models/order.model.js";
import userModel from "../models/user.model.js";
import UserActivity from "../models/userActivity.model.js";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";
import { scoreForYouProducts } from "./userActivity.controller.js";
import {
  generateTextEmbedding,
  generateImageEmbedding,
  generateImageEmbeddingFromBuffer,
  generateImageEmbeddingsFromUrls,
  buildProductTextForEmbedding,
} from "../utils/aiEmbedding.js";
import { uploadFile } from "../services/imageKit.service.js";
import { broadcastUpdate } from "../services/socket.service.js";
import {
  ensurePineconeIndexes,
  pineconeReady,
  queryTextVectors,
  queryImageVectors,
  syncProductToPinecone,
  deleteProductVectors,
} from "../services/pinecone.service.js";
import {
  ensureVectorSearchIndexes,
  vectorSearchText,
  vectorSearchImages,
} from "../services/mongoVectorSearch.service.js";

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
 * Helper to normalize numeric price or price objects into standard priceSchema { amount, currency }
 */
const formatPriceInput = (val, defaultCurrency = "INR") => {
  if (val === undefined || val === null || val === "") return undefined;
  if (typeof val === "number") return { amount: val, currency: defaultCurrency };
  if (typeof val === "string") {
    const num = parseFloat(val);
    return isNaN(num) ? undefined : { amount: num, currency: defaultCurrency };
  }
  if (typeof val === "object" && val.amount !== undefined) {
    const num = parseFloat(val.amount);
    return isNaN(num) ? undefined : { amount: num, currency: val.currency || defaultCurrency };
  }
  return undefined;
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
    // Collect every image that still needs an embedding (main + variants) and
    // generate them ALL in ONE Voyage request (the free tier is 3 RPM — N
    // sequential calls would exhaust it instantly).
    const jobs = []; // { imgObj, role }
    const urlOf = (imgObj) => (typeof imgObj === "string" ? imgObj : imgObj?.url);

    if (Array.isArray(targetProduct.images)) {
      targetProduct.images.forEach((imgObj) => {
        if (urlOf(imgObj) && !(typeof imgObj === "object" && Array.isArray(imgObj.embedding) && imgObj.embedding.length > 0)) {
          jobs.push({ imgObj, role: "main" });
        }
      });
    }
    if (Array.isArray(targetProduct.variants)) {
      targetProduct.variants.forEach((variant) => {
        (variant.images || []).forEach((imgObj) => {
          if (urlOf(imgObj) && !(typeof imgObj === "object" && Array.isArray(imgObj.embedding) && imgObj.embedding.length > 0)) {
            jobs.push({ imgObj, role: "variant" });
          }
        });
      });
    }

    if (jobs.length === 0) return;

    const vectors = await generateImageEmbeddingsFromUrls(jobs.map((j) => urlOf(j.imgObj)));
    jobs.forEach((job, i) => {
      const vec = vectors[i];
      if (vec && vec.length > 0 && typeof job.imgObj === "object") {
        job.imgObj.embedding = vec;
        // Root-level imageEmbedding = primary cover photo shortcut
        const isPrimary = job.role === "main" && (job.imgObj.isPrimary || targetProduct.images?.[0] === job.imgObj);
        if (isPrimary) {
          targetProduct.imageEmbedding = vec;
        }
      }
    });
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

  // MongoDB is the source of truth — the caller saves this doc (with the new
  // Voyage vectors). Pinecone sync is attempted AFTER the vectors are on the
  // doc; any failure is recorded on pineconeSyncStatus so the scheduler can
  // retry. A Pinecone outage NEVER loses the MongoDB embedding.
  const hasVectors =
    (Array.isArray(targetProduct.embedding) && targetProduct.embedding.length > 0) ||
    (Array.isArray(targetProduct.imageEmbedding) && targetProduct.imageEmbedding.length > 0) ||
    (Array.isArray(targetProduct.images) &&
      targetProduct.images.some((i) => Array.isArray(i?.embedding) && i.embedding.length > 0));

  if (!hasVectors) {
    targetProduct.pineconeSyncStatus = "pending";
    return;
  }

  if (!process.env.PINECONE_API_KEY) {
    targetProduct.pineconeSyncStatus = "pending";
    return;
  }

  try {
    const ok = await ensurePineconeIndexes();
    if (ok) {
      const synced = await syncProductToPinecone(targetProduct);
      targetProduct.pineconeSyncStatus = synced ? "synced" : "failed";
      if (!synced) {
        console.warn(`[Pinecone] sync returned false for: ${targetProduct.title}`);
      }
    } else {
      targetProduct.pineconeSyncStatus = "pending";
    }
  } catch (err) {
    targetProduct.pineconeSyncStatus = "failed";
    console.warn(`[Pinecone] sync failed for ${targetProduct.title}:`, err.message);
  }
};

/**
 * Download an EXTERNAL image URL and re-upload it into ImageKit so every
 * product image lives in the seller's ImageKit CDN no matter how it was added
 * (local file, pasted link, or a link from another site). Falls back to the
 * original URL if the download/upload fails so product creation never breaks.
 */
const uploadImageFromUrlToImageKit = async (url, folder, filename) => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 20000);
  try {
    const resp = await fetch(url, { signal: controller.signal, redirect: "follow" });
    if (!resp.ok) throw new Error(`download failed: HTTP ${resp.status}`);
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length > 12 * 1024 * 1024) {
      throw new Error(`image too large (${(buf.length / 1024 / 1024).toFixed(1)}MB)`);
    }
    const uploadRes = await uploadFile({ file: buf, filename, folder });
    if (uploadRes && uploadRes.url) return uploadRes.url;
    throw new Error("ImageKit upload returned no URL");
  } catch (err) {
    console.warn(`[ImageKit URL Upload Warning]: ${err.message}`);
    return null;
  } finally {
    clearTimeout(timer);
  }
};

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
          // Base64 data URLs -> Upload to ImageKit
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

          // Existing HTTP/HTTPS URLs -> re-upload to ImageKit (unless already an ImageKit URL)
          if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
            if (!cleanUrl.includes("imagekit.io")) {
              const proxied = await uploadImageFromUrlToImageKit(
                cleanUrl,
                "/products",
                `main_${Date.now()}_${i}.jpg`
              );
              if (proxied) return { url: proxied };
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
                  new Promise((_, reject) => setTimeout(() => reject(new Error("Base64 upload timeout")), 15000)),
                ]);
                if (uploadRes && uploadRes.url) return { url: uploadRes.url };
              } catch (err) {
                console.warn(`[ImageKit Variant Base64 Upload Warning]:`, err.message);
              }
              return null;
            }

            if (cleanUrl.startsWith("http://") || cleanUrl.startsWith("https://")) {
              if (!cleanUrl.includes("imagekit.io")) {
                const proxied = await uploadImageFromUrlToImageKit(
                  cleanUrl,
                  "/products/variants",
                  `variant_${vIdx}_${Date.now()}_${imgIdx}.jpg`
                );
                if (proxied) return { url: proxied };
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
 * Normalize a single string to Title Case.
 * Short all-upper tokens (e.g. "UK", "XL") are kept as-is.
 */
const toTitleCase = (str) => {
  if (!str) return "";
  return String(str)
    .trim()
    .split(/\s+/)
    .map((token) => {
      if (/^[A-Z0-9]+$/.test(token) && token.length <= 4) return token;
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(" ");
};

/**
 * Normalize an attributes array:
 * - Title Case all attribute names; UPPERCASE all option values
 * - Merge duplicate attribute names (case-insensitive)
 * - Deduplicate option values (case-insensitive)
 */
const normalizeAttributes = (attrs = []) => {
  if (!Array.isArray(attrs)) return [];
  const result = [];

  attrs.forEach((attr) => {
    if (!attr) return;
    let normName = toTitleCase(attr.name || attr.key);
    if (!normName) return;
    // Unify Colour → Color
    if (/^colou?r$/i.test(normName)) normName = "Color";

    const rawOptions = attr.options || attr.values || [];
    const normOptions = [];
    const seenLower = new Set();
    rawOptions.forEach((opt) => {
      if (!opt) return;
      const normOpt = String(opt).trim().toUpperCase(); // values stored UPPERCASE
      const lower = normOpt.toLowerCase();
      if (!seenLower.has(lower)) {
        seenLower.add(lower);
        normOptions.push(normOpt);
      }
    });

    const existingIdx = result.findIndex(
      (r) => r.name.toLowerCase() === normName.toLowerCase()
    );

    if (existingIdx !== -1) {
      const existing = result[existingIdx];
      const existingLower = new Set(existing.options.map((o) => o.toLowerCase()));
      normOptions.forEach((o) => {
        if (!existingLower.has(o.toLowerCase())) {
          existing.options.push(o);
          existingLower.add(o.toLowerCase());
        }
      });
    } else {
      result.push({ name: normName, options: normOptions });
    }
  });

  // Sort: Color always first
  result.sort((a, b) => {
    const aIsColor = /^colou?r$/i.test(a.name);
    const bIsColor = /^colou?r$/i.test(b.name);
    if (aIsColor && !bIsColor) return -1;
    if (!aIsColor && bIsColor) return 1;
    return 0;
  });

  return result;
};

/**
 * Scheduled-status handling: a "scheduled" product with a FUTURE date stays
 * scheduled (the scheduler publishes it when the time arrives). A missing,
 * invalid, or past date means it should already be live → publish immediately.
 */
const normalizeScheduledStatus = (data) => {
  if (data && data.status === "scheduled") {
    const date = data.scheduledPublishDate ? new Date(data.scheduledPublishDate) : null;
    if (!date || isNaN(date.getTime()) || date.getTime() <= Date.now()) {
      data.status = "published";
      data.scheduledPublishDate = null;
    }
  }
  return data;
};

/**
 * Helper to ensure every variant has an explicitly populated attributes map (e.g. { Size: "S", Color: "Pink" })
 * Also infers missing attributes from variant name/SKU tokens when mainAttributes are provided.
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
          if (val !== undefined && val !== null && val !== "") {
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

    // 2. Infer missing attributes from variant.name AND variant.sku against mainAttributes
    if (Array.isArray(mainAttributes) && mainAttributes.length > 0) {
      // Combine name + SKU for broader token matching
      const combinedText = `${v.name || ""} ${v.sku || ""}`.toLowerCase();
      const vTokens = combinedText.split(/[\s/\-,_.]+/).filter(Boolean);

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
              // Multi-word option (e.g. "UK 10") — check if all words appear in name/SKU
              return optWords.every((w) => combinedText.includes(w));
            }
            // Single word — exact token match
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
/**
 * @desc    Upload a single image for use inside a product rich-text description
 * @route   POST /api/products/upload-description-image
 * @access  Private (Seller, Admin)
 * Uploads to ImageKit and returns the public URL so the RichTextEditor can insert
 * a compact <img src="https://..."> tag instead of a bloated base64 data URL.
 */
export const uploadDescriptionImage = async (req, res) => {
  try {
    if (!req.file || !req.file.buffer) {
      return res.status(400).json({
        success: false,
        message: "No image file provided. Attach the file under the field name 'image'.",
      });
    }

    const ext = req.file.originalname ? req.file.originalname.split(".").pop() : "jpg";
    const uploadRes = await Promise.race([
      uploadFile({
        file: req.file.buffer,
        filename: `desc_${Date.now()}.${ext}`,
        folder: "/products/description",
      }),
      new Promise((_, reject) => setTimeout(() => reject(new Error("Image upload timeout")), 15000)),
    ]);

    if (!uploadRes || !uploadRes.url) {
      return res.status(502).json({
        success: false,
        message: "Image upload to ImageKit failed. Please try again.",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Description image uploaded successfully",
      url: uploadRes.url,
    });
  } catch (error) {
    console.error("Error uploading description image:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to upload description image",
    });
  }
};

export const createProduct = async (req, res) => {
  try {
    const productData = {
      ...req.body,
      seller: req.user._id,
      status: req.body.status || "published",
    };

    // Extract rawUrls from request body (supports array, JSON string, or indexed keys)
    let rawUrls = [];
    if (req.body.imageUrls) {
      if (Array.isArray(req.body.imageUrls)) {
        rawUrls = req.body.imageUrls;
      } else if (typeof req.body.imageUrls === "string") {
        if (req.body.imageUrls.startsWith("[")) {
          try {
            rawUrls = JSON.parse(req.body.imageUrls);
          } catch (e) {
            rawUrls = [req.body.imageUrls];
          }
        } else {
          rawUrls = [req.body.imageUrls];
        }
      }
    }

    Object.keys(req.body).forEach((key) => {
      if (key.startsWith("imageUrls") && key !== "imageUrls") {
        const val = req.body[key];
        if (Array.isArray(val)) rawUrls.push(...val);
        else if (val) rawUrls.push(val);
      }
    });

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
    if (Array.isArray(productData.attributes)) {
      productData.attributes = normalizeAttributes(productData.attributes);
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

    if (productData.costPrice !== undefined) {
      if (typeof productData.costPrice === "string" && productData.costPrice.startsWith("{")) {
        try { productData.costPrice = JSON.parse(productData.costPrice); } catch (e) {}
      }
      const parsedCost = formatPriceInput(productData.costPrice);
      if (parsedCost) productData.costPrice = parsedCost;
      else delete productData.costPrice;
    }

    // Process & upload any variant base64/external image links in parallel to ImageKit
    if (productData.variants) {
      productData.variants = ensureVariantAttributesMap(productData.variants, productData.attributes);
      await processVariantImagesUpload(productData.variants);
    }

    const newProduct = await productModel.create(normalizeScheduledStatus(productData));

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
      if (Array.isArray(req.body.imageUrls)) {
        rawUrls = req.body.imageUrls;
      } else if (typeof req.body.imageUrls === "string") {
        if (req.body.imageUrls.startsWith("[")) {
          try {
            rawUrls = JSON.parse(req.body.imageUrls);
          } catch (e) {
            rawUrls = [req.body.imageUrls];
          }
        } else {
          rawUrls = [req.body.imageUrls];
        }
      }
    }

    Object.keys(req.body).forEach((key) => {
      if (key.startsWith("imageUrls") && key !== "imageUrls") {
        const val = req.body[key];
        if (Array.isArray(val)) rawUrls.push(...val);
        else if (val) rawUrls.push(val);
      }
    });

    // Helper to convert FormData flat keys (maxPrice[amount], dimensions[length], seo[metaTitle], etc.) into nested Objects
    const parseFlatFormData = (bodyData) => {
      const data = { ...bodyData };

      if (data["maxPrice[amount]"] !== undefined) {
        data.maxPrice = {
          amount: Number(data["maxPrice[amount]"]),
          currency: data["maxPrice[currency]"] || "INR",
        };
        delete data["maxPrice[amount]"];
        delete data["maxPrice[currency]"];
      }

      if (data["sellingPrice[amount]"] !== undefined) {
        data.sellingPrice = {
          amount: Number(data["sellingPrice[amount]"]),
          currency: data["sellingPrice[currency]"] || "INR",
        };
        delete data["sellingPrice[amount]"];
        delete data["sellingPrice[currency]"];
      }

      if (data["costPrice[amount]"] !== undefined) {
        data.costPrice = {
          amount: Number(data["costPrice[amount]"]),
          currency: data["costPrice[currency]"] || "INR",
        };
        delete data["costPrice[amount]"];
        delete data["costPrice[currency]"];
      }

      if (
        data["dimensions[length]"] !== undefined ||
        data["dimensions[width]"] !== undefined ||
        data["dimensions[height]"] !== undefined
      ) {
        data.dimensions = {
          length: Number(data["dimensions[length]"] || 0),
          width: Number(data["dimensions[width]"] || 0),
          height: Number(data["dimensions[height]"] || 0),
          unit: data["dimensions[unit]"] || "cm",
        };
        delete data["dimensions[length]"];
        delete data["dimensions[width]"];
        delete data["dimensions[height]"];
        delete data["dimensions[unit]"];
      }

      if (
        data["seo[metaTitle]"] !== undefined ||
        data["seo[metaDescription]"] !== undefined ||
        data["seo[canonicalUrl]"] !== undefined
      ) {
        data.seo = {
          metaTitle: data["seo[metaTitle]"] || "",
          metaDescription: data["seo[metaDescription]"] || "",
          canonicalUrl: data["seo[canonicalUrl]"] || "",
        };
        delete data["seo[metaTitle]"];
        delete data["seo[metaDescription]"];
        delete data["seo[canonicalUrl]"];
      }

      ["category", "brand", "unit"].forEach((field) => {
        if (!data[field] || typeof data[field] !== "string" || !data[field].match(/^[0-9a-fA-F]{24}$/)) {
          delete data[field];
        }
      });

      return data;
    };

    // Process all file uploads and external image URLs in PARALLEL (<1-2s total!)
    const updatedUploadedImages = await processImageUploadsParallel(req.files || [], rawUrls);
    // Parse JSON strings and flat keys for complex fields sent via FormData
    const updateData = parseFlatFormData(req.body);

    if (typeof updateData.variants === "string") {
      try { updateData.variants = JSON.parse(updateData.variants); } catch (e) {}
    }
    if (typeof updateData.attributes === "string") {
      try { updateData.attributes = JSON.parse(updateData.attributes); } catch (e) {}
    }
    if (Array.isArray(updateData.attributes)) {
      updateData.attributes = normalizeAttributes(updateData.attributes);
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

    if (updateData.costPrice !== undefined) {
      if (typeof updateData.costPrice === "string" && updateData.costPrice.startsWith("{")) {
        try { updateData.costPrice = JSON.parse(updateData.costPrice); } catch (e) {}
      }
      const parsedCost = formatPriceInput(updateData.costPrice);
      if (parsedCost) updateData.costPrice = parsedCost;
      else delete updateData.costPrice;
    }

    // Process & upload any variant base64/external image links in parallel to ImageKit
    if (updateData.variants) {
      updateData.variants = ensureVariantAttributesMap(updateData.variants, updateData.attributes || product.attributes);
      await processVariantImagesUpload(updateData.variants);
    }

    // Update fields
    Object.assign(product, updateData);
    normalizeScheduledStatus(product);

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

    // If already in trash or force parameter requested -> Permanent Delete
    if (product.status === "trash" || req.query.force === "true") {
      await productModel.findByIdAndDelete(id);
      return res.status(200).json({
        success: true,
        message: "Product deleted permanently",
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

    // Remove the product's vectors from Pinecone (no-op without API key)
    deleteProductVectors(product._id);

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

    // Public visibility: only published products are visible to normal users.
    // Owners/admins may preview drafts and scheduled products.
    if (product.status !== "published") {
      const canView = req.user && isOwnerOrAdmin(product, req.user);
      if (!canView) {
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
        .map((attr) => {
          // Case-insensitive deduplication: keep first occurrence of each value
          const seen = new Map(); // lowercase -> first-seen original
          (attr.options || attr.values || []).forEach((o) => {
            const cleaned = String(o).trim();
            const lower = cleaned.toLowerCase();
            if (cleaned && !seen.has(lower)) seen.set(lower, cleaned);
          });
          return {
            ...attr,
            options: Array.from(seen.values()),
          };
        });
    }

    // ── On-the-fly attribute inference when DB attributes are empty ──
    // If root attributes array is empty but we have variants, infer attributes from variant names/SKUs
    if ((!productObj.attributes || productObj.attributes.length === 0) && Array.isArray(productObj.variants) && productObj.variants.length > 0) {
      const inferredAttrMap = new Map(); // attrName -> Map<lowercase, originalCase>

      const addToInferred = (key, val) => {
        if (!key || !val) return;
        // Normalize "colour" → "Color"
        const normKey = /^colou?r$/i.test(key.trim()) ? "Color" : toTitleCase(key);
        if (!inferredAttrMap.has(normKey)) inferredAttrMap.set(normKey, new Map());
        const valStr = String(val).trim();
        const valLower = valStr.toLowerCase();
        if (valStr && !inferredAttrMap.get(normKey).has(valLower)) {
          inferredAttrMap.get(normKey).set(valLower, valStr.toUpperCase()); // values stored UPPERCASE
        }
      };

      productObj.variants.forEach((v) => {
        let hasPopulatedAttrs = false;

        // 1. From existing variant attributes map
        if (v.attributes && typeof v.attributes === "object") {
          const raw = typeof v.attributes.forEach === "function" ? Object.fromEntries(v.attributes) : (v.attributes._doc || v.attributes || {});
          const entries = Object.entries(raw);
          if (entries.length > 0 && entries.some(([, val]) => val !== undefined && val !== null && val !== "")) {
            hasPopulatedAttrs = true;
            entries.forEach(([k, val]) => {
              if (!val) return;
              const vals = Array.isArray(val) ? val : [val];
              vals.forEach((vv) => addToInferred(k, vv));
            });
          }
        }

        // 2. Only fallback to name/SKU parsing if variant has no populated attributes
        if (!hasPopulatedAttrs) {
          const nameParts = (v.name || "").split(" - ");
          if (nameParts.length >= 2) {
            const attrPart = nameParts.slice(1).join(" - ");
            const segments = attrPart.split(/\s*\/\s*/);
            if (segments.length >= 1) addToInferred("Color", segments[0]);
            if (segments.length >= 2) addToInferred("Size", segments[1]);
          }
        }
      });

      if (inferredAttrMap.size > 0) {
        // Build attributes array, sorted: Color/Colour always first
        const attrArr = Array.from(inferredAttrMap.entries()).map(([name, valMap]) => ({
          name,
          options: Array.from(valMap.values()),
        }));
        attrArr.sort((a, b) => {
          const aIsColor = /^colou?r$/i.test(a.name);
          const bIsColor = /^colou?r$/i.test(b.name);
          if (aIsColor && !bIsColor) return -1;
          if (!aIsColor && bIsColor) return 1;
          return 0;
        });

        productObj.attributes = attrArr;
        productObj.variants = ensureVariantAttributesMap(productObj.variants, productObj.attributes);
      }
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

    // req.params values are strings — aggregation $match does NOT cast them to
    // ObjectId (find() does, aggregate() does not), so convert explicitly.
    let sellerObjectId;
    try {
      sellerObjectId = new MongoTypes.ObjectId(sellerId);
    } catch {
      return res.status(400).json({ success: false, message: "Invalid seller id" });
    }

    const filter = { seller: sellerObjectId };

    // If caller is the seller themselves or an admin, allow filtering by status (draft/trash)
    const isSelf = req.user && (req.user._id.toString() === sellerId || req.user.role === "admin");
    if (isSelf && req.query.status) {
      filter.status = req.query.status;
    } else if (!isSelf) {
      filter.status = "published";
    }

    // Single aggregation round-trip: data page + total count via $facet
    const pipeline = [
      { $match: filter },
      {
        $facet: {
          data: [
            ...productLookupStages(),
            { $sort: { createdAt: -1 } },
            { $skip: skip },
            { $limit: limit },
          ],
          total: [{ $count: "count" }],
        },
      },
    ];
    const [faceted] = await productModel.aggregate(pipeline);
    const products = faceted.data;
    const total = faceted.total && faceted.total[0] ? faceted.total[0].count : 0;

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
// ── Shared product aggregation helpers ───────────────────────────────────────
// $lookup category/subcategories/brand/seller + $project ONLY the fields the
// shop/search needs (no full-document materialization). Options:
//   { embedding }      → include the text vector
//   { imageEmbedding } → include image + variant image vectors
const productLookupStages = (opts = {}) => {
  const project = {
    title: 1, description: 1, shortDescription: 1, sku: 1, tags: 1,
    attributes: 1, variants: 1, images: 1, maxPrice: 1, sellingPrice: 1,
    price: 1, stock: 1, stockStatus: 1, slug: 1, productType: 1,
    soldCount: 1, viewCount: 1, rating: 1, reviewCount: 1, status: 1,
    createdAt: 1, isCodAvailable: 1, averageRating: 1,
    category: { name: 1, slug: 1 },
    subcategories: { name: 1, slug: 1 },
    brand: { name: 1, slug: 1, image: 1 },
    seller: { fullname: 1, profilePic: 1, email: 1, contact: 1 },
  };
  if (opts.embedding) project.embedding = 1;
  if (opts.costPrice) project.costPrice = 1;
  if (opts.imageEmbedding) {
    // images/variants are projected whole (1) — their subdocuments (incl.
    // the select:false embedding vectors) come along automatically, and
    // dotted subpaths would collide with the whole-field projection.
    project.imageEmbedding = 1;
  }

  return [
    { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "category" } },
    { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "subcategories", localField: "subcategories", foreignField: "_id", as: "subcategories" } },
    { $lookup: { from: "brands", localField: "brand", foreignField: "_id", as: "brand" } },
    { $unwind: { path: "$brand", preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "sellers", localField: "seller", foreignField: "_id", as: "seller" } },
    { $unwind: { path: "$seller", preserveNullAndEmptyArrays: true } },
    { $project: project },
  ];
};

// Full pipeline: $match + lookups/projection (+ optional $limit)
const buildProductAggregation = (match, opts = {}) => {
  const pipeline = [{ $match: match }, ...productLookupStages(opts)];
  if (opts.limit) pipeline.push({ $limit: opts.limit });
  return pipeline;
};

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

// ── AI search helpers (fuzzy matching, stop words) ───────────────────────────
// Tiny Levenshtein distance — powers typo-tolerant matching ("t-shrit" → "t-shirt")
const levenshteinDistance = (a, b) => {
  if (a === b) return 0;
  const m = a.length, n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;
  let prev = new Array(n + 1);
  let curr = new Array(n + 1);
  for (let j = 0; j <= n; j++) prev[j] = j;
  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(curr[j - 1] + 1, prev[j] + 1, prev[j - 1] + cost);
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
};

// Function words / generic shopping verbs that add no ranking signal
const SEARCH_STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "for", "of", "in", "on", "at", "to", "with",
  "buy", "get", "show", "me", "want", "need", "looking", "best", "cheap",
  "online", "price", "new", "latest", "top", "under", "from", "for", "my",
  "this", "that", "please", "help", "product", "products", "only", "no",
  "not", "without", "except", "just",
]);

// Intent words that change the meaning of the NEXT token
const NEGATION_WORDS = new Set(["no", "not", "without", "except", "exclude", "excluding", "none"]);
const REQUIREMENT_WORDS = new Set(["only", "just"]);

// Parse the query for "no X" / "only X" intents → terms to EXCLUDE / REQUIRE
const parseQueryIntents = (queryLower) => {
  // keep short intent words ("no", "not") — only the FOLLOWING term needs len > 2
  const words = queryLower.split(/\s+/).filter((w) => w.length > 1);
  const exclusions = [];
  const requirements = [];
  for (let i = 0; i < words.length; i++) {
    if (NEGATION_WORDS.has(words[i])) {
      const next = words[i + 1];
      if (next && next.length > 2) exclusions.push(next);
    } else if (REQUIREMENT_WORDS.has(words[i])) {
      const next = words[i + 1];
      if (next && next.length > 2) requirements.push(next);
    }
  }
  return { exclusions, requirements };
};

// Typo-tolerant token match: exact word OR within 1 edit distance (len >= 4)
const fuzzyIncludes = (text, token) => {
  if (!text || !token) return false;
  const t = token.toLowerCase();
  if (text.includes(t)) return true;
  if (t.length < 4) return false;
  const words = text.split(/[^a-z0-9]+/);
  for (const w of words) {
    if (Math.abs(w.length - t.length) <= 1 && levenshteinDistance(w, t) <= 1) {
      return true;
    }
  }
  return false;
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

    let candidates = await productModel.aggregate(buildProductAggregation(filter, { embedding: true }));

    // If the category is thin, widen just enough to fill results — same
    // productType as a secondary (not primary) signal, still ranked below.
    if (candidates.length < 4) {
      const excludeIds = [product._id, ...candidates.map((c) => c._id)];
      const fallback = await productModel.aggregate(
        buildProductAggregation(
          {
            _id: { $nin: excludeIds },
            status: "published",
            productType: product.productType,
          },
          { embedding: true, limit: 12 }
        )
      );
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

    let candidates = await productModel.aggregate(buildProductAggregation(filter));

    if (candidates.length < 4) {
      const excludeIds = [product._id, ...candidates.map((c) => c._id)];
      const fallback = await productModel.aggregate(
        buildProductAggregation(
          {
            _id: { $nin: excludeIds },
            status: "published",
            $or: [
              { subcategories: { $in: product.subcategories || [] } },
              { brand: product.brand },
              { tags: { $in: product.tags || [] } },
            ],
          },
          { limit: 12 }
        )
      );
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
 * @desc    Resolve the visitor identity for personalization: logged-in user
 *          (cookie/Bearer token) or anonymous visitor (X-Visitor-Id header).
 */
const resolveVisitorIdentity = async (req) => {
  const bearer =
    req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
      ? req.headers.authorization.slice(7)
      : null;
  const token = req.cookies?.token || bearer;
  if (token) {
    try {
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await userModel.findById(decoded.id);
      if (user && !user.isBanned) return { type: "user", id: user._id };
    } catch {
      /* invalid token → fall through to visitor id */
    }
  }
  const visitorId = (req.headers["x-visitor-id"] || req.query.visitorId || "")
    .toString()
    .trim()
    .slice(0, 128);
  if (visitorId) return { type: "visitor", id: visitorId };
  return null;
};

/**
 * @desc    Get all published products (search, filter, sort, paginate)
 * @route   GET /api/products/
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

    // Category filter (single ID via ?category= OR name-list via ?categories=)
    const categoryNameList = req.query.categories
      ? String(req.query.categories).split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const categoryIds = req.query.category
      ? String(req.query.category).split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    if (categoryNameList.length > 0) {
      // Shop passes NAMES — resolve to ObjectIds
      const cats = await categoryModel.find({ name: { $in: categoryNameList } }).select("_id").lean();
      const ids = cats.map((c) => c._id);
      if (ids.length === 1) filter.category = ids[0];
      else if (ids.length > 1) filter.category = { $in: ids };
    } else if (categoryIds.length === 1) {
      filter.category = categoryIds[0];
    } else if (categoryIds.length > 1) {
      filter.category = { $in: categoryIds };
    }

    // Subcategory filter (matches products with this subcategory ID)
    if (req.query.subcategory) {
      filter.subcategories = req.query.subcategory;
    }

    // Brand filter (single ID via ?brand= OR name-list via ?brands=)
    const brandNameList = req.query.brands
      ? String(req.query.brands).split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    const brandIds = req.query.brand
      ? String(req.query.brand).split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    if (brandNameList.length > 0) {
      // Shop passes NAMES — resolve to ObjectIds
      const brs = await brandModel.find({ name: { $in: brandNameList } }).select("_id").lean();
      const ids = brs.map((b) => b._id);
      if (ids.length === 1) filter.brand = ids[0];
      else if (ids.length > 1) filter.brand = { $in: ids };
    } else if (brandIds.length === 1) {
      filter.brand = brandIds[0];
    } else if (brandIds.length > 1) {
      filter.brand = { $in: brandIds };
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

    // Attribute options filter (e.g., ?color=Red,Blue or ?size=XL or
    // ?attributeName=Color&attributeValue=Black,White)
    const attrName = req.query.color ? "Color" : req.query.size ? "Size" : req.query.attributeName || null;
    const attrValues = req.query.attributeValues
      || req.query.attributeValue
      || req.query.color
      || req.query.size
      || null;
    if (attrName && attrValues) {
      const values = String(attrValues).split(",").map((v) => v.trim()).filter(Boolean);
      if (values.length > 0) {
        filter.attributes = {
          $elemMatch: {
            name: new RegExp(`^${attrName}$`, "i"),
            options: { $in: values.map((v) => new RegExp(`^${v}$`, "i")) },
          },
        };
      }
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

    // ── Personalized feed ────────────────────────────────────────────────────
    // When the visitor explicitly asks (personalized=1) with NO filters/search
    // active, rank the catalog by their activity (views, dwell, recency,
    // search affinity) — Instagram-style. Falls back to the normal listing
    // when there is no activity or no identity.
    if (req.query.personalized === "1") {
      const identity = await resolveVisitorIdentity(req);
      if (identity) {
        const activity = await UserActivity.findOne(
          identity.type === "user" ? { user: identity.id } : { visitorId: identity.id }
        ).lean();
        if (activity && activity.views && activity.views.length > 0) {
          const ranked = await scoreForYouProducts(activity, 60);
          const rankedIds = ranked.map((p) => p._id);
          if (rankedIds.length > 0) {
            const orderedPipeline = [
              { $match: { _id: { $in: rankedIds } } },
              { $addFields: { __rank: { $indexOfArray: [rankedIds, "$_id"] } } },
              { $sort: { __rank: 1 } },
              ...productLookupStages(),
              { $skip: skip },
              { $limit: limit },
            ];
            const ordered = await productModel.aggregate(orderedPipeline);
            const total = rankedIds.length;
            return res.status(200).json({
              success: true,
              count: ordered.length,
              total,
              page,
              pages: Math.ceil(total / limit),
              data: ordered,
              personalized: true,
            });
          }
        }
      }
    }

    // Single aggregation round-trip: data page + total count via $facet
    const pipeline = [
      { $match: filter },
      {
        $facet: {
          data: [
            ...productLookupStages(),
            { $sort: sort },
            { $skip: skip },
            { $limit: limit },
          ],
          total: [{ $count: "count" }],
        },
      },
    ];
    const [faceted] = await productModel.aggregate(pipeline);
    const products = faceted.data;
    const total = faceted.total && faceted.total[0] ? faceted.total[0].count : 0;

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
 * @desc    Facet values for the shop filter sidebar (brands, colors, sizes, price bounds)
 *          Computed server-side via aggregation — always reflects the FULL
 *          category scope, independent of pagination.
 * @route   GET /api/products/facets?categories=Clothing&search=...
 * @access  Public
 */
export const getProductFacets = async (req, res) => {
  try {
    const filter = { status: "published" };

    // Category scope (names, same resolution as the listing)
    const categoryNameList = req.query.categories
      ? String(req.query.categories).split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    if (categoryNameList.length > 0) {
      const cats = await categoryModel.find({ name: { $in: categoryNameList } }).select("_id").lean();
      const ids = cats.map((c) => c._id);
      if (ids.length === 1) filter.category = ids[0];
      else if (ids.length > 1) filter.category = { $in: ids };
    }

    // Brand scope (names)
    const brandNameList = req.query.brands
      ? String(req.query.brands).split(",").map((s) => s.trim()).filter(Boolean)
      : [];
    if (brandNameList.length > 0) {
      const brs = await brandModel.find({ name: { $in: brandNameList } }).select("_id").lean();
      const ids = brs.map((b) => b._id);
      if (ids.length === 1) filter.brand = ids[0];
      else if (ids.length > 1) filter.brand = { $in: ids };
    }

    const [result] = await productModel.aggregate([
      { $match: filter },
      { $lookup: { from: "categories", localField: "category", foreignField: "_id", as: "catDoc" } },
      { $unwind: { path: "$catDoc", preserveNullAndEmptyArrays: true } },
      { $lookup: { from: "brands", localField: "brand", foreignField: "_id", as: "brDoc" } },
      { $unwind: { path: "$brDoc", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$attributes", preserveNullAndEmptyArrays: true } },
      { $unwind: { path: "$attributes.options", preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: null,
          categories: { $addToSet: "$catDoc.name" },
          brands: { $addToSet: "$brDoc.name" },
          colors: {
            $addToSet: {
              $cond: [{ $eq: [{ $toLower: "$attributes.name" }, "color"] }, "$attributes.options", null],
            },
          },
          sizes: {
            $addToSet: {
              $cond: [{ $eq: [{ $toLower: "$attributes.name" }, "size"] }, "$attributes.options", null],
            },
          },
          minPrice: { $min: "$maxPrice.amount" },
          maxPrice: { $max: "$maxPrice.amount" },
        },
      },
    ]);

    const dedupeUpper = (arr) =>
      [...new Map((arr || []).filter(Boolean).map((v) => [String(v).toUpperCase(), String(v).toUpperCase()])).values()].sort();

    return res.status(200).json({
      success: true,
      data: {
        categories: (result?.categories || []).filter(Boolean).sort(),
        brands: (result?.brands || []).filter(Boolean).sort(),
        colors: dedupeUpper(result?.colors),
        sizes: dedupeUpper(result?.sizes),
        minPrice: Math.floor(result?.minPrice || 0),
        maxPrice: Math.ceil(result?.maxPrice || 50000),
      },
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to fetch facets",
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
    const queryLower = queryText.toLowerCase();

    // Check if query is a number (for price matching)
    const queryNumber = parseFloat(queryText);
    const isNumericQuery = !isNaN(queryNumber) && queryNumber > 0;

    // Parse "no X" / "only X" intents ("spiderman sneakers only no cloth products")
    const { exclusions, requirements } = parseQueryIntents(queryLower);

    // Generate Voyage query embedding (1024-dim)
    const queryEmbedding = await generateTextEmbedding(queryText);

    // ── Candidate retrieval: Pinecone PRIMARY → MongoDB Vector Search fallback ─
    let candidates = [];
    let vectorScores = null; // productId → similarity score (Pinecone or MongoVS)

    const pineconeRes = pineconeReady()
      ? await queryTextVectors(queryEmbedding, 60)
      : { ok: false, matches: [] };

    if (pineconeRes.ok) {
      // Pinecone ANSWERED — even zero matches is a legitimate result (no fallback)
      const ids = pineconeRes.matches
        .map((m) => m.id.replace(/^p:/, ""))
        .filter((id) => /^[a-f0-9]{24}$/i.test(id));
      if (ids.length > 0) {
        vectorScores = new Map(pineconeRes.matches.map((m) => [m.id.replace(/^p:/, ""), m.score]));
        candidates = await productModel.aggregate(
          buildProductAggregation(
            { status: "published", _id: { $in: ids.map((id) => new MongoTypes.ObjectId(id)) } },
            { embedding: true }
          )
        );
      }
    } else if (queryEmbedding && queryEmbedding.length > 0) {
      // Pinecone unavailable/error/quota → MongoDB Atlas Vector Search fallback.
      // The score comes from the $vectorSearch metadata (no JS cosine).
      const vs = await vectorSearchText(queryEmbedding, 40);
      if (vs.length > 0) {
        vectorScores = new Map(vs.map((r) => [String(r.product._id), r.score]));
        candidates = vs.map((r) => r.product);
      }
    }

    let results = [];

    // Score every candidate using a multi-signal algorithm
    results = candidates.map((product) => {
      let score = 0;
      const titleLower = (product.title || "").toLowerCase();
      const descLower = (product.description || "").toLowerCase();
      const shortDescLower = (product.shortDescription || "").toLowerCase();
      const skuLower = (product.sku || "").toLowerCase();
      const catLower = (product.category?.name || "").toLowerCase();
      const brandLower = (product.brand?.name || "").toLowerCase();
      const tagsLower = Array.isArray(product.tags) ? product.tags.join(" ").toLowerCase() : "";

      // Build attribute text from variants
      let attrText = "";
      (product.variants || []).forEach((v) => {
        if (v.name) attrText += " " + v.name;
        if (v.sku) attrText += " " + v.sku;
        const rawAttrs = v.attributes instanceof Map
          ? Object.fromEntries(v.attributes)
          : (v.attributes?._doc || v.attributes || {});
        Object.values(rawAttrs).forEach((val) => {
          attrText += " " + (Array.isArray(val) ? val.join(" ") : String(val || ""));
        });
        (v.dynamicAttributes || []).forEach((da) => {
          attrText += " " + (da.key || "") + " " + (da.values || da.options || []).join(" ");
        });
      });
      const attrLower = attrText.toLowerCase();

      // "no X" intent: hard-exclude products matching an excluded term
      // (e.g. "no cloth products" excludes the Clothing category)
      for (const ex of exclusions) {
        if (
          fuzzyIncludes(titleLower, ex) ||
          fuzzyIncludes(catLower, ex) ||
          fuzzyIncludes(attrLower, ex) ||
          fuzzyIncludes(brandLower, ex)
        ) {
          score = -1;
          break;
        }
      }
      if (score === -1) return { product, score, reasons: ["Excluded (no match)"] };

      // "only X" intent: products not matching the required term are heavily
      // penalized so they sink below genuine matches
      for (const req of requirements) {
        if (!fuzzyIncludes(titleLower, req) && !fuzzyIncludes(catLower, req) && !fuzzyIncludes(attrLower, req)) {
          score *= 0.15;
          break;
        }
      }

      // Signal 1: Vector similarity (0-1) — semantic meaning, weighted up so
      // semantic matches dominate. The score comes from Pinecone or the
      // MongoDB $vectorSearch fallback — never recomputed in JS.
      let vectorScore = 0;
      if (vectorScores && vectorScores.has(String(product._id))) {
        vectorScore = vectorScores.get(String(product._id)) || 0;
      }
      score += vectorScore * 1.25;
      const reasons = [];
      const noteReason = (label) => {
        if (reasons.length < 4 && !reasons.includes(label)) reasons.push(label);
      };
      if (vectorScore >= 0.55) noteReason("Semantically similar");

      // Signal 2: SKU exact match (highest priority)
      if (skuLower && skuLower === queryLower) {
        score += 2.0;
      }

      // Signal 3: Title direct match (very high priority)
      if (titleLower === queryLower) {
        score += 1.5;
      } else if (titleLower.includes(queryLower)) {
        score += 0.8;
      }

      // Signal 4: Category / Brand match
      if (catLower.includes(queryLower)) score += 0.5;
      if (brandLower.includes(queryLower)) score += 0.5;

      // Signal 5: Tags match
      if (tagsLower.includes(queryLower)) score += 0.4;

      // Signal 6: Attribute match (color, size, etc.)
      if (attrLower.includes(queryLower)) score += 0.35;

      // Signal 7: Description match (lower weight)
      if (descLower.includes(queryLower)) score += 0.2;
      if (shortDescLower.includes(queryLower)) score += 0.15;

      // Signal 8: Token-level matching — stop-word filtered + typo-tolerant (fuzzy)
      const queryWords = queryLower.split(/\s+/).filter((w) => w.length > 1 && !SEARCH_STOP_WORDS.has(w));
      queryWords.forEach((w) => {
        if (fuzzyIncludes(titleLower, w)) {
          score += 0.35;
          if (!reasons.includes(`Matched "${w}"`)) reasons.push(`Matched "${w}"`);
        }
        if (fuzzyIncludes(catLower, w)) {
          score += 0.12;
          if (product.category?.name && !reasons.includes(`Category: ${product.category.name}`)) reasons.push(`Category: ${product.category.name}`);
        }
        if (fuzzyIncludes(brandLower, w)) {
          score += 0.12;
          if (product.brand?.name && !reasons.includes(`Brand: ${product.brand.name}`)) reasons.push(`Brand: ${product.brand.name}`);
        }
        if (fuzzyIncludes(tagsLower, w)) score += 0.08;
        if (fuzzyIncludes(attrLower, w)) score += 0.08;
      });

      // Signal 10: Attribute-aware boost — the query literally mentions this
      // product's attribute VALUES (e.g. "red", "xxl", "cotton", "linen")
      const attrValueSet = new Set();
      (product.attributes || []).forEach((attr) => {
        (attr.options || attr.values || []).forEach((opt) => {
          const v = String(opt || "").toLowerCase().trim();
          if (v.length >= 2) attrValueSet.add(v);
        });
      });
      (product.variants || []).forEach((v) => {
        const rawAttrs2 = v.attributes instanceof Map
          ? Object.fromEntries(v.attributes)
          : (v.attributes?._doc || v.attributes || {});
        Object.values(rawAttrs2).forEach((val) => {
          const v = String(val || "").toLowerCase().trim();
          if (v.length >= 2) attrValueSet.add(v);
        });
      });
      attrValueSet.forEach((av) => {
        if (av.length >= 3 && queryLower.includes(av)) {
          score += 0.3;
          noteReason(`Attribute: ${av}`);
        }
      });

      // Signal 9: Number-as-price matching
      if (isNumericQuery) {
        const productPrice = product.sellingPrice?.amount || product.maxPrice?.amount || 0;
        const tolerance = queryNumber * 0.1; // ±10%
        if (productPrice > 0 && Math.abs(productPrice - queryNumber) <= tolerance) {
          score += 0.6;
        }
        // Also check if the number appears in title/description as text
        if (titleLower.includes(queryText) || descLower.includes(queryText)) {
          score += 0.5;
        }
      }

      return { product, score, reasons };
    });

    // Apply minimum similarity threshold — only return genuinely matching products
    const MIN_MATCH_SCORE = 0.35;
    results = results.filter((r) => r.score >= MIN_MATCH_SCORE);

    // Sort by score descending
    results.sort((a, b) => b.score - a.score);

    const sliced = results.slice(0, 20);
    const reasonsMap = {};
    sliced.forEach((r) => {
      reasonsMap[String(r.product._id)] = r.reasons || [];
    });

    return res.status(200).json({
      success: true,
      count: sliced.length,
      data: sliced.map((r) => r.product),
      reasons: reasonsMap,
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
    let imageUrl = req.body.imageUrl || null;
    let imageEmbedding = [];

    // PRIVACY-FIRST: the query image is embedded in memory and immediately
    // discarded — it is NEVER uploaded to ImageKit, written to disk, or stored
    // in the database.
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const file = req.files[0];
      imageEmbedding = await generateImageEmbeddingFromBuffer(
        file.buffer,
        file.mimetype || "image/jpeg"
      );
    } else if (imageUrl) {
      imageEmbedding = await generateImageEmbedding(imageUrl);
    }

    if (!imageEmbedding || imageEmbedding.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Could not create an embedding from the image. Please upload a clear product photo.",
      });
    }

    // ── Candidate retrieval: Pinecone image ANN PRIMARY, MongoVS fallback ─────
    let candidates = [];
    let vectorScores = null; // productId → best image score (Pinecone or MongoVS)

    const pineconeRes = pineconeReady()
      ? await queryImageVectors(imageEmbedding, 60)
      : { ok: false, matches: [] };

    if (pineconeRes.ok) {
      // Pinecone ANSWERED — even zero matches is a legitimate result (no fallback)
      if (pineconeRes.matches.length > 0) {
        // Group the matched IMAGES by product, keeping each product's best score
        const byProduct = new Map();
        pineconeRes.matches.forEach((m) => {
          const pid = m.metadata?.productId;
          if (!pid) return;
          const cur = byProduct.get(pid);
          if (cur === undefined || m.score > cur) byProduct.set(pid, m.score);
        });
        const ids = [...byProduct.keys()].filter((id) => /^[a-f0-9]{24}$/i.test(id));
        if (ids.length > 0) {
          vectorScores = byProduct;
          candidates = await productModel.aggregate(
            buildProductAggregation(
              { status: "published", _id: { $in: ids.map((id) => new MongoTypes.ObjectId(id)) } },
              { imageEmbedding: true }
            )
          );
        }
      }
    } else if (imageEmbedding && imageEmbedding.length > 0) {
      // Pinecone unavailable/error/quota → MongoDB Atlas Vector Search fallback
      // (root + nested image vectors merged; scores from $vectorSearch meta).
      const vs = await vectorSearchImages(imageEmbedding, 40);
      if (vs.length > 0) {
        vectorScores = new Map(vs.map((r) => [String(r.product._id), r.score]));
        candidates = vs.map((r) => r.product);
      }
    }

    let results = [];

    if (imageEmbedding && imageEmbedding.length > 0) {
      if (vectorScores) {
        // Scores came straight from Pinecone or MongoVS — no local cosine
        results = candidates.map((product) => ({
          product,
          score: vectorScores.get(String(product._id)) || 0,
        }));
      } else {
        results = candidates.map((product) => ({ product, score: 0 }));
      }

      results.sort((a, b) => b.score - a.score);

      // Return the genuinely-close matches. Smart rule (measured against real
      // user photos): the closest product always shows when it scores ≥ 0.45,
      // and we GUARANTEE the top-5 ranked matches are returned — so a similar
      // product photographed differently (0.49–0.63) always surfaces, while
      // truly unrelated images (best < 0.45) still return no matches.
      const MIN_VISUAL_SCORE = parseFloat(req.query.threshold) || 0.45;
      const floor = Math.max(
        MIN_VISUAL_SCORE,
        results[4]?.score ?? MIN_VISUAL_SCORE // 5th-best keeps the top-5 ranked
      );
      results = results.filter((r) => r.score >= floor);
      results = results.map((r) => r.product);
    } else {
      results = candidates;
    }

    // Strip embedding vectors from the payload — the client only displays the
    // products (embeddings would bloat the response + sessionStorage).
    results.forEach((p) => {
      delete p.imageEmbedding;
      (p.images || []).forEach((img) => delete img.embedding);
      (p.variants || []).forEach((v) => (v.images || []).forEach((vi) => delete vi.embedding));
    });

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

/**
 * @desc    Get Seller Performance Analytics, Profit & Loss Breakdown & Top Sold Items
 * @route   GET /api/products/seller-analytics
 * @access  Private (Seller, Admin)
 */
export const getSellerAnalytics = async (req, res) => {
  try {
    const sellerId = req.user._id;

    // 1. Seller products (with costPrice) via aggregation
    const sellerProducts = await productModel.aggregate(
      buildProductAggregation({ seller: sellerId }, { costPrice: true })
    );

    const productMap = new Map();
    sellerProducts.forEach((p) => {
      productMap.set(String(p._id), p);
    });

    // 2. Order analytics — one aggregation: unwind orderItems → project
    //    revenue/cost per line → $facet groups for summary / per-product /
    //    per-day stats (heavy math happens DB-side, not in Node).
    const [orderAgg] = await orderModel.aggregate([
      { $match: { "orderItems.seller": sellerId } },
      { $unwind: "$orderItems" },
      { $match: { "orderItems.seller": sellerId } },
      {
        $project: {
          orderId: "$_id",
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt", timezone: "UTC" } },
          product: "$orderItems.product",
          qty: { $ifNull: ["$orderItems.quantity", 1] },
          price: { $ifNull: ["$orderItems.price", 0] },
        },
      },
      { $lookup: { from: "products", localField: "product", foreignField: "_id", as: "p" } },
      { $unwind: { path: "$p", preserveNullAndEmptyArrays: true } },
      {
        $project: {
          orderId: 1, date: 1, product: 1, qty: 1, price: 1,
          revenue: { $multiply: ["$price", "$qty"] },
          cost: { $multiply: [{ $ifNull: ["$p.costPrice.amount", 0] }, "$qty"] },
        },
      },
      {
        $facet: {
          summary: [
            { $group: { _id: "$orderId", revenue: { $sum: "$revenue" }, cost: { $sum: "$cost" }, qty: { $sum: "$qty" } } },
            {
              $group: {
                _id: null,
                totalRevenue: { $sum: "$revenue" },
                totalCost: { $sum: "$cost" },
                totalUnitsSold: { $sum: "$qty" },
                totalOrdersCount: { $sum: 1 },
              },
            },
          ],
          byProduct: [
            { $group: { _id: "$product", unitsSold: { $sum: "$qty" }, totalRevenue: { $sum: "$revenue" }, totalCost: { $sum: "$cost" } } },
          ],
          byDate: [
            {
              $group: {
                _id: "$date",
                revenue: { $sum: "$revenue" },
                cost: { $sum: "$cost" },
                profit: { $sum: { $subtract: ["$revenue", "$cost"] } },
                orders: { $sum: 1 },
              },
            },
          ],
        },
      },
    ]);

    const summary = (orderAgg.summary && orderAgg.summary[0]) || {};
    const totalRevenue = summary.totalRevenue || 0;
    const totalCost = summary.totalCost || 0;
    const totalUnitsSold = summary.totalUnitsSold || 0;
    const totalOrdersCount = summary.totalOrdersCount || 0;

    // Itemized per-product stats (aggregation rows merged with product docs)
    const productStats = new Map();
    sellerProducts.forEach((p) => {
      const sellPriceNum = p.sellingPrice?.amount || p.maxPrice?.amount || 0;
      const costPriceNum = p.costPrice?.amount || 0;
      productStats.set(String(p._id), {
        _id: p._id,
        title: p.title,
        slug: p.slug,
        image: p.images?.[0]?.url || null,
        category: p.category?.name || "Uncategorized",
        brand: p.brand?.name || "—",
        sellingPrice: sellPriceNum,
        costPrice: costPriceNum,
        unitProfit: sellPriceNum - costPriceNum,
        unitsSold: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        marginPercent: 0,
      });
    });
    (orderAgg.byProduct || []).forEach((row) => {
      const st = productStats.get(String(row._id)) || {
        _id: row._id,
        title: "Product",
        image: null,
        sellingPrice: 0,
        costPrice: 0,
        unitProfit: 0,
        unitsSold: 0,
        totalRevenue: 0,
        totalCost: 0,
        totalProfit: 0,
        marginPercent: 0,
      };
      st.unitsSold = row.unitsSold || 0;
      st.totalRevenue = row.totalRevenue || 0;
      st.totalCost = row.totalCost || 0;
      st.totalProfit = st.totalRevenue - st.totalCost;
      st.marginPercent = st.totalRevenue > 0 ? (st.totalProfit / st.totalRevenue) * 100 : 0;
      productStats.set(String(row._id), st);
    });

    const itemizedPerformance = Array.from(productStats.values());

    // Most Sold Product (highest unitsSold)
    const mostSoldProduct =
      [...itemizedPerformance].sort((a, b) => b.unitsSold - a.unitsSold)[0] || null;

    // Most Profitable Product (highest totalProfit)
    const mostProfitableProduct =
      [...itemizedPerformance].sort((a, b) => b.totalProfit - a.totalProfit)[0] || null;

    const netProfit = totalRevenue - totalCost;
    const overallMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    const dailyTrends = (orderAgg.byDate || [])
      .map((d) => ({
        date: d._id,
        revenue: d.revenue || 0,
        cost: d.cost || 0,
        profit: d.profit || 0,
        orders: d.orders || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return res.status(200).json({
      success: true,
      summary: {
        totalOrders: totalOrdersCount,
        totalUnitsSold,
        totalRevenue,
        totalCost,
        netProfit,
        overallMargin: Math.round(overallMargin * 10) / 10,
      },
      mostSoldProduct,
      mostProfitableProduct,
      dailyTrends,
      itemizedPerformance,
    });
  } catch (error) {
    console.error("Error in getSellerAnalytics:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to generate seller analytics",
    });
  }
};
