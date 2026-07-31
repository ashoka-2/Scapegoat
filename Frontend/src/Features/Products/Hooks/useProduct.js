import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setLoading,
  setCreating,
  setError,
  setProducts,
  setSellerProducts,
  setCurrentProduct,
  addCreatedProduct,
} from "../State/product.slice.js";
import {
  createProductApi,
  getAllProductsApi,
  getSingleProductApi,
  getSellerProductsApi,
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

  const handleFetchAllProducts = useCallback(
    async (params) => {
      dispatch(setLoading(true));
      try {
        const data = await getAllProductsApi(params);
        dispatch(setProducts(data));
      } catch (err) {
        const message = err.response?.data?.message || "Failed to fetch products.";
        dispatch(setError(message));
      } finally {
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
  };
};
