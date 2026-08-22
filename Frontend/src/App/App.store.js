import { configureStore } from "@reduxjs/toolkit";
import authReducer from "../Features/auth/State/auth.slice";
import toastReducer from "../utils/toast.slice.js";
import productReducer from "../Features/Products/State/product.slice";
import categoryReducer from "../Features/Categories/State/category.slice";
import brandReducer from "../Features/Brands/State/brand.slice";
import unitReducer from "../Features/Units/State/unit.slice";
import cartReducer from "../Features/Cart/State/cart.slice";
import wishlistReducer from "../Features/Wishlist/State/wishlist.slice";
import messagesReducer from "../Features/Messages/State/messages.slice";
import settingsReducer from "../Features/Settings/State/settings.slice";
import ordersReducer from "../Features/Orders/State/orders.slice";
import sellerReducer from "../Features/Seller/State/seller.slice";
import adminReducer from "../Features/Admin/State/admin.slice";
import aiChatReducer from "../Features/AI/State/aiChat.slice.js";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    toast: toastReducer,
    product: productReducer,
    category: categoryReducer,
    brand: brandReducer,
    unit: unitReducer,
    cart: cartReducer,
    wishlist: wishlistReducer,
    messages: messagesReducer,
    settings: settingsReducer,
    orders: ordersReducer,
    seller: sellerReducer,
    admin: adminReducer,
    aiChat: aiChatReducer,
  },
});