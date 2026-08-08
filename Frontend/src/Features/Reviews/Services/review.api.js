import customAxios from "../../../utils/axios";

export const fetchProductReviewsApi = (productId) =>
  customAxios.get(`/api/reviews/product/${productId}`).then((r) => r.data);

export const fetchUserReviewsApi = () =>
  customAxios.get("/api/reviews/user").then((r) => r.data);

export const submitReviewApi = (data) =>
  customAxios.post("/api/reviews", data).then((r) => r.data);

export const deleteReviewApi = (id) =>
  customAxios.delete(`/api/reviews/${id}`).then((r) => r.data);
