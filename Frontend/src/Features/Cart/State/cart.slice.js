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
  },
});

export const { setCart, toggleCartDrawer, setCartDrawerOpen, setLoading, setError } = cartSlice.actions;
export default cartSlice.reducer;
