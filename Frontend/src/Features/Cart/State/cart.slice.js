import { createSlice } from "@reduxjs/toolkit";

const calculatePrice = (item) => {
  if (item.variant?.price?.amount) return item.variant.price.amount;
  if (typeof item.variant?.priceAmount === "number") return item.variant.priceAmount;
  if (item.product?.sellingPrice?.amount) return item.product.sellingPrice.amount;
  if (item.product?.maxPrice?.amount) return item.product.maxPrice.amount;
  return 0;
};

export const getCartItemImage = (item) => {
  const variantImg = item?.variant?.images?.find((img) => img.isPrimary)?.url || item?.variant?.images?.[0]?.url || item?.variant?.image;
  if (variantImg) return variantImg;
  return item?.product?.images?.find((img) => img.isPrimary)?.url || item?.product?.images?.[0]?.url || "";
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: null,
    totalItems: 0,
    subtotal: 0,
    isDrawerOpen: false,
    loading: false,
    error: null,
  },
  reducers: {
    setCart: (state, action) => {
      const payloadData = action.payload?.data || action.payload || {};
      state.cart = payloadData;
      const items = Array.isArray(payloadData.items) ? payloadData.items : [];
      state.totalItems = items.reduce((acc, i) => acc + (i.quantity || 0), 0);
      state.subtotal = items.reduce((acc, i) => acc + calculatePrice(i) * (i.quantity || 0), 0);
    },
    toggleCartDrawer: (state) => {
      state.isDrawerOpen = !state.isDrawerOpen;
    },
    setCartDrawerOpen: (state, action) => {
      state.isDrawerOpen = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    optimisticUpdateQuantity: (state, action) => {
      const { itemId, quantity } = action.payload;
      if (!state.cart || !Array.isArray(state.cart.items)) return;

      const itemIdx = state.cart.items.findIndex((i) => (i._id || i.id) === itemId);

      if (itemIdx !== -1) {
        const item = state.cart.items[itemIdx];
        const maxStock = item.variant?.stock ?? item.product?.stock ?? Infinity;
        const validQuantity = Math.min(Math.max(0, Number(quantity)), maxStock);

        if (validQuantity <= 0) {
          state.cart.items.splice(itemIdx, 1);
        } else {
          state.cart.items[itemIdx].quantity = validQuantity;
        }

        state.totalItems = state.cart.items.reduce((acc, i) => acc + (i.quantity || 0), 0);
        state.subtotal = state.cart.items.reduce((acc, i) => acc + calculatePrice(i) * (i.quantity || 0), 0);
      }
    },
    optimisticRemoveItem: (state, action) => {
      const { itemId } = action.payload;
      if (!state.cart || !Array.isArray(state.cart.items)) return;

      state.cart.items = state.cart.items.filter((i) => (i._id || i.id) !== itemId);
      state.totalItems = state.cart.items.reduce((acc, i) => acc + (i.quantity || 0), 0);
      state.subtotal = state.cart.items.reduce((acc, i) => acc + calculatePrice(i) * (i.quantity || 0), 0);
    },
    optimisticAddToCart: (state, action) => {
      const { product, quantity = 1, variantId, selectedAttributes = {} } = action.payload;
      if (!state.cart) state.cart = { items: [] };
      if (!Array.isArray(state.cart.items)) state.cart.items = [];

      const prodId = product._id || product.id || product;
      const targetVariant = variantId ? product.variants?.find((v) => String(v._id) === String(variantId)) : null;
      const maxStock = targetVariant?.stock ?? product.stock ?? Infinity;

      const existingIdx = state.cart.items.findIndex((item) => {
        const itemProdId = item.product?._id || item.product?.id || item.product;
        if (String(itemProdId) !== String(prodId)) return false;
        if (variantId && String(item.variant?._id) !== String(variantId)) return false;

        const itemAttrs = item.selectedAttributes || {};
        return JSON.stringify(itemAttrs) === JSON.stringify(selectedAttributes);
      });

      if (existingIdx !== -1) {
        const currentQty = state.cart.items[existingIdx].quantity;
        state.cart.items[existingIdx].quantity = Math.min(currentQty + Number(quantity), maxStock);
      } else {
        const tempId = "temp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        state.cart.items.unshift({
          _id: tempId,
          product,
          quantity: Math.min(Number(quantity), maxStock),
          selectedAttributes,
          variant: targetVariant,
        });
      }

      state.totalItems = state.cart.items.reduce((acc, i) => acc + (i.quantity || 0), 0);
      state.subtotal = state.cart.items.reduce((acc, i) => acc + calculatePrice(i) * (i.quantity || 0), 0);
    },
  },
});

export const {
  setCart,
  toggleCartDrawer,
  setCartDrawerOpen,
  setLoading,
  setError,
  optimisticUpdateQuantity,
  optimisticRemoveItem,
  optimisticAddToCart,
} = cartSlice.actions;
export default cartSlice.reducer;
