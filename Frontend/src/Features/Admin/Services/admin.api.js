import customAxios from "../../../utils/axios.js";

const adminApiInstance = customAxios.create({
  baseURL: (customAxios.defaults.baseURL || "") + "/api/admin",
});

export const getDashboardStatsApi = async (params = {}) => {
  const response = await adminApiInstance.get("/dashboard", { params });
  return response.data;
};

export const getAdminUsersApi = async (params = {}) => {
  const response = await adminApiInstance.get("/users", { params });
  return response.data;
};

export const getUserByIdApi = async (id) => {
  const response = await adminApiInstance.get(`/users/${id}`);
  return response.data;
};

export const updateUserRoleApi = async (id, role) => {
  const response = await adminApiInstance.put(`/users/${id}/role`, { role });
  return response.data;
};

export const toggleBanUserApi = async (id) => {
  const response = await adminApiInstance.put(`/users/${id}/ban`, {});
  return response.data;
};

export const getAdminProductsApi = async (params = {}) => {
  const response = await adminApiInstance.get("/products", { params });
  return response.data;
};

export const getProductDetailAdminApi = async (id) => {
  const response = await adminApiInstance.get(`/products/${id}`);
  return response.data;
};

export const getAdminOrdersApi = async (params = {}) => {
  const response = await adminApiInstance.get("/orders", { params });
  return response.data;
};

export const getAdminMessagesApi = async (params = {}) => {
  const response = await adminApiInstance.get("/messages", { params });
  return response.data;
};

export const markMessageReadApi = async (id) => {
  const response = await adminApiInstance.put(`/messages/${id}/read`, {});
  return response.data;
};

export const deleteMessageApi = async (id) => {
  const response = await adminApiInstance.delete(`/messages/${id}`);
  return response.data;
};

export const getAdminReviewsApi = async (params = {}) => {
  const response = await adminApiInstance.get("/reviews", { params });
  return response.data;
};

export const updateReviewAdminApi = async (id, data) => {
  const response = await adminApiInstance.put(`/reviews/${id}`, data);
  return response.data;
};

export const deleteReviewAdminApi = async (id) => {
  const response = await adminApiInstance.delete(`/reviews/${id}`);
  return response.data;
};
