import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  brands: [],
  loading: false,
  creating: false,
  error: null,
};

const brandSlice = createSlice({
  name: "brand",
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
    setBrands: (state, action) => {
      state.brands = action.payload || [];
    },
    addCreatedBrand: (state, action) => {
      state.brands.unshift(action.payload);
    },
    updateBrandInState: (state, action) => {
      const idx = state.brands.findIndex((b) => b._id === action.payload._id);
      if (idx !== -1) {
        state.brands[idx] = action.payload;
      }
    },
    removeBrandFromState: (state, action) => {
      state.brands = state.brands.filter((b) => b._id !== action.payload);
    },
  },
});

export const {
  setLoading,
  setCreating,
  setError,
  setBrands,
  addCreatedBrand,
  updateBrandInState,
  removeBrandFromState,
} = brandSlice.actions;

export default brandSlice.reducer;
