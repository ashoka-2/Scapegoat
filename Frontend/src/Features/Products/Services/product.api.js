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
 */
export async function uploadDescriptionImageApi(file) {
  const formData = new FormData();
  formData.append("image", file);
  const response = await productApiInstance.post("/upload-description-image", formData);
  return response.data;
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
