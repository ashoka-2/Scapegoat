import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToast } from "../../../utils/toast.slice";
import {
  setCart,
  toggleCartDrawer,
  setCartDrawerOpen,
  setLoading,
  setError,
  optimisticUpdateQuantity,
  optimisticRemoveItem,
  optimisticAddToCart,
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

  const deriveDefaultAttributes = (product) => {
    if (!product) return null;
    const derived = {};
    if (product.variants && product.variants.length > 0 && product.variants[0]?.attributes) {
      const raw = typeof product.variants[0].attributes.forEach === "function"
        ? Object.fromEntries(product.variants[0].attributes)
        : (product.variants[0].attributes._doc || product.variants[0].attributes);
      if (raw && typeof raw === "object") {
        Object.entries(raw).forEach(([k, v]) => {
          derived[k] = Array.isArray(v) ? v[0] : v;
        });
      }
    }
    if (product.attributes && Array.isArray(product.attributes)) {
      product.attributes.forEach((attr) => {
        const name = attr.name || attr.key;
        const opts = attr.options || attr.values || [];
        if (name && opts.length > 0 && !derived[name]) {
          derived[name] = opts[0];
        }
      });
    }
    return Object.keys(derived).length > 0 ? derived : null;
  };

  const getSellerId = (prod) => {
    if (!prod) return null;
    if (typeof prod.seller === "object") return prod.seller?._id || prod.seller?.id;
    if (typeof prod.seller === "string") return prod.seller;
    if (prod.sellerId) return prod.sellerId;
    if (typeof prod.user === "object") return prod.user?._id || prod.user?.id;
    if (typeof prod.user === "string") return prod.user;
    return null;
  };

  // Fetch Cart automatically on mount/login
  useEffect(() => {
    if (user && (!cart || !cart.items)) {
      handleGetCart();
    }
  }, [user]);

  // Add To Cart with Stock & Seller Restrictions (⚡ 100% Optimistic UX)
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
    const sellerId = getSellerId(product);
    const userId = user?._id || user?.id;

    if (sellerId && userId && String(sellerId) === String(userId)) {
      toast("Alert: Sellers cannot purchase their own listed products.", "error");
      return;
    }

    // 2. Stock Availability Check
    if (product.manageStock && (Number(product.stock) <= 0 || product.stockStatus === "outofstock")) {
      toast("Sorry, this item is currently out of stock.", "error");
      return;
    }

    const finalAttributes = (selectedAttributes && Object.keys(selectedAttributes).length > 0)
      ? selectedAttributes
      : deriveDefaultAttributes(product);

    const finalVariantId = variantId || (product.variants?.length > 0 ? product.variants[0]?._id : null);

    // ⚡ 1. INSTANT Optimistic UI Update & Toast
    dispatch(optimisticAddToCart({
      product,
      quantity: Number(quantity),
      variantId: finalVariantId,
      selectedAttributes: finalAttributes,
    }));
    toast(`Added "${product.title || 'item'}" to your cart! 🛍️`, "success");
    dispatch(setCartDrawerOpen(true));

    // ⚡ 2. Async Background Backend Sync
    try {
      const productId = product._id || product.id || product;
      const data = await api.addItemToCartApi({
        productId,
        variantId: finalVariantId,
        selectedAttributes: finalAttributes,
        quantity: Number(quantity),
      });
      dispatch(setCart(data));
      return data.data;
    } catch (e) {
      toast(errMsg(e), "error");
      handleGetCart();
    }
  };

  // Update Item Quantity or Attributes with Optimistic UX (Instant UI, async backend)
  const handleUpdateQuantity = async (itemId, quantity, selectedAttributes = null) => {
    if (quantity < 1) {
      return handleRemoveFromCart(itemId);
    }

    // ⚡ Optimistic update immediately on frontend (0ms latency!)
    dispatch(optimisticUpdateQuantity({ itemId, quantity, selectedAttributes }));

    try {
      const data = await api.updateCartItemQuantityApi(itemId, quantity, selectedAttributes);
      dispatch(setCart(data));
      return data.data;
    } catch (e) {
      toast(errMsg(e), "error");
      handleGetCart();
    }
  };

  // Remove Item with Optimistic UX (Instant UI, async backend)
  const handleRemoveFromCart = async (itemId) => {
    // ⚡ Optimistic remove immediately on frontend (0ms latency!)
    dispatch(optimisticRemoveItem({ itemId }));

    try {
      const data = await api.deleteCartItemApi(itemId);
      dispatch(setCart(data));
      toast("Item removed from cart.", "info");
      return data.data;
    } catch (e) {
      toast(errMsg(e), "error");
      handleGetCart();
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
