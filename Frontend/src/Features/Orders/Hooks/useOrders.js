import { useDispatch } from "react-redux";
import {
  setMyOrders,
  setSellerOrders,
  setCurrentOrder,
  addOrder,
  updateStatusInList,
  setLoading,
} from "../State/orders.slice";
import * as api from "../Services/orders.api";
import { addToast } from "../../../utils/toast.slice";

export const useOrders = () => {
  const dispatch = useDispatch();

  const handleCreateOrder = async (orderData) => {
    dispatch(setLoading(true));
    try {
      const data = await api.createOrderApi(orderData);
      if (data.order) {
        dispatch(addOrder(data.order));
        dispatch(addToast({ message: "Order placed successfully! 🎉", type: "success" }));
      }
      return data;
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to place order.";
      dispatch(addToast({ message: msg, type: "error" }));
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleFetchMyOrders = async () => {
    dispatch(setLoading(true));
    try {
      const data = await api.fetchMyOrdersApi();
      dispatch(setMyOrders(data.orders || []));
      return data;
    } catch (e) {
      console.error("Fetch my orders error:", e);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleFetchSellerOrders = async () => {
    dispatch(setLoading(true));
    try {
      const data = await api.fetchSellerOrdersApi();
      dispatch(setSellerOrders(data.orders || []));
      return data;
    } catch (e) {
      console.error("Fetch seller orders error:", e);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleFetchOrderById = async (id) => {
    dispatch(setLoading(true));
    try {
      const data = await api.fetchOrderByIdApi(id);
      dispatch(setCurrentOrder(data.order || null));
      return data;
    } catch (e) {
      console.error("Fetch order detail error:", e);
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      dispatch(updateStatusInList({ id, status }));
      await api.updateOrderStatusApi(id, status);
      dispatch(addToast({ message: `Order status updated to ${status}.`, type: "success" }));
    } catch (e) {
      dispatch(addToast({ message: "Failed to update order status.", type: "error" }));
    }
  };

  return {
    handleCreateOrder,
    handleFetchMyOrders,
    handleFetchSellerOrders,
    handleFetchOrderById,
    handleUpdateStatus,
  };
};
