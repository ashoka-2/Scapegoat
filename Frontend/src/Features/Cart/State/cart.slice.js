import { createSlice } from "@reduxjs/toolkit";

export const getCartItemImage = (item) => {
  const variantImg = item?.variant?.images?.find((img) => img.isPrimary)?.url || item?.variant?.images?.[0]?.url || item?.variant?.image;
  if (variantImg) return variantImg;
  return item?.product?.images?.find((img) => img.isPrimary)?.url || item?.product?.images?.[0]?.url || "";
};

const cartSlice = createSlice({
  name: "cart",
  initialState: {
    cart: null,
    isDrawerOpen: false,
    loading: false,
    error: null,
  },
  reducers: {
    setCart: (state, action) => {
      const payload = action.payload;
      state.cart = payload?.data || payload?.cart || payload || null;
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
  },
});

export const {
  setCart,
  toggleCartDrawer,
  setCartDrawerOpen,
  setLoading,
  setError,
} = cartSlice.actions;

export default cartSlice.reducer;
