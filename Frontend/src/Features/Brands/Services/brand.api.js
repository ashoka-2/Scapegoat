import axios from "../../../utils/axios";

const brandApiInstance = axios.create({
  baseURL: "/api/brands",
  withCredentials: true,
});

/**
 * Fetch all brands
 */
export async function getAllBrandsApi() {
  const response = await brandApiInstance.get("/");
  return response.data;
}

/**
 * Create a new brand
 */
export async function createBrandApi(brandData) {
  const response = await brandApiInstance.post("/", brandData);
  return response.data;
}

/**
 * Update an existing brand
 */
export async function updateBrandApi(id, brandData) {
  const response = await brandApiInstance.put(`/${id}`, brandData);
  return response.data;
}

/**
 * Delete a brand (blocked if used by active products)
 */
export async function deleteBrandApi(id) {
  const response = await brandApiInstance.delete(`/${id}`);
  return response.data;
}
