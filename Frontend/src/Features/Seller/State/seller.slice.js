import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  allCarts: [],
  allWishlists: [],
  allOrders: [],
  users: [],
  loading: false,
  error: null,
};

const sellerSlice = createSlice({
  name: "seller",
  initialState,
  reducers: {
    setAllCarts: (state, action) => {
      state.allCarts = action.payload || [];
    },
    setAllWishlists: (state, action) => {
      state.allWishlists = action.payload || [];
    },
    setAllOrders: (state, action) => {
      state.allOrders = action.payload || [];
    },
    setUsers: (state, action) => {
      state.users = action.payload || [];
    },
    updateSellerOrderStatus: (state, action) => {
      const updatedOrder = action.payload;
      state.allOrders = state.allOrders.map((o) =>
        o._id === updatedOrder._id ? updatedOrder : o
      );
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const {
  setAllCarts,
  setAllWishlists,
  setAllOrders,
  setUsers,
  updateSellerOrderStatus,
  setLoading,
  setError,
} = sellerSlice.actions;

export default sellerSlice.reducer;
