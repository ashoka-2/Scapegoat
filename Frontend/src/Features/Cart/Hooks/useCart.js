import { useDispatch, useSelector } from "react-redux";
import { addToast } from "../../../utils/toast.slice";
import {
  setCart,
  toggleCartDrawer,
  setCartDrawerOpen,
  setLoading,
  setError,
} from "../State/cart.slice";
import * as api from "../Services/cart.api";

export const useCart = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);
  const { cart, totalItems, subtotal, isDrawerOpen, loading } = useSelector((state) => state.cart);

  const toast = (message, type = "info") =>
    dispatch(addToast({ message, type }));

  const errMsg = (e) => e?.response?.data?.message || "Operation failed.";

  // Fetch Cart
  const handleGetCart = async () => {
    if (!user) return;
    dispatch(setLoading(true));
    try {
      const data = await api.fetchUserCartApi();
      dispatch(setCart(data));
      return data.data;
    } catch (e) {
      dispatch(setError(errMsg(e)));
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Add To Cart with Stock & Seller Restrictions
  const handleAddToCart = async (product, quantity = 1, variantId = null, selectedAttributes = null) => {
    if (!user) {
      toast("Please login to add items to your shopping cart.", "info");
      return;
    }

    if (!product) {
      toast("Invalid product selection.", "error");
      return;
    }

    // 1. Seller Ownership Check (Seller cannot purchase their own product)
    const sellerId = typeof product.seller === "object" ? product.seller?._id : product.seller;
    const userId = user?._id || user?.id;

    if (sellerId && String(sellerId) === String(userId)) {
      toast("Sellers cannot purchase their own listed products.", "error");
      return;
    }

    // 2. Stock Availability Check
    if (product.manageStock && (Number(product.stock) <= 0 || product.stockStatus === "outofstock")) {
      toast("Sorry, this item is currently out of stock.", "error");
      return;
    }

    dispatch(setLoading(true));
    try {
      const productId = product._id || product;
      const data = await api.addItemToCartApi({
        productId,
        variantId,
        selectedAttributes,
        quantity,
      });
      dispatch(setCart(data));
      toast(`Added "${product.title || 'item'}" to your cart! 🛍️`, "success");
      dispatch(setCartDrawerOpen(true));
      return data.data;
    } catch (e) {
      toast(errMsg(e), "error");
      throw e;
    } finally {
      dispatch(setLoading(false));
    }
  };

  // Update Item Quantity
  const handleUpdateQuantity = async (itemId, quantity) => {
    if (quantity < 1) {
      return handleRemoveFromCart(itemId);
    }
    try {
      const data = await api.updateCartItemQuantityApi(itemId, quantity);
      dispatch(setCart(data));
      return data.data;
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  // Remove Item
  const handleRemoveFromCart = async (itemId) => {
    try {
      const data = await api.deleteCartItemApi(itemId);
      dispatch(setCart(data));
      toast("Item removed from cart.", "info");
      return data.data;
    } catch (e) {
      toast(errMsg(e), "error");
    }
  };

  // Clear Cart
  const handleClearCart = async () => {
    dispatch(setLoading(true));
    try {
      const data = await api.emptyUserCartApi();
      dispatch(setCart(data));
      toast("Shopping cart cleared.", "info");
      return data.data;
    } catch (e) {
      toast(errMsg(e), "error");
    } finally {
      dispatch(setLoading(false));
    }
  };

  const handleToggleDrawer = () => {
    dispatch(toggleCartDrawer());
  };

  const handleSetDrawerOpen = (isOpen) => {
    dispatch(setCartDrawerOpen(isOpen));
  };

  return {
    cart,
    totalItems,
    subtotal,
    isDrawerOpen,
    loading,
    handleGetCart,
    handleAddToCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleClearCart,
    handleToggleDrawer,
    handleSetDrawerOpen,
  };
};
