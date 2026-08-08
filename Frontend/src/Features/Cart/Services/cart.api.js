import { createApiInstance } from "../../../utils/axios";

const cartApiInstance = createApiInstance("/api/cart");

/**
 * Fetch user's cart
 */
export async function fetchUserCartApi() {
  const response = await cartApiInstance.get("");
  return response.data;
}

/**
 * Add item to cart
 */
export async function addItemToCartApi({ productId, variantId, selectedAttributes, quantity = 1 }) {
  const response = await cartApiInstance.post("/add", {
    productId,
    variantId,
    selectedAttributes,
    quantity,
  });
  return response.data;
}

/**
 * Update item quantity (manually typed or changed)
 */
export async function updateCartItemQuantityApi(itemId, quantity, selectedAttributes = null) {
  const response = await cartApiInstance.put(`/item/${itemId}`, { quantity, selectedAttributes });
  return response.data;
}

/**
 * Increment item quantity (+1)
 */
export async function incrementCartItemQuantityApi(itemId) {
  const response = await cartApiInstance.patch(`/item/${itemId}/increment`);
  return response.data;
}

/**
 * Decrement item quantity (-1)
 */
export async function decrementCartItemQuantityApi(itemId) {
  const response = await cartApiInstance.patch(`/item/${itemId}/decrement`);
  return response.data;
}

/**
 * Delete item from cart
 */
export async function deleteCartItemApi(itemId) {
  const response = await cartApiInstance.delete(`/item/${itemId}`);
  return response.data;
}

/**
 * Clear all items from cart
 */
export async function emptyUserCartApi() {
  const response = await cartApiInstance.delete("/clear");
  return response.data;
}
