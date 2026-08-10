import path from "node:path";
import { fileURLToPath } from "node:url";

// ── Transformers.js (local ONNX embeddings) ──────────────────────────────────
// Models are downloaded from HuggingFace at runtime and cached. On Render's
// free tier the filesystem is ephemeral and a download can be interrupted by a
// restart/OOM kill, which corrupts the partial files — onnxruntime then fails
// with "protobuf parsing failed" and falls back to slow WASM. We:
//   1. cache inside the project (stable across restarts),
//   2. auto-clear a corrupt model cache and retry the load once,
//   3. pre-warm the text pipeline at boot so downloads happen during cold start,
//   4. gate the heavy CLIP vision model (~350MB) behind AI_VISION_ENABLED —
//      it is NOT viable on the 512MB Render free instance (OOM risk).

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CACHE_DIR = path.join(__dirname, "..", "..", ".transformers-cache");

// CLIP vision model: ON by default in local dev (ample RAM), OFF by default in
// production (the ~350MB model is not viable on the 512MB Render free instance).
// Explicit override: AI_VISION_ENABLED=true|false always wins.
const VISION_ENABLED =
  process.env.AI_VISION_ENABLED === "true" ||
  (process.env.AI_VISION_ENABLED !== "false" && process.env.NODE_ENV !== "production");
let visionWarned = false;

let textPipelineInstance = null;
let visionPipelineInstance = null;
let transformersEnvConfigured = false;

/** Lazily imports Transformers.js and applies our env config once. */
async function getPipelineFactory() {
  const { env, pipeline } = await import("@xenova/transformers");
  if (!transformersEnvConfigured) {
    env.cacheDir = CACHE_DIR;
    env.allowRemoteModels = true;
    transformersEnvConfigured = true;
  }
  return pipeline;
}

/** Loads a pipeline; on failure clears the (possibly corrupt) model cache and retries once. */
async function loadPipelineWithRecovery(pipeline, task, modelId) {
  try {
    return await pipeline(task, modelId);
  } catch (err) {
    console.warn(`[AI Search] ${modelId} load failed (${err.message}) — clearing cache and retrying once`);
    try {
      const fs = await import("node:fs");
      const modelCachePath = path.join(CACHE_DIR, `models--Xenova--${modelId.split("/").pop()}`);
      if (fs.existsSync(modelCachePath)) {
        fs.rmSync(modelCachePath, { recursive: true, force: true });
      }
    } catch {
      /* cache cleanup is best-effort */
    }
    return pipeline(task, modelId);
  }
}

/**
 * Initializes or reuses the local text feature-extraction pipeline.
 */
async function getTextPipeline() {
  if (textPipelineInstance) return textPipelineInstance;
  try {
    const pipeline = await getPipelineFactory();
    // Load MiniLM model for fast, lightweight local text embeddings (384 dimensions)
    textPipelineInstance = await loadPipelineWithRecovery(pipeline, "feature-extraction", "Xenova/all-MiniLM-L6-v2");
    return textPipelineInstance;
  } catch (error) {
    console.warn(
      "[AI Search] Text embeddings unavailable (no @xenova/transformers or model download failed):",
      error.message
    );
    return null;
  }
}

/**
 * Initializes or reuses the local vision feature-extraction pipeline (CLIP model).
 * Disabled by default in production — the ~350MB model is not viable on the
 * 512MB Render free instance. Enable explicitly with AI_VISION_ENABLED=true.
 */
async function getVisionPipeline() {
  if (!VISION_ENABLED) {
    if (!visionWarned) {
      visionWarned = true;
      console.log("[AI Search] Vision (CLIP) embeddings disabled. Set AI_VISION_ENABLED=true to enable (not recommended on the free tier).");
    }
    return null;
  }
  if (visionPipelineInstance) return visionPipelineInstance;
  try {
    const pipeline = await getPipelineFactory();
    // Load CLIP model for visual embeddings (image to product matching / Snap2Bill camera scan)
    visionPipelineInstance = await loadPipelineWithRecovery(pipeline, "image-feature-extraction", "Xenova/clip-vit-base-patch32");
    return visionPipelineInstance;
  } catch (error) {
    console.warn("[AI Search] Vision pipeline unavailable:", error.message);
    return null;
  }
}

/**
 * Pre-warms the text embedding pipeline in the background (fire-and-forget).
 * Call once at server boot so model downloads happen during the cold start
 * instead of lazily on the first product save / search.
 */
export function warmUpEmbeddings() {
  setTimeout(() => {
    getTextPipeline()
      .then((p) => {
        if (p) console.log("[AI Search] Text embedding pipeline ready (MiniLM)");
      })
      .catch(() => {});
  }, 1500);
}

/**
 * Generates a 384-dimensional vector embedding for a given text string.
 * @param {string} text - Product title, description, and tags combined.
 * @returns {Promise<number[]>} Array of floating point numbers (vector embedding).
 */
export async function generateTextEmbedding(text) {
  if (!text || typeof text !== "string") return [];

  const extractor = await getTextPipeline();
  if (!extractor) return [];

  try {
    const output = await extractor(text.trim(), { pooling: "mean", normalize: true });
    return Array.from(output.data);
  } catch (err) {
    console.error("[AI Search] Error generating text embedding:", err.message);
    return [];
  }
}

/**
 * Generates a visual vector embedding for an image URL or image buffer.
 * Used for photo-based product search and Snap2Bill camera scans.
 * @param {string} imageUrlOrPath - URL or local file path of the product image.
 * @returns {Promise<number[]>} Array of floating point numbers (image embedding vector).
 */
export async function generateImageEmbedding(imageUrlOrPath) {
  if (!imageUrlOrPath || typeof imageUrlOrPath !== "string") return [];

  const extractor = await getVisionPipeline();
  if (!extractor) return [];

  try {
    const output = await extractor(imageUrlOrPath);
    return Array.from(output.data);
  } catch (err) {
    console.error("[AI Search] Error generating image embedding:", err.message);
    return [];
  }
}

/**
 * Helper to combine product attributes into a rich text string for AI embedding generation.
 * @param {Object} product - Product document data (title, description, tags, categoryName, brandName)
 * @returns {string} Combined rich text string
 */
export function buildProductTextForEmbedding(product) {
  const parts = [
    product.title || "",
    product.shortDescription || "",
    product.description || "",
    Array.isArray(product.tags) ? product.tags.join(" ") : "",
    product.categoryName || product.category?.name || "",
    product.brandName || product.brand?.name || "",
    product.sku || "",
  ];

  // Include attribute names and values for semantic relevance
  // e.g. "Color Red Blue Size S M L XL Material Cotton"
  if (Array.isArray(product.attributes)) {
    product.attributes.forEach((attr) => {
      const name = attr.name || attr.key || "";
      const options = Array.isArray(attr.options)
        ? attr.options.join(" ")
        : (attr.value || "");
      if (name) parts.push(`${name} ${options}`);
    });
  }

  // Include variant attribute values
  if (Array.isArray(product.variants)) {
    product.variants.forEach((v) => {
      if (v.name) parts.push(v.name);
      if (v.sku) parts.push(v.sku);
      const rawAttrs = v.attributes instanceof Map
        ? Object.fromEntries(v.attributes)
        : (v.attributes?._doc || v.attributes || {});
      Object.entries(rawAttrs).forEach(([k, val]) => {
        const vals = Array.isArray(val) ? val.join(" ") : String(val || "");
        parts.push(`${k} ${vals}`);
      });
      if (Array.isArray(v.dynamicAttributes)) {
        v.dynamicAttributes.forEach((da) => {
          const k = da.key || da.name || "";
          const vals = (da.values || da.options || []).join(" ");
          if (k) parts.push(`${k} ${vals}`);
        });
      }
    });
  }

  return parts.filter(Boolean).join(" ").substring(0, 1500);
}
