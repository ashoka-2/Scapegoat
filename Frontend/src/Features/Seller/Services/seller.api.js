import axios from "../../../utils/axios";

export const fetchAllCartsApi = () =>
  axios.get("/api/cart/all").then((r) => r.data);
export const fetchAllWishlistsApi = () =>
  axios.get("/api/wishlist/all").then((r) => r.data);
export const fetchAllOrdersApi = () =>
  axios.get("/api/orders/all").then((r) => r.data);
export const fetchAllUsersApi = () =>
  axios.get("/api/auth/users").then((r) => r.data);
