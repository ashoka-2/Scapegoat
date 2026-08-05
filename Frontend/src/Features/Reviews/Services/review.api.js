import axios from "../../../utils/axios";

export const fetchProductReviewsApi = (productId) =>
  axios.get(`/api/reviews/product/${productId}`).then((r) => r.data);

export const fetchUserReviewsApi = () =>
  axios.get("/api/reviews/user").then((r) => r.data);

export const submitReviewApi = (data) =>
  axios.post("/api/reviews", data).then((r) => r.data);

export const deleteReviewApi = (id) =>
  axios.delete(`/api/reviews/${id}`).then((r) => r.data);
