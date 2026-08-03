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
          state.cart.items[itemIdx].quantity = quantity;
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
} = cartSlice.actions;
export default cartSlice.reducer;
