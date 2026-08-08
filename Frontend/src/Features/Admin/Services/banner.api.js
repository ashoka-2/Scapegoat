import customAxios from "../../../utils/axios.js";

const bannerApiInstance = customAxios.create({
  baseURL: (customAxios.defaults.baseURL || "") + "/api/banners",
});

/**
 * PUBLIC — Fetch active banners by placement and page
 */
export const getActiveBannersApi = async (params = {}) => {
  const response = await bannerApiInstance.get("/active", { params });
  return response.data;
};

/**
 * ADMIN — Fetch all banners with filters and pagination
 */
export const getAllBannersApi = async (params = {}) => {
  const response = await bannerApiInstance.get("", { params });
  return response.data;
};

/**
 * ADMIN — Get single banner by ID
 */
export const getBannerByIdApi = async (id) => {
  const response = await bannerApiInstance.get(`/${id}`);
  return response.data;
};

/**
 * ADMIN — Create a new banner (multipart form data)
 */
export const createBannerApi = async (formData) => {
  const response = await bannerApiInstance.post("", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * ADMIN — Update an existing banner (multipart form data)
 */
export const updateBannerApi = async (id, formData) => {
  const response = await bannerApiInstance.put(`/${id}`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * ADMIN — Delete banner (soft or permanent)
 */
export const deleteBannerApi = async (id, permanent = false) => {
  const response = await bannerApiInstance.delete(`/${id}`, {
    params: { permanent },
  });
  return response.data;
};

/**
 * ADMIN — Restore a trashed banner
 */
export const restoreBannerApi = async (id) => {
  const response = await bannerApiInstance.patch(`/${id}/restore`, {});
  return response.data;
};

/**
 * ADMIN — Toggle banner active/inactive
 */
export const toggleBannerStatusApi = async (id) => {
  const response = await bannerApiInstance.patch(`/${id}/toggle`, {});
  return response.data;
};

/**
 * ADMIN — Batch reorder banners
 */
export const reorderBannersApi = async (banners) => {
  const response = await bannerApiInstance.put("/reorder", { banners });
  return response.data;
};
