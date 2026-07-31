import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  units: [],
  loading: false,
  creating: false,
  error: null,
};

const unitSlice = createSlice({
  name: "unit",
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
    setUnits: (state, action) => {
      state.units = action.payload || [];
    },
    addCreatedUnit: (state, action) => {
      state.units.unshift(action.payload);
    },
    updateUnitInState: (state, action) => {
      const idx = state.units.findIndex((u) => u._id === action.payload._id);
      if (idx !== -1) {
        state.units[idx] = action.payload;
      }
    },
    removeUnitFromState: (state, action) => {
      state.units = state.units.filter((u) => u._id !== action.payload);
    },
  },
});

export const {
  setLoading,
  setCreating,
  setError,
  setUnits,
  addCreatedUnit,
  updateUnitInState,
  removeUnitFromState,
} = unitSlice.actions;

export default unitSlice.reducer;
