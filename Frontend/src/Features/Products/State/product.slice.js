import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  products: [],
  sellerProducts: [],
  currentProduct: null,
  total: 0,
  page: 1,
  pages: 1,
  loading: false,
  creating: false,
  error: null,
};

const productSlice = createSlice({
  name: "product",
  initialState,
  reducers: {
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setCreating: (state, action) => {
      state.creating = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
    setProducts: (state, action) => {
      state.products = action.payload.products || action.payload.data || [];
      state.total = action.payload.total || 0;
      state.page = action.payload.page || 1;
      state.pages = action.payload.pages || 1;
    },
    setSellerProducts: (state, action) => {
      state.sellerProducts = action.payload;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    addCreatedProduct: (state, action) => {
      state.sellerProducts.unshift(action.payload);
      state.products.unshift(action.payload);
    },
  },
});

export const {
  setLoading,
  setCreating,
  setError,
  setProducts,
  setSellerProducts,
  setCurrentProduct,
  addCreatedProduct,
} = productSlice.actions;

export default productSlice.reducer;
