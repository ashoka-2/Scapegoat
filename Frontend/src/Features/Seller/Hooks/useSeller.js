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
      const [cartsRes, wishRes, ordersRes, usersRes, customersRes] = await Promise.all([
        api.fetchAllCartsApi().catch(() => ({ carts: [] })),
        api.fetchAllWishlistsApi().catch(() => ({ wishlists: [] })),
        api.fetchAllOrdersApi().catch(() => ({ orders: [] })),
        api.fetchAllUsersApi().catch(() => ({ users: [] })),
        api.fetchSellerCustomersApi().catch(() => ({ customers: [] })),
      ]);

      dispatch(setAllCarts(cartsRes.carts || []));
      dispatch(setAllWishlists(wishRes.wishlists || []));
      dispatch(setAllOrders(ordersRes.orders || []));

      // Combine directory users & permanent customers
      const combinedUsers = [...(usersRes.users || []), ...(customersRes.customers || [])];
      const userMap = new Map();
      combinedUsers.forEach((u) => {
        if (u && u._id && u.role !== "admin") {
          userMap.set(u._id.toString(), u);
        }
      });

      dispatch(setUsers(Array.from(userMap.values())));
    } catch (e) {
      console.error("Seller dashboard background sync error", e);
    }
  };

  const setupRealtimeListener = (user) => {
    if (window.sellerSocketListening) return;
    window.sellerSocketListening = true;

    const userId = user?._id || user?.id;
    if (userId) {
      socket.emit("join_room", `seller_${userId}`);
      socket.emit("join_room", `user_${userId}`);
    }

    const triggerRefresh = () => {
      console.log("⚡ Instant socket event received -> syncing dashboard...");
      syncDashboardData();
    };

    socket.on("realtime_update", (payload) => {
      console.log("⚡ Realtime socket update received (seller):", payload.type);
      triggerRefresh();
    });

    socket.on("new_order", (data) => {
      console.log("⚡ New Order alert for seller:", data);
      dispatch(
        addToast({
          message: `🔔 New Order received! ₹${data.totalPrice || ""}`,
          type: "success",
        })
      );
      triggerRefresh();
    });

    socket.on("cart_update", triggerRefresh);
    socket.on("wishlist_update", triggerRefresh);
    socket.on("order_created", triggerRefresh);
    socket.on("order_status_updated", triggerRefresh);
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

  const handleFetchUserDetail = async (id) => {
    try {
      const data = await api.fetchUserDetailApi(id);
      return data.user;
    } catch (e) {
      const msg = e?.response?.data?.message || "Failed to fetch user details.";
      dispatch(addToast({ message: msg, type: "error" }));
      return null;
    }
  };

  return {
    fetchDashboardData,
    syncDashboardData,
    setupRealtimeListener,
    handleFetchUserDetail,
  };
};
