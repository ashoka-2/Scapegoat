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
 * Frees the CLIP vision pipeline after a one-off visual search.
 * On the 512MB Render free instance the model (~150MB of WASM/ONNX memory)
 * cannot stay resident alongside the text pipeline — load → search → dispose
 * keeps the spike transient and returns memory to the baseline (without it a
 * search OOM-kills the instance, which then serves 502s without CORS headers
 * that surface as "blocked by CORS" in the browser).
 */
export function disposeVisionPipeline() {
  if (visionPipelineInstance) {
    visionPipelineInstance = null;
    // Force a full GC (requires node --expose-gc) so the WASM memory backing
    // the model is released immediately instead of whenever the heap grows.
    if (typeof global.gc === "function") {
      try {
        global.gc();
      } catch {
        /* best-effort */
      }
    }
    console.log("[AI Search] Vision (CLIP) pipeline disposed after use");
  }
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

  // Production (512MB Render): run CLIP in an isolated worker process so the
  // model's ~200MB is reclaimed after every call instead of accumulating.
  if (process.env.NODE_ENV === "production") {
    try {
      const os = await import("node:os");
      const path = await import("node:path");
      const fs = await import("node:fs");
      const ext = (path.extname(new URL(imageUrlOrPath).pathname) || ".jpg").slice(1) || "jpg";
      const tmpPath = path.join(os.tmpdir(), `scapegoat-query-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);
      try {
        const resp = await fetch(imageUrlOrPath);
        if (!resp.ok) return [];
        const buf = Buffer.from(await resp.arrayBuffer());
        fs.writeFileSync(tmpPath, buf);
        const result = await runVisionWorker(tmpPath);
        return result?.ok && Array.isArray(result.embedding) ? result.embedding : [];
      } finally {
        try { fs.unlinkSync(tmpPath); } catch { /* ignore */ }
      }
    } catch (err) {
      console.warn("[AI Search] Worker embed (URL) failed, falling back to in-process:", err.message);
    }
  }

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
 * Generate a CLIP embedding from a raw image BUFFER (multer memory upload).
 * PRIVACY-FIRST: the buffer is written to a transient temp file (Node's fetch
 * cannot decode data: URLs for the vision processor), embedded, and the temp
 * file is deleted immediately — the query image is never stored in the
 * database or ImageKit.
 */
export async function generateImageEmbeddingFromBuffer(buffer, mimeType = "image/jpeg") {
  if (!buffer || !buffer.length) return [];

  const fs = await import("node:fs");
  const os = await import("node:os");
  const path = await import("node:path");
  const ext = (mimeType.split("/")[1] || "jpeg").replace("jpeg", "jpg");
  const tmpPath = path.join(os.tmpdir(), `scapegoat-query-${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`);

  try {
    fs.writeFileSync(tmpPath, buffer);

    // Production (512MB Render): isolated CLIP worker → process exits → the
    // model memory is fully returned to the OS (avoids "memory limit" crashes).
    if (process.env.NODE_ENV === "production") {
      const result = await runVisionWorker(tmpPath);
      return result?.ok && Array.isArray(result.embedding) ? result.embedding : [];
    }

    const extractor = await getVisionPipeline();
    if (!extractor) return [];
    const output = await extractor(tmpPath);
    return Array.from(output.data);
  } catch (err) {
    console.error("[AI Search] Error embedding image buffer:", err.message);
    return [];
  } finally {
    try {
      fs.unlinkSync(tmpPath);
    } catch { /* ignore cleanup errors */ }
  }
}

/**
 * Raw CLIP embedding of an image FILE — used by the isolated vision worker
 * (vision-worker.mjs) so production never keeps CLIP resident in the API
 * process. Returns { ok, embedding } instead of throwing.
 */
export async function embedImageFileForWorker(filePath) {
  const pipeline = await getVisionPipeline();
  if (!pipeline) return { ok: false, error: "vision pipeline unavailable" };
  try {
    // Pass the file PATH (string) — transformers.js handles local paths; a
    // raw Buffer is rejected ("Unsupported input type: object").
    const output = await pipeline(filePath);
    // Single-image input → output.data IS the 512-dim embedding (no [0] index)
    const emb = output?.data;
    if (!emb || !emb.length) return { ok: false, error: "no embedding produced" };
    return { ok: true, embedding: Array.from(emb) };
  } catch (err) {
    return { ok: false, error: err.message };
  }
}

const VISION_WORKER_PATH = path.join(__dirname, "../services/vision-worker.mjs");

/** Spawns the isolated CLIP worker; resolves with { ok, embedding } or { ok:false }. */
async function runVisionWorker(filePath) {
  const { spawn } = await import("node:child_process");
  return new Promise((resolve) => {
    let child;
    try {
      child = spawn(process.execPath, [VISION_WORKER_PATH, filePath], {
        stdio: ["ignore", "pipe", "inherit"],
        timeout: 120000,
      });
    } catch {
      return resolve({ ok: false, error: "worker spawn failed" });
    }
    let out = "";
    child.stdout.on("data", (d) => (out += d.toString()));
    child.on("close", () => {
      try {
        const line = out.trim().split("\n").pop();
        resolve(line ? JSON.parse(line) : { ok: false, error: "no worker output" });
      } catch {
        resolve({ ok: false, error: "unparseable worker output" });
      }
    });
    child.on("error", () => resolve({ ok: false, error: "worker error" }));
  });
}

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
