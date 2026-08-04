import axios from "../../../utils/axios";

const activityApi = axios.create({
  baseURL: "/api/activity",
  withCredentials: true,
});

const productApi = axios.create({
  baseURL: "/api/products",
  withCredentials: true,
});

/** Track a product view (backend + localStorage fallback) */
export async function trackViewApi(productId) {
  try {
    await activityApi.post("/view", { productId });
  } catch {
    // Silently fail — tracking is non-critical
  }
}

/** Track dwell time on a product page */
export async function trackDwellApi(productId, dwellMs) {
  try {
    await activityApi.post("/dwell", { productId, dwellMs });
  } catch {
    // Silently fail
  }
}

/** Get recently viewed products (authenticated users) */
export async function getRecentlyViewedApi(limit = 10) {
  const res = await activityApi.get("/recently-viewed", { params: { limit } });
  return res.data;
}

/** Get personalized "For You" products (Instagram-style) */
export async function getForYouApi(limit = 10) {
  const res = await activityApi.get("/for-you", { params: { limit } });
  return res.data;
}

/** Get frequently bought together products for a given product ID */
export async function getFrequentlyBoughtTogetherApi(productId) {
  const res = await productApi.get(`/${productId}/frequently-bought-together`);
  return res.data;
}
