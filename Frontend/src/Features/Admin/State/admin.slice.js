import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  stats: null,
  users: [],
  usersTotal: 0,
  usersPage: 1,
  usersPages: 1,
  currentUser: null,

  products: [],
  productsTotal: 0,
  productsPage: 1,
  productsPages: 1,
  currentProduct: null,

  orders: [],
  ordersTotal: 0,
  ordersPage: 1,
  ordersPages: 1,

  messages: [],
  messagesTotal: 0,
  messagesPage: 1,
  messagesPages: 1,

  loading: false,
  error: null,
};

const adminSlice = createSlice({
  name: "admin",
  initialState,
  reducers: {
    setDashboardStats: (state, action) => {
      state.stats = action.payload;
    },
    setAdminUsers: (state, action) => {
      state.users = action.payload.users;
      state.usersTotal = action.payload.total;
      state.usersPage = action.payload.page;
      state.usersPages = action.payload.pages;
    },
    setCurrentUser: (state, action) => {
      state.currentUser = action.payload;
    },
    updateUserInList: (state, action) => {
      state.users = state.users.map((u) =>
        u._id === action.payload._id ? { ...u, ...action.payload } : u
      );
      if (state.currentUser?.user?._id === action.payload._id) {
        state.currentUser.user = { ...state.currentUser.user, ...action.payload };
      }
    },
    setAdminProducts: (state, action) => {
      state.products = action.payload.products;
      state.productsTotal = action.payload.total;
      state.productsPage = action.payload.page;
      state.productsPages = action.payload.pages;
    },
    setCurrentProduct: (state, action) => {
      state.currentProduct = action.payload;
    },
    setAdminOrders: (state, action) => {
      state.orders = action.payload.orders;
      state.ordersTotal = action.payload.total;
      state.ordersPage = action.payload.page;
      state.ordersPages = action.payload.pages;
    },
    setAdminMessages: (state, action) => {
      state.messages = action.payload.messages;
      state.messagesTotal = action.payload.total;
      state.messagesPage = action.payload.page;
      state.messagesPages = action.payload.pages;
    },
    updateMessageInList: (state, action) => {
      state.messages = state.messages.map((m) =>
        m._id === action.payload._id ? { ...m, ...action.payload } : m
      );
    },
    removeMessageFromList: (state, action) => {
      state.messages = state.messages.filter((m) => m._id !== action.payload);
    },
    setAdminLoading: (state, action) => {
      state.loading = action.payload;
    },
    setAdminError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setDashboardStats,
  setAdminUsers,
  setCurrentUser,
  updateUserInList,
  setAdminProducts,
  setCurrentProduct,
  setAdminOrders,
  setAdminMessages,
  updateMessageInList,
  removeMessageFromList,
  setAdminLoading,
  setAdminError,
} = adminSlice.actions;

export default adminSlice.reducer;
