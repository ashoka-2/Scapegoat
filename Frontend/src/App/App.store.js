import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../Features/auth/State/auth.slice";
import toastReducer from "../utils/toast.slice.js"
export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer,
  },
});