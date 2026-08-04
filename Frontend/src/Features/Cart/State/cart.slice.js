import { createSlice } from "@reduxjs/toolkit";

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
      state.cart = action.payload?.data || action.payload;
      state.totalItems = action.payload?.totalItems ?? action.payload?.data?.items?.reduce((acc, i) => acc + i.quantity, 0) ?? 0;
      state.subtotal = action.payload?.subtotal ?? 0;
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
      const { itemId, quantity, selectedAttributes } = action.payload;
      if (!state.cart || !Array.isArray(state.cart.items)) return;

      const itemIdx = state.cart.items.findIndex(
        (i) => (i._id || i.id) === itemId
      );

      if (itemIdx !== -1) {
        if (quantity <= 0) {
          state.cart.items.splice(itemIdx, 1);
        } else {
          state.cart.items[itemIdx].quantity = Number(quantity);
          if (selectedAttributes) {
            state.cart.items[itemIdx].selectedAttributes = selectedAttributes;
          }
        }

        // Recalculate totalItems and subtotal immediately on frontend
        state.totalItems = state.cart.items.reduce((acc, i) => acc + (i.quantity || 0), 0);
        state.subtotal = state.cart.items.reduce((acc, i) => {
          const price = i.product?.sellingPrice?.amount || i.product?.maxPrice?.amount || i.variant?.priceAmount || 0;
          return acc + price * (i.quantity || 0);
        }, 0);
      }
    },
    optimisticRemoveItem: (state, action) => {
      const { itemId } = action.payload;
      if (!state.cart || !Array.isArray(state.cart.items)) return;

      state.cart.items = state.cart.items.filter(
        (i) => (i._id || i.id) !== itemId
      );

      state.totalItems = state.cart.items.reduce((acc, i) => acc + (i.quantity || 0), 0);
      state.subtotal = state.cart.items.reduce((acc, i) => {
        const price = i.product?.sellingPrice?.amount || i.product?.maxPrice?.amount || i.variant?.priceAmount || 0;
        return acc + price * (i.quantity || 0);
      }, 0);
    },
    optimisticAddToCart: (state, action) => {
      const { product, quantity = 1, variantId, selectedAttributes } = action.payload;
      if (!state.cart) {
        state.cart = { items: [] };
      }
      if (!Array.isArray(state.cart.items)) {
        state.cart.items = [];
      }

      const prodId = product._id || product.id || product;
      const existingIdx = state.cart.items.findIndex((item) => {
        const itemProdId = item.product?._id || item.product?.id || item.product;
        if (String(itemProdId) !== String(prodId)) return false;
        if (variantId && item.variant?._id && String(item.variant._id) !== String(variantId)) return false;
        return true;
      });

      if (existingIdx !== -1) {
        state.cart.items[existingIdx].quantity += Number(quantity);
        if (selectedAttributes) {
          state.cart.items[existingIdx].selectedAttributes = selectedAttributes;
        }
      } else {
        const tempId = "temp_" + Date.now() + "_" + Math.random().toString(36).substr(2, 5);
        state.cart.items.unshift({
          _id: tempId,
          product: product,
          quantity: Number(quantity),
          selectedAttributes: selectedAttributes || {},
          variant: variantId ? product.variants?.find((v) => String(v._id) === String(variantId)) : null,
        });
      }

      state.totalItems = state.cart.items.reduce((acc, i) => acc + (i.quantity || 0), 0);
      state.subtotal = state.cart.items.reduce((acc, i) => {
        const price = i.product?.sellingPrice?.amount || i.product?.maxPrice?.amount || i.variant?.priceAmount || 0;
        return acc + price * (i.quantity || 0);
      }, 0);
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
