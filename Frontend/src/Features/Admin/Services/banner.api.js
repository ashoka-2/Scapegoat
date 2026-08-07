import axios from "axios";

const API_BASE = "http://localhost:3000/api/banners";

/**
 * PUBLIC — Fetch active banners by placement and page
 */
export const getActiveBannersApi = async (params = {}) => {
  const response = await axios.get(`${API_BASE}/active`, { params, withCredentials: true });
  return response.data;
};

/**
 * ADMIN — Fetch all banners with filters and pagination
 */
export const getAllBannersApi = async (params = {}) => {
  const response = await axios.get(API_BASE, { params, withCredentials: true });
  return response.data;
};

/**
 * ADMIN — Get single banner by ID
 */
export const getBannerByIdApi = async (id) => {
  const response = await axios.get(`${API_BASE}/${id}`, { withCredentials: true });
  return response.data;
};

/**
 * ADMIN — Create a new banner (multipart form data)
 */
export const createBannerApi = async (formData) => {
  const response = await axios.post(API_BASE, formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * ADMIN — Update an existing banner (multipart form data)
 */
export const updateBannerApi = async (id, formData) => {
  const response = await axios.put(`${API_BASE}/${id}`, formData, {
    withCredentials: true,
    headers: { "Content-Type": "multipart/form-data" },
  });
  return response.data;
};

/**
 * ADMIN — Delete banner (soft or permanent)
 */
export const deleteBannerApi = async (id, permanent = false) => {
  const response = await axios.delete(`${API_BASE}/${id}`, {
    params: { permanent },
    withCredentials: true,
  });
  return response.data;
};

/**
 * ADMIN — Restore a trashed banner
 */
export const restoreBannerApi = async (id) => {
  const response = await axios.patch(`${API_BASE}/${id}/restore`, {}, { withCredentials: true });
  return response.data;
};

/**
 * ADMIN — Toggle banner active/inactive
 */
export const toggleBannerStatusApi = async (id) => {
  const response = await axios.patch(`${API_BASE}/${id}/toggle`, {}, { withCredentials: true });
  return response.data;
};

/**
 * ADMIN — Batch reorder banners
 */
export const reorderBannersApi = async (banners) => {
  const response = await axios.put(`${API_BASE}/reorder`, { banners }, { withCredentials: true });
  return response.data;
};
