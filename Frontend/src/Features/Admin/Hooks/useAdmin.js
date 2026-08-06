import { useDispatch, useSelector } from "react-redux";
import { addToast } from "../../../utils/toast.slice";
import {
  getDashboardStatsApi,
  getAdminUsersApi,
  getUserByIdApi,
  updateUserRoleApi,
  toggleBanUserApi,
  getAdminProductsApi,
  getProductDetailAdminApi,
  getAdminOrdersApi,
  getAdminMessagesApi,
  markMessageReadApi,
  deleteMessageApi,
} from "../Services/admin.api";
import {
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
} from "../State/admin.slice";

export const useAdmin = () => {
  const dispatch = useDispatch();
  const adminState = useSelector((state) => state.admin);

  const fetchDashboardStats = async (params = {}) => {
    dispatch(setAdminLoading(true));
    try {
      const data = await getDashboardStatsApi(params);
      if (data.success) {
        dispatch(setDashboardStats(data.stats));
      }
    } catch (err) {
      dispatch(setAdminError(err.response?.data?.message || err.message));
    } finally {
      dispatch(setAdminLoading(false));
    }
  };

  const fetchAdminUsers = async (params = {}) => {
    dispatch(setAdminLoading(true));
    try {
      const data = await getAdminUsersApi(params);
      if (data.success) {
        dispatch(
          setAdminUsers({
            users: data.users,
            total: data.total,
            page: data.page,
            pages: data.pages,
          })
        );
      }
    } catch (err) {
      dispatch(setAdminError(err.response?.data?.message || err.message));
    } finally {
      dispatch(setAdminLoading(false));
    }
  };

  const fetchUserById = async (id) => {
    dispatch(setAdminLoading(true));
    try {
      const data = await getUserByIdApi(id);
      if (data.success) {
        dispatch(setCurrentUser(data));
      }
    } catch (err) {
      dispatch(addToast({ message: "Failed to fetch user details", type: "error" }));
    } finally {
      dispatch(setAdminLoading(false));
    }
  };

  const changeUserRole = async (id, role) => {
    try {
      const data = await updateUserRoleApi(id, role);
      if (data.success) {
        dispatch(updateUserInList(data.user));
        dispatch(addToast({ message: data.message, type: "success" }));
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || "Failed to update role", type: "error" }));
    }
  };

  const toggleBan = async (id) => {
    try {
      const data = await toggleBanUserApi(id);
      if (data.success) {
        dispatch(updateUserInList(data.user));
        dispatch(addToast({ message: data.message, type: "success" }));
      }
    } catch (err) {
      dispatch(addToast({ message: err.response?.data?.message || "Failed to toggle ban", type: "error" }));
    }
  };

  const fetchAdminProducts = async (params = {}) => {
    dispatch(setAdminLoading(true));
    try {
      const data = await getAdminProductsApi(params);
      if (data.success) {
        dispatch(
          setAdminProducts({
            products: data.products,
            total: data.total,
            page: data.page,
            pages: data.pages,
          })
        );
      }
    } catch (err) {
      dispatch(setAdminError(err.response?.data?.message || err.message));
    } finally {
      dispatch(setAdminLoading(false));
    }
  };

  const fetchProductDetailAdmin = async (id) => {
    dispatch(setAdminLoading(true));
    try {
      const data = await getProductDetailAdminApi(id);
      if (data.success) {
        dispatch(setCurrentProduct(data));
      }
    } catch (err) {
      dispatch(addToast({ message: "Failed to fetch product details", type: "error" }));
    } finally {
      dispatch(setAdminLoading(false));
    }
  };

  const fetchAdminOrders = async (params = {}) => {
    dispatch(setAdminLoading(true));
    try {
      const data = await getAdminOrdersApi(params);
      if (data.success) {
        dispatch(
          setAdminOrders({
            orders: data.orders,
            total: data.total,
            page: data.page,
            pages: data.pages,
          })
        );
      }
    } catch (err) {
      dispatch(setAdminError(err.response?.data?.message || err.message));
    } finally {
      dispatch(setAdminLoading(false));
    }
  };

  const fetchAdminMessages = async (params = {}) => {
    dispatch(setAdminLoading(true));
    try {
      const data = await getAdminMessagesApi(params);
      if (data.success) {
        dispatch(
          setAdminMessages({
            messages: data.messages,
            total: data.total,
            page: data.page,
            pages: data.pages,
          })
        );
      }
    } catch (err) {
      dispatch(setAdminError(err.response?.data?.message || err.message));
    } finally {
      dispatch(setAdminLoading(false));
    }
  };

  const toggleMessageRead = async (id) => {
    try {
      const data = await markMessageReadApi(id);
      if (data.success) {
        dispatch(updateMessageInList(data.data));
        dispatch(addToast({ message: data.message, type: "success" }));
        fetchDashboardStats();
      }
    } catch (err) {
      dispatch(addToast({ message: "Failed to update message status", type: "error" }));
    }
  };

  const removeMessage = async (id) => {
    try {
      const data = await deleteMessageApi(id);
      if (data.success) {
        dispatch(removeMessageFromList(id));
        dispatch(addToast({ message: data.message, type: "success" }));
        fetchDashboardStats();
      }
    } catch (err) {
      dispatch(addToast({ message: "Failed to delete message", type: "error" }));
    }
  };

  return {
    ...adminState,
    fetchDashboardStats,
    fetchAdminUsers,
    fetchUserById,
    changeUserRole,
    toggleBan,
    fetchAdminProducts,
    fetchProductDetailAdmin,
    fetchAdminOrders,
    fetchAdminMessages,
    toggleMessageRead,
    removeMessage,
  };
};
