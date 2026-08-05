import { createSlice } from "@reduxjs/toolkit";

const wishlistSlice = createSlice({
  name: "wishlist",
  initialState: {
    wishlist: null,
    loading: false,
    error: null,
  },
  reducers: {
    setWishlist: (state, action) => {
      state.wishlist = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    clearWishlist: (state) => {
      state.wishlist = null;
      state.error = null;
    },
  },
});

export const { setWishlist, setLoading, setError, clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;
