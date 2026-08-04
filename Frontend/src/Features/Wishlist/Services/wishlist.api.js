import axios from "../../../utils/axios";

const wishlistApiInstance = axios.create({
  baseURL: axios.defaults.baseURL + "/api/wishlist",
});

export async function fetchUserWishlist() {
  const response = await wishlistApiInstance.get("/");
  return response.data;
}

export async function toggleItemInWishlist(productId) {
  const response = await wishlistApiInstance.post("/toggle", { productId });
  return response.data;
}

export async function clearWishlistApi() {
  const response = await wishlistApiInstance.delete("/clear");
  return response.data;
}
