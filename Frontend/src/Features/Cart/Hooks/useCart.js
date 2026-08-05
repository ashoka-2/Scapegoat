import { useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import { addToast } from "../../../utils/toast.slice";
import {
  setCart,
  toggleCartDrawer,
  setCartDrawerOpen,
  setLoading,
  setError,
  clearCart,
} from "../State/cart.slice";
import * as api from "../Services/cart.api";

export const useCart = () => {
  const dispatch = useDispatch();
  const updateTimersRef = useRef({});
  const latestQtyRef = useRef({});
  const { user } = useSelector((state) => state.auth);
  const { cart, isDrawerOpen, loading } = useSelector((state) => state.cart);

  const toast = (message, type = "info") =>
    dispatch(addToast({ message, type }));

  const errMsg = (e) => e?.response?.data?.message || "Operation failed.";

  // Calculate item price
  const calculateItemPrice = (item) => {
    if (item?.variant?.price?.amount) return item.variant.price.amount;
    if (typeof item?.variant?.priceAmount === "number") return item.variant.priceAmount;
    if (item?.product?.sellingPrice?.amount) return item.product.sellingPrice.amount;
    if (item?.product?.maxPrice?.amount) return item.product.maxPrice.amount;
    return 0;
  };

  // Derived cart totals
  const items = Array.isArray(cart?.items) ? cart.items : [];
  const totalItems = items.reduce((acc, i) => acc + (Number(i.quantity) || 0), 0);
  const subtotal = items.reduce((acc, i) => acc + calculateItemPrice(i) * (Number(i.quantity) || 0), 0);

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

  // Fetch Cart automatically when user changes (account switch or fresh login)
  useEffect(() => {
    if (user) {
      // Always re-fetch on user change — clears stale data from previous account
      handleGetCart();
    } else {
      // Clear cart when user logs out
      dispatch(clearCart());
    }
  }, [user?._id || user?.id]);

  // Add To Cart with Optimistic UX & Rollback
  const handleAddToCart = async (product, quantity = 1, variantId = null, selectedAttributes = null) => {
    if (!user) {
      toast("Please login to add items to your shopping cart.", "info");
      return;
    }
    if (!product) return;

    const prodId = product._id || product.id || product;

    // Resolve target variant by variantId or by matching selectedAttributes
    let targetVariant = null;
    if (variantId && product.variants?.length > 0) {
      targetVariant = product.variants.find((v) => String(v._id) === String(variantId));
    } else if (selectedAttributes && product.variants?.length > 0) {
      targetVariant = product.variants.find((v) => {
        const rawAttrs = v.attributes instanceof Map
          ? Object.fromEntries(v.attributes)
          : (v.attributes?._doc || v.attributes || {});
        return Object.entries(selectedAttributes).every(([k, val]) => {
          const vVal = rawAttrs[k] || rawAttrs[k.toLowerCase()];
          if (!vVal) return true;
          return String(vVal).trim().toLowerCase() === String(val).trim().toLowerCase();
        });
      }) || product.variants[0];
    }

    const finalVariantId = targetVariant?._id || variantId || null;
    const maxStock = targetVariant?.stock ?? product?.stock ?? 999;

    const targetAttrsStr = JSON.stringify(selectedAttributes || {});

    const existingItem = items.find((item) => {
      const itemProdId = item.product?._id || item.product?.id || item.product;
      if (String(itemProdId) !== String(prodId)) return false;

      const itemVarId = item.variant?._id || item.variantId;
      if (finalVariantId || itemVarId) {
        if (String(itemVarId) !== String(finalVariantId)) return false;
      }

      const itemAttrsStr = JSON.stringify(item.selectedAttributes || {});
      return itemAttrsStr === targetAttrsStr;
    });

    const currentQtyInCart = existingItem?.quantity || 0;
    if (currentQtyInCart + Number(quantity) > maxStock) {
      toast(`Cannot add more. Only ${maxStock} units available in stock (${currentQtyInCart} already in cart).`, "error");
      return;
    }

    const originalCart = cart || { items: [] };
    let updatedItems = [...items];

    if (existingItem) {
      updatedItems = updatedItems.map((item) => {
        const itemProdId = item.product?._id || item.product?.id || item.product;
        if (String(itemProdId) === String(prodId)) {
          return { ...item, quantity: Math.min(item.quantity + Number(quantity), maxStock) };
        }
        return item;
      });
    } else {
      updatedItems.unshift({
        _id: "temp_" + Date.now(),
        product,
        quantity: Math.min(Number(quantity), maxStock),
        selectedAttributes,
        variant: targetVariant,
      });
    }

    // ⚡ Instant 0ms Optimistic UI update
    dispatch(setCart({ ...originalCart, items: updatedItems }));
    toast(`Added "${product.title || 'item'}" to your bag! 🛍️`, "success");
    dispatch(setCartDrawerOpen(true));

    try {
      const data = await api.addItemToCartApi({
        productId: prodId,
        variantId: finalVariantId,
        selectedAttributes,
        quantity: Number(quantity),
      });
      dispatch(setCart(data));
    } catch (e) {
      dispatch(setCart(originalCart));
      toast(errMsg(e), "error");
    }
  };

  // Update Item Quantity with Optimistic UX & Race-Condition Safe Sync
  const handleUpdateQuantity = (itemId, quantity, selectedAttributes = null) => {
    const nextQty = Number(quantity);

    if (nextQty <= 0) {
      if (updateTimersRef.current[itemId]) {
        clearTimeout(updateTimersRef.current[itemId]);
        delete updateTimersRef.current[itemId];
      }
      return handleRemoveFromCart(itemId);
    }

    const targetItem = items.find((i) => String(i._id || i.id) === String(itemId));
    if (targetItem) {
      const maxStock = targetItem.variant?.stock ?? targetItem.product?.stock ?? 999;
      if (nextQty > maxStock) {
        toast(`Only ${maxStock} units available in stock.`, "error");
        return;
      }
    }

    const originalCart = cart;
    latestQtyRef.current[itemId] = nextQty;

    const updatedItems = items.map((i) => {
      if (String(i._id || i.id) === String(itemId)) {
        return { ...i, quantity: nextQty };
      }
      return i;
    });

    // ⚡ 1. Instant Redux Optimistic Update (0ms UI latency)
    dispatch(setCart({ ...cart, items: updatedItems }));

    // ⚡ 2. Debounce HTTP call by 250ms so rapid clicks don't cause network race conditions
    if (updateTimersRef.current[itemId]) {
      clearTimeout(updateTimersRef.current[itemId]);
    }

    updateTimersRef.current[itemId] = setTimeout(async () => {
      try {
        const data = await api.updateCartItemQuantityApi(itemId, nextQty, selectedAttributes);
        // Only update state with server response if no newer click happened
        if (latestQtyRef.current[itemId] === nextQty) {
          dispatch(setCart(data));
        }
      } catch (e) {
        if (latestQtyRef.current[itemId] === nextQty) {
          dispatch(setCart(originalCart));
          toast(errMsg(e), "error");
        }
      } finally {
        delete updateTimersRef.current[itemId];
      }
    }, 250);
  };

  // Remove Item with Optimistic UX & Rollback
  const handleRemoveFromCart = async (itemId) => {
    if (updateTimersRef.current[itemId]) {
      clearTimeout(updateTimersRef.current[itemId]);
      delete updateTimersRef.current[itemId];
    }

    const originalCart = cart;
    const updatedItems = items.filter((i) => String(i._id || i.id) !== String(itemId));

    // ⚡ Optimistic UI update
    dispatch(setCart({ ...cart, items: updatedItems }));
    toast("Item removed from bag.", "info");

    try {
      const data = await api.deleteCartItemApi(itemId);
      dispatch(setCart(data));
    } catch (e) {
      dispatch(setCart(originalCart));
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
