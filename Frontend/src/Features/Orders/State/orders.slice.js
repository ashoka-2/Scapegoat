import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  myOrders: [],
  sellerOrders: [],
  currentOrder: null,
  loading: false,
  error: null,
};

const ordersSlice = createSlice({
  name: "orders",
  initialState,
  reducers: {
    setMyOrders: (state, action) => {
      state.myOrders = action.payload;
    },
    setSellerOrders: (state, action) => {
      state.sellerOrders = action.payload;
    },
    setCurrentOrder: (state, action) => {
      state.currentOrder = action.payload;
    },
    addOrder: (state, action) => {
      state.myOrders.unshift(action.payload);
    },
    updateStatusInList: (state, action) => {
      const { id, status } = action.payload;
      const myOrder = state.myOrders.find((o) => o._id === id);
      if (myOrder) myOrder.status = status;

      const sellerOrder = state.sellerOrders.find((o) => o._id === id);
      if (sellerOrder) sellerOrder.status = status;

      if (state.currentOrder && state.currentOrder._id === id) {
        state.currentOrder.status = status;
      }
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
  setMyOrders,
  setSellerOrders,
  setCurrentOrder,
  addOrder,
  updateStatusInList,
  setLoading,
  setError,
} = ordersSlice.actions;

export default ordersSlice.reducer;
