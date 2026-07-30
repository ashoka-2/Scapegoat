
let textPipelineInstance = null;
let visionPipelineInstance = null;

/**
 * Initializes or reuses the local text feature-extraction pipeline.
 */
async function getTextPipeline() {
  if (textPipelineInstance) return textPipelineInstance;

  try {
    const { pipeline } = await import("@xenova/transformers");
    // Load MiniLM model for fast, lightweight local text embeddings (384 dimensions)
    textPipelineInstance = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
    return textPipelineInstance;
  } catch (error) {
    console.warn(
      "[AI Search] @xenova/transformers package not installed yet. Run 'npm install @xenova/transformers' to enable AI search embeddings."
    );
    return null;
  }
}

/**
 * Initializes or reuses the local vision feature-extraction pipeline (CLIP model).
 */
async function getVisionPipeline() {
  if (visionPipelineInstance) return visionPipelineInstance;

  try {
    const { pipeline } = await import("@xenova/transformers");
    // Load CLIP model for visual embeddings (image to product matching / Snap2Bill camera scan)
    visionPipelineInstance = await pipeline("image-feature-extraction", "Xenova/clip-vit-base-patch32");
    return visionPipelineInstance;
  } catch (error) {
    console.warn("[AI Search] Vision pipeline unavailable. Ensure @xenova/transformers is installed.");
    return null;
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
    product.categoryName || "",
    product.brandName || "",
  ];
  return parts.filter(Boolean).join(" ").substring(0, 1000);
}
