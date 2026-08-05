import { useDispatch } from "react-redux";
import {
  setAllCarts,
  setAllWishlists,
  setAllOrders,
  setUsers,
  setLoading,
  setError,
} from "../State/seller.slice";
import * as api from "../Services/seller.api";
import socket from "../../../utils/socket";
import { addToast } from "../../../utils/toast.slice";

export const useSeller = () => {
  const dispatch = useDispatch();

  const syncDashboardData = async () => {
    try {
      const [cartsRes, wishRes, ordersRes, usersRes] = await Promise.all([
        api.fetchAllCartsApi().catch(() => ({ carts: [] })),
        api.fetchAllWishlistsApi().catch(() => ({ wishlists: [] })),
        api.fetchAllOrdersApi().catch(() => ({ orders: [] })),
        api.fetchAllUsersApi().catch(() => ({ users: [] })),
      ]);

      dispatch(setAllCarts(cartsRes.carts || []));
      dispatch(setAllWishlists(wishRes.wishlists || []));
      dispatch(setAllOrders(ordersRes.orders || []));
      dispatch(setUsers(usersRes.users || []));
    } catch (e) {
      console.error("Seller dashboard background sync error", e);
    }
  };

  const setupRealtimeListener = (user) => {
    if (window.sellerSocketListening) return;
    window.sellerSocketListening = true;

    // Join seller private room if logged in
    const userId = user?._id || user?.id;
    if (userId) {
      socket.emit("join_room", `seller_${userId}`);
      socket.emit("join_room", `user_${userId}`);
    }

    // Listen for global and targeted seller updates
    socket.on("realtime_update", (payload) => {
      console.log("⚡ Realtime socket update received (seller):", payload.type);
      if (
        [
          "cart_update",
          "wishlist_update",
          "order_update",
          "order_created",
          "settings_update",
        ].includes(payload.type)
      ) {
        syncDashboardData();
      }
    });

    socket.on("new_order", (data) => {
      console.log("⚡ New Order alert for seller:", data);
      dispatch(
        addToast({
          message: `🔔 New Order received! ₹${data.totalPrice || ""}`,
          type: "success",
        })
      );
      syncDashboardData();
    });

    socket.on("cart_update", () => syncDashboardData());
    socket.on("wishlist_update", () => syncDashboardData());
  };

  const fetchDashboardData = async (user) => {
    dispatch(setLoading(true));
    try {
      setupRealtimeListener(user);
      await syncDashboardData();
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to load seller dashboard.";
      dispatch(setError(msg));
    } finally {
      dispatch(setLoading(false));
    }
  };

  return {
    fetchDashboardData,
    syncDashboardData,
    setupRealtimeListener,
  };
};
