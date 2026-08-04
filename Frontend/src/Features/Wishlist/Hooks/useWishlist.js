import { useDispatch, useSelector } from "react-redux";
import { addToast } from "../../../utils/toast.slice";
import { setWishlist, setLoading, setError } from "../State/wishlist.slice";
import * as api from "../Services/wishlist.api";

export const useWishlist = () => {
  const dispatch = useDispatch();
  const { user } = useSelector((state) => state.auth);

  const toast = (message, type = "success") =>
    dispatch(addToast({ message, type }));
  const errMsg = (e) => e?.response?.data?.message || "Operation failed.";

  const getWishlist = async () => {
    if (!user) return;
    dispatch(setLoading(true));
    try {
      const res = await api.fetchUserWishlist();
      const wishlistData = res.data || res.wishlist || res;
      dispatch(setWishlist(wishlistData));
      return wishlistData;
    } catch (e) {
      dispatch(setError(errMsg(e)));
    } finally {
      dispatch(setLoading(false));
    }
  };

  const toggleWishlist = async (productId) => {
    if (!user) {
      toast("Please login to wishlist products.", "info");
      return;
    }

    let originalProducts = [];
    let currentWishlist = null;

    dispatch((_, getState) => {
      currentWishlist = getState().wishlist.wishlist;
      originalProducts = currentWishlist
        ? [...(currentWishlist.products || [])]
        : [];
    });

    const isCurrentlyListed = originalProducts.some((p) => {
      const id = typeof p === "object" ? p?._id || p?.id : p;
      return String(id) === String(productId);
    });

    let nextProducts;
    if (isCurrentlyListed) {
      nextProducts = originalProducts.filter((p) => {
        const id = typeof p === "object" ? p?._id || p?.id : p;
        return String(id) !== String(productId);
      });
      toast("Removed from wishlist.");
    } else {
      nextProducts = [...originalProducts, { _id: productId }];
      toast("Added to wishlist! ❤️");
    }

    const updatedWishlist = { ...(currentWishlist || {}), products: nextProducts };
    dispatch(setWishlist(updatedWishlist));

    try {
      const res = await api.toggleItemInWishlist(productId);
      const wishlistData = res?.data || res?.wishlist;
      if (wishlistData && Array.isArray(wishlistData.products)) {
        dispatch(setWishlist(wishlistData));
      }
      return res;
    } catch (e) {
      dispatch(setWishlist({ ...(currentWishlist || {}), products: originalProducts }));
      toast(errMsg(e), "error");
      throw e;
    }
  };

  return { getWishlist, toggleWishlist };
};
