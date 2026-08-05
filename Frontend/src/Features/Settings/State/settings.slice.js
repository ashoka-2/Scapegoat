import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  settings: null,
  loading: false,
  error: null,
};

const settingsSlice = createSlice({
  name: "settings",
  initialState,
  reducers: {
    setSettings: (state, action) => {
      state.settings = action.payload;
      state.error = null;
    },
    // Applied when the realtime socket event fires
    applyRealtimeSettings: (state, action) => {
      state.settings = action.payload;
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setSettings, applyRealtimeSettings, setLoading, setError } = settingsSlice.actions;

export default settingsSlice.reducer;
