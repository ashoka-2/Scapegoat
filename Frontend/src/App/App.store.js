import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../Features/auth/State/auth.slice";
import toastReducer from "../utils/toast.slice.js";
import productReducer from "../Features/Products/State/product.slice";
import categoryReducer from "../Features/Categories/State/category.slice";
import brandReducer from "../Features/Brands/State/brand.slice";
import unitReducer from "../Features/Units/State/unit.slice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer,
    product: productReducer,
    category: categoryReducer,
    brand: brandReducer,
    unit: unitReducer,
  },
});