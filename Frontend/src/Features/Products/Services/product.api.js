import { createApiInstance } from "../../../utils/axios";

const productApiInstance = createApiInstance("/api/products");

/**
 * Create a new product (supports multipart form data with images array)
 */
export async function createProductApi(formData) {
  const response = await productApiInstance.post("", formData);
  return response.data;
}

/**
 * Fetch all published products
 */
export async function getAllProductsApi(params = {}) {
  const response = await productApiInstance.get("", { params });
  return response.data;
}

/**
 * Fetch a single product by ID or Slug
 */
export async function getSingleProductApi(identifier) {
  const response = await productApiInstance.get(`/single/${identifier}`);
  return response.data;
}

/**
 * Fetch products created by a specific seller
 */
export async function getSellerProductsApi(sellerId, params = {}) {
  const response = await productApiInstance.get(`/seller/${sellerId}`, { params });
  return response.data;
}

/**
 * Fetch seller financial analytics & itemized performance
 */
export async function getSellerAnalyticsApi() {
  const response = await productApiInstance.get("/seller-analytics");
  return response.data;
}

/**
 * Upload a single image for the rich-text product description.
 * Returns the ImageKit URL so the editor can insert a compact <img> tag
 * instead of a bloated base64 data URL.
 *
 * Retries with backoff: the Render free tier can be mid cold-start (~30–60s)
 * and answer 502 Bad Gateway; a re-uploaded image is harmless (worst case an
 * orphan file in ImageKit), so retrying is safe here.
 */
const UPLOAD_RETRY_DELAYS = [8000, 15000, 25000]; // ≈ 48s total, covers a cold start
const UPLOAD_RETRYABLE_CODES = new Set([502, 503, 504]);

export async function uploadDescriptionImageApi(file, attempt = 0) {
  const formData = new FormData();
  formData.append("image", file);
  try {
    const response = await productApiInstance.post("/upload-description-image", formData);
    return response.data;
  } catch (error) {
    const status = error.response ? error.response.status : 0; // 0 = network/CORS-level failure
    const retryable = status === 0 || UPLOAD_RETRYABLE_CODES.has(status);
    if (retryable && attempt < UPLOAD_RETRY_DELAYS.length) {
      await new Promise((r) => setTimeout(r, UPLOAD_RETRY_DELAYS[attempt]));
      return uploadDescriptionImageApi(file, attempt + 1);
    }
    throw error;
  }
}

/**
 * Update an existing product
 */
export async function updateProductApi(id, formData) {
  const response = await productApiInstance.put(`/${id}`, formData);
  return response.data;
}

/**
 * Soft delete product (move to trash)
 */
export async function deleteProductApi(id) {
  const response = await productApiInstance.delete(`/${id}`);
  return response.data;
}

/**
 * Fetch similar AI recommended products
 */
export async function getSimilarProductsApi(id) {
  const response = await productApiInstance.get(`/${id}/similar`);
  return response.data;
}

/**
 * Restore product from trash
 */
export async function restoreProductApi(id) {
  const response = await productApiInstance.patch(`/${id}/restore`);
  return response.data;
}

/**
 * AI Smart Text Search
 */
export async function aiSearchProductsApi(query) {
  const response = await productApiInstance.get(`/search/ai`, {
    params: { q: query },
  });
  return response.data;
}

/**
 * AI Visual Photo Search
 */
export async function aiVisualSearchProductsApi(formData) {
  const response = await productApiInstance.post(`/search/visual`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
}

/**
 * Suggest catalog description matching title, category, and shortDescription
 */
export async function suggestProductDescriptionApi(payload) {
  const response = await productApiInstance.post("/suggest-description", payload);
  return response.data;
}
