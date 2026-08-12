// ── Voyage AI embedding client ────────────────────────────────────────────────
// Replaces the old local Transformers.js stack (MiniLM text 384-dim + CLIP
// image 512-dim + ONNX/WASM workers) with the Voyage multimodal API:
//
//   POST https://api.voyageai.com/v1/multimodalembeddings
//   model: voyage-multimodal-3.5  →  1024-dim vectors for BOTH text and images
//
// The SAME vectors generated here are stored in MongoDB AND upserted into
// Pinecone — one embedding, two stores (no model mixing).
//
// Environment:
//   VOYAGE_API_KEY        (required — never hard-coded)
//   VOYAGE_MODEL          (default "voyage-multimodal-3.5")
//   VOYAGE_EMBEDDING_DIM  (default 1024 — validated against real API output)
//
// Failure semantics: every generator returns [] when the API is unavailable,
// the key is missing, or the request fails — callers save the product to
// MongoDB regardless and Pinecone sync is retried by the scheduler.

const VOYAGE_MODEL = process.env.VOYAGE_MODEL || "voyage-multimodal-3.5";
export const EMBEDDING_DIM = parseInt(process.env.VOYAGE_EMBEDDING_DIM || "1024", 10);
const VOYAGE_URL = process.env.VOYAGE_API_URL || "https://api.voyageai.com/v1/multimodalembeddings";

export const voyageAvailable = () => Boolean(process.env.VOYAGE_API_KEY);

const toDataUrl = (buffer, mimeType = "image/jpeg") =>
  `data:${mimeType};base64,${buffer.toString("base64")}`;

/**
 * Core Voyage multimodal call. `items` is an array of input objects:
 *   { text: "..." }                    → text-only input
 *   { imageUrl: "https://..." }        → image via URL
 *   { imageDataUrl: "data:..." }       → image via base64 (privacy-first)
 * Returns the array of 1024-dim vectors (one per input) or [] on any failure.
 * Retries 429 (rate limit — free tier is 3 RPM without a payment method) with
 * backoff, and batches as many inputs per request as the caller provides.
 */
async function embedMultimodal(items) {
  if (!voyageAvailable()) {
    console.warn("[Voyage] VOYAGE_API_KEY is not set — embeddings unavailable");
    return [];
  }
  if (!items?.length) return [];

  const inputs = items.map((item) => {
    if (item.text) return { content: [{ type: "text", text: item.text }] };
    if (item.imageDataUrl) return { content: [{ type: "image_base64", image_base64: item.imageDataUrl }] };
    if (item.imageUrl) return { content: [{ type: "image_url", image_url: item.imageUrl }] };
    return null;
  }).filter(Boolean);

  if (inputs.length === 0) return [];

  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      const resp = await fetch(VOYAGE_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.VOYAGE_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ inputs, model: VOYAGE_MODEL }),
        signal: AbortSignal.timeout(60000),
      });

      if (resp.status === 429 && attempt < 4) {
        const waitMs = attempt * 22000; // 22s, 44s, 66s — under the 3 RPM free tier
        console.warn(`[Voyage] rate limited (429) — retrying in ${Math.round(waitMs / 1000)}s (${attempt}/3)`);
        await new Promise((r) => setTimeout(r, waitMs));
        continue;
      }

      if (!resp.ok) {
        const body = await resp.text().catch(() => "");
        console.warn(`[Voyage] API error ${resp.status}: ${body.slice(0, 200)}`);
        return [];
      }

      const data = await resp.json();
      const vectors = (data.data || []).map((d) => d.embedding || []);

      if (vectors.length > 0 && vectors[0].length !== EMBEDDING_DIM) {
        console.warn(
          `[Voyage] Model ${VOYAGE_MODEL} returned ${vectors[0].length}-dim vectors — ` +
            `expected ${EMBEDDING_DIM}. Update VOYAGE_EMBEDDING_DIM / Pinecone index dims.`
        );
      }
      return vectors;
    } catch (err) {
      console.warn("[Voyage] Embedding request failed:", err?.message || err);
      return [];
    }
  }
  return [];
}

/**
 * Generates a Voyage text embedding for a product/search text.
 * @param {string} text
 * @returns {Promise<number[]>} 1024-dim vector, or [] on failure.
 */
export async function generateTextEmbedding(text) {
  if (!text || typeof text !== "string") return [];
  const [vec] = await embedMultimodal([{ text: text.trim().substring(0, 3000) }]);
  return vec || [];
}

/**
 * Generates a Voyage image embedding from an image URL (product images in
 * ImageKit). Falls back to base64 if the URL cannot be fetched directly.
 * @param {string} imageUrl
 * @returns {Promise<number[]>} 1024-dim vector, or [] on failure.
 */
export async function generateImageEmbedding(imageUrl) {
  if (!imageUrl || typeof imageUrl !== "string") return [];

  // 1. Try the URL directly (ImageKit CDN images are public + stable)
  const [vec] = await embedMultimodal([{ imageUrl }]);
  if (vec && vec.length > 0) return vec;

  // 2. Fallback: download + re-send as base64 (guards against redirect /
  //    robots.txt / content-length restrictions on the URL)
  try {
    const resp = await fetch(imageUrl, { signal: AbortSignal.timeout(30000) });
    if (!resp.ok) return [];
    const buf = Buffer.from(await resp.arrayBuffer());
    if (buf.length === 0 || buf.length > 20 * 1024 * 1024) return [];
    const mime = resp.headers.get("content-type")?.split(";")[0] || "image/jpeg";
    const [vec2] = await embedMultimodal([{ imageDataUrl: toDataUrl(buf, mime) }]);
    return vec2 || [];
  } catch (err) {
    console.warn("[Voyage] Image URL embed failed:", err?.message || err);
    return [];
  }
}

/**
 * Generates a Voyage image embedding from a raw image BUFFER (multer memory
 * upload / visual-search query image). PRIVACY-FIRST: the buffer is sent as a
 * base64 data URL directly to Voyage — nothing is written to disk, stored in
 * MongoDB, or uploaded to ImageKit.
 * @param {Buffer} buffer
 * @param {string} mimeType
 * @returns {Promise<number[]>} 1024-dim vector, or [] on failure.
 */
export async function generateImageEmbeddingFromBuffer(buffer, mimeType = "image/jpeg") {
  if (!buffer || !buffer.length) return [];
  const [vec] = await embedMultimodal([{ imageDataUrl: toDataUrl(buffer, mimeType) }]);
  return vec || [];
}

/**
 * Batch image embeddings from raw buffers — sends ALL images in ONE Voyage
 * request (1 RPM cost instead of N). Returns one vector per input ([] entries
 * on failure). Used by product creation/update, the scheduler, and migration.
 * @param {Array<{buffer: Buffer, mimeType?: string}>} images
 * @returns {Promise<number[][]>}
 */
export async function generateImageEmbeddingsFromBuffers(images) {
  if (!Array.isArray(images) || images.length === 0) return [];
  const vectors = await embedMultimodal(
    images.map(({ buffer, mimeType = "image/jpeg" }) => ({
      imageDataUrl: toDataUrl(buffer, mimeType),
    }))
  );
  return vectors;
}

/**
 * Batch image embeddings from URLs — downloads each image, then sends ALL of
 * them as base64 in ONE Voyage request. Falls back per-image: a failed
 * download yields a [] entry (the caller keeps the image without an embedding).
 * @param {string[]} urls
 * @returns {Promise<number[][]>} one vector per URL ([] on failure)
 */
export async function generateImageEmbeddingsFromUrls(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return [];

  const results = [];
  const pending = []; // { url, index }
  for (let i = 0; i < urls.length; i++) {
    results.push([]);
    if (urls[i] && typeof urls[i] === "string") pending.push({ url: urls[i], index: i });
  }
  if (pending.length === 0) return results;

  // Download in parallel (bounded), then ONE Voyage call for everything
  const downloaded = await Promise.all(
    pending.map(async ({ url, index }) => {
      try {
        const resp = await fetch(url, { signal: AbortSignal.timeout(30000) });
        if (!resp.ok) return null;
        const buf = Buffer.from(await resp.arrayBuffer());
        if (buf.length === 0 || buf.length > 20 * 1024 * 1024) return null;
        const mime = resp.headers.get("content-type")?.split(";")[0] || "image/jpeg";
        return { buffer: buf, mimeType: mime, index };
      } catch {
        return null;
      }
    })
  );

  const valid = downloaded.filter(Boolean);
  if (valid.length > 0) {
    const vectors = await embedMultimodal(
      valid.map(({ buffer, mimeType }) => ({ imageDataUrl: toDataUrl(buffer, mimeType) }))
    );
    valid.forEach(({ index }, vi) => {
      results[index] = vectors[vi] || [];
    });
  }
  return results;
}

/**
 * Batch text embeddings — used by the migration/backfill (resumable).
 * @param {string[]} texts
 * @returns {Promise<number[][]>} one 1024-dim vector per text ([] entries on failure).
 */
export async function generateTextEmbeddingsBatch(texts) {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  const vectors = await embedMultimodal(texts.map((t) => ({ text: String(t || "").substring(0, 3000) })));
  return vectors;
}

/**
 * Builds the searchable text for a product (title + description + category +
 * brand + tags + attributes + variants). Same text used by create/update,
 * migration, and the scheduler health-check.
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
