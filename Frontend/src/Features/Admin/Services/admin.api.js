import axios from "axios";

const API_BASE = "http://localhost:3000/api/admin";

export const getDashboardStatsApi = async (params = {}) => {
  const response = await axios.get(`${API_BASE}/dashboard`, { params, withCredentials: true });
  return response.data;
};

export const getAdminUsersApi = async (params = {}) => {
  const response = await axios.get(`${API_BASE}/users`, {
    params,
    withCredentials: true,
  });
  return response.data;
};

export const getUserByIdApi = async (id) => {
  const response = await axios.get(`${API_BASE}/users/${id}`, { withCredentials: true });
  return response.data;
};

export const updateUserRoleApi = async (id, role) => {
  const response = await axios.put(
    `${API_BASE}/users/${id}/role`,
    { role },
    { withCredentials: true }
  );
  return response.data;
};

export const toggleBanUserApi = async (id) => {
  const response = await axios.put(
    `${API_BASE}/users/${id}/ban`,
    {},
    { withCredentials: true }
  );
  return response.data;
};

export const getAdminProductsApi = async (params = {}) => {
  const response = await axios.get(`${API_BASE}/products`, {
    params,
    withCredentials: true,
  });
  return response.data;
};

export const getProductDetailAdminApi = async (id) => {
  const response = await axios.get(`${API_BASE}/products/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

export const getAdminOrdersApi = async (params = {}) => {
  const response = await axios.get(`${API_BASE}/orders`, {
    params,
    withCredentials: true,
  });
  return response.data;
};

export const getAdminMessagesApi = async (params = {}) => {
  const response = await axios.get(`${API_BASE}/messages`, {
    params,
    withCredentials: true,
  });
  return response.data;
};

export const markMessageReadApi = async (id) => {
  const response = await axios.put(
    `${API_BASE}/messages/${id}/read`,
    {},
    { withCredentials: true }
  );
  return response.data;
};

export const deleteMessageApi = async (id) => {
  const response = await axios.delete(`${API_BASE}/messages/${id}`, {
    withCredentials: true,
  });
  return response.data;
};

export const getAdminReviewsApi = async (params = {}) => {
  const response = await axios.get(`${API_BASE}/reviews`, {
    params,
    withCredentials: true,
  });
  return response.data;
};

export const updateReviewAdminApi = async (id, data) => {
  const response = await axios.put(`${API_BASE}/reviews/${id}`, data, {
    withCredentials: true,
  });
  return response.data;
};

export const deleteReviewAdminApi = async (id) => {
  const response = await axios.delete(`${API_BASE}/reviews/${id}`, {
    withCredentials: true,
  });
  return response.data;
};
