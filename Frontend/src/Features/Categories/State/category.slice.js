import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  categories: [],
  loading: false,
  creating: false,
  error: null,
};

const categorySlice = createSlice({
  name: "category",
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
    setCategories: (state, action) => {
      state.categories = action.payload || [];
    },
    addCreatedCategory: (state, action) => {
      state.categories.unshift(action.payload);
    },
    updateCategoryInState: (state, action) => {
      const idx = state.categories.findIndex((c) => c._id === action.payload._id);
      if (idx !== -1) {
        state.categories[idx] = action.payload;
      }
    },
    removeCategoryFromState: (state, action) => {
      state.categories = state.categories.filter((c) => c._id !== action.payload);
    },
  },
});

export const {
  setLoading,
  setCreating,
  setError,
  setCategories,
  addCreatedCategory,
  updateCategoryInState,
  removeCategoryFromState,
} = categorySlice.actions;

export default categorySlice.reducer;
