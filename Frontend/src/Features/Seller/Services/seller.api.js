import customAxios from "../../../utils/axios";

export const fetchAllCartsApi = () => customAxios.get("/api/cart/all").then((r) => r.data);
export const fetchAllWishlistsApi = () => customAxios.get("/api/wishlist/all").then((r) => r.data);
export const fetchAllOrdersApi = () => customAxios.get("/api/orders/all").then((r) => r.data);
export const fetchAllUsersApi = () => customAxios.get("/api/auth/users").then((r) => r.data);
export const fetchSellerCustomersApi = () => customAxios.get("/api/auth/customers").then((r) => r.data);
export const fetchUserDetailApi = (id) => customAxios.get(`/api/auth/users/${id}`).then((r) => r.data);
