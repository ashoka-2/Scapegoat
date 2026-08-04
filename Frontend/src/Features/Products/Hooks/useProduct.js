import { useCallback, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setLoading,
  setCreating,
  setError,
  setProducts,
  setSellerProducts,
  setCurrentProduct,
  addCreatedProduct,
  removeProduct,
} from "../State/product.slice.js";
import {
  createProductApi,
  getAllProductsApi,
  getSingleProductApi,
  getSellerProductsApi,
  deleteProductApi,
  updateProductApi,
  restoreProductApi,
} from "../Services/product.api.js";
import { addToast } from "../../../utils/toast.slice.js";

export const useProduct = () => {
  const dispatch = useDispatch();
  const {
    products,
    sellerProducts,
    currentProduct,
    total,
    page,
    pages,
    loading,
    creating,
    error,
  } = useSelector((state) => state.product);

  const handleCreateProduct = useCallback(
    async (formData) => {
      dispatch(setCreating(true));
      dispatch(setError(null));
      try {
        const data = await createProductApi(formData);
        if (data.data) {
          dispatch(addCreatedProduct(data.data));
        }
        dispatch(
          addToast({
            message: "🎉 Product created and published successfully!",
            type: "success",
          })
        );
        return { success: true, data: data.data };
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to create product. Please try again.";
        dispatch(setError(message));
        dispatch(addToast({ message, type: "error" }));
        return { success: false, error: message };
      } finally {
        dispatch(setCreating(false));
      }
    },
    [dispatch]
  );

  const isFetchingRef = useRef(false);

  const handleFetchAllProducts = useCallback(
    async (params) => {
      if (isFetchingRef.current) return;
      isFetchingRef.current = true;
      dispatch(setLoading(true));
      try {
        const data = await getAllProductsApi(params);
        dispatch(setProducts(data));
      } catch (err) {
        const message = err.response?.data?.message || "Failed to fetch products.";
        dispatch(setError(message));
      } finally {
        isFetchingRef.current = false;
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const handleFetchSingleProduct = useCallback(
    async (identifier) => {
      dispatch(setLoading(true));
      try {
        const data = await getSingleProductApi(identifier);
        dispatch(setCurrentProduct(data.data));
        return data.data;
      } catch (err) {
        const message = err.response?.data?.message || "Failed to fetch product details.";
        dispatch(setError(message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const handleFetchSellerProducts = useCallback(
    async (sellerId, params) => {
      dispatch(setLoading(true));
      try {
        const data = await getSellerProductsApi(sellerId, params);
        dispatch(setSellerProducts(data.data || []));
      } catch (err) {
        const message = err.response?.data?.message || "Failed to fetch seller products.";
        dispatch(setError(message));
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const handleDeleteProduct = useCallback(
    async (productId) => {
      dispatch(setLoading(true));
      try {
        await deleteProductApi(productId);
        dispatch(removeProduct(productId));
        dispatch(addToast({ message: "Product deleted successfully", type: "success" }));
        return { success: true };
      } catch (err) {
        const message = err.response?.data?.message || "Failed to delete product.";
        dispatch(addToast({ message, type: "error" }));
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const handleUpdateProduct = useCallback(
    async (id, formData) => {
      dispatch(setCreating(true));
      dispatch(setError(null));
      try {
        const data = await updateProductApi(id, formData);
        dispatch(
          addToast({
            message: "🎉 Product updated successfully!",
            type: "success",
          })
        );
        return { success: true, data: data.data };
      } catch (err) {
        const message =
          err.response?.data?.message ||
          err.message ||
          "Failed to update product. Please try again.";
        dispatch(setError(message));
        dispatch(addToast({ message, type: "error" }));
        return { success: false, error: message };
      } finally {
        dispatch(setCreating(false));
      }
    },
    [dispatch]
  );

  const handleRestoreProduct = useCallback(
    async (productId) => {
      dispatch(setLoading(true));
      try {
        await restoreProductApi(productId);
        dispatch(addToast({ message: "🎉 Product restored from trash successfully!", type: "success" }));
        return { success: true };
      } catch (err) {
        const message = err.response?.data?.message || "Failed to restore product.";
        dispatch(addToast({ message, type: "error" }));
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  return {
    products,
    sellerProducts,
    currentProduct,
    total,
    page,
    pages,
    loading,
    creating,
    error,
    handleCreateProduct,
    handleFetchAllProducts,
    handleFetchSingleProduct,
    handleFetchSellerProducts,
    handleDeleteProduct,
    handleUpdateProduct,
    handleRestoreProduct,
  };
};
