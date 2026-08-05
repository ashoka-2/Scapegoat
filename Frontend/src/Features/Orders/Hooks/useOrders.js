import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import {
  setMyOrders,
  setSellerOrders,
  setCurrentOrder,
  addOrder,
  updateStatusInList,
  setLoading,
} from "../State/orders.slice";
import { addToast } from "../../../utils/toast.slice";
import { clearCart } from "../../Cart/State/cart.slice";
import * as api from "../Services/orders.api";
import { addItemToCartApi } from "../../Cart/Services/cart.api";

export const useOrders = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleCreateOrder = async (orderData) => {
    dispatch(setLoading(true));
    try {
      const data = await api.createOrderApi(orderData);
      if (data.order) {
        dispatch(addOrder(data.order));
        dispatch(clearCart());
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

  const handleCancelOrder = async (id) => {
    try {
      const data = await api.cancelMyOrderApi(id);
      dispatch(updateStatusInList({ id, status: "Cancelled" }));
      dispatch(addToast({ message: data.message || "Order cancelled successfully.", type: "success" }));
      return data;
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to cancel order.";
      dispatch(addToast({ message: msg, type: "error" }));
      throw e;
    }
  };

  const handleReorder = async (orderItems) => {
    let addedCount = 0;
    for (const item of orderItems) {
      try {
        const productId = item.product?._id || item.product;
        await addItemToCartApi({
          productId,
          variantId: item.variantId || null,
          selectedAttributes: item.selectedAttributes || {},
          quantity: item.quantity,
        });
        addedCount++;
      } catch (e) {
        // Product may be out of stock or deleted — skip silently
        console.warn("Reorder item failed:", item.name, e?.response?.data?.message);
      }
    }

    if (addedCount > 0) {
      dispatch(addToast({ message: `${addedCount} item${addedCount > 1 ? "s" : ""} added to your cart.`, type: "success" }));
      navigate("/cart");
    } else {
      dispatch(addToast({ message: "None of the items could be added. They may be out of stock.", type: "error" }));
    }
  };

  return {
    handleCreateOrder,
    handleFetchMyOrders,
    handleFetchSellerOrders,
    handleFetchOrderById,
    handleUpdateStatus,
    handleCancelOrder,
    handleReorder,
  };
};
