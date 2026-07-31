import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setLoading,
  setCreating,
  setError,
  setBrands,
  addCreatedBrand,
  updateBrandInState,
  removeBrandFromState,
} from "../State/brand.slice.js";
import {
  getAllBrandsApi,
  createBrandApi,
  updateBrandApi,
  deleteBrandApi,
} from "../Services/brand.api.js";
import { addToast } from "../../../utils/toast.slice.js";

export const useBrand = () => {
  const dispatch = useDispatch();
  const { brands, loading, creating, error } = useSelector(
    (state) => state.brand
  );

  const handleFetchBrands = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const data = await getAllBrandsApi();
      dispatch(setBrands(data.data || []));
      return data.data || [];
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch brands.";
      dispatch(setError(message));
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const handleCreateBrand = useCallback(
    async (brandData) => {
      dispatch(setCreating(true));
      dispatch(setError(null));
      try {
        const data = await createBrandApi(brandData);
        if (data.data) {
          dispatch(addCreatedBrand(data.data));
        }
        dispatch(
          addToast({
            message: "🎉 Brand created successfully!",
            type: "success",
          })
        );
        return { success: true, data: data.data };
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to create brand.";
        dispatch(setError(message));
        dispatch(addToast({ message, type: "error" }));
        return { success: false, error: message };
      } finally {
        dispatch(setCreating(false));
      }
    },
    [dispatch]
  );

  const handleUpdateBrand = useCallback(
    async (id, brandData) => {
      dispatch(setLoading(true));
      try {
        const data = await updateBrandApi(id, brandData);
        if (data.data) {
          dispatch(updateBrandInState(data.data));
        }
        dispatch(
          addToast({
            message: "Brand updated successfully!",
            type: "success",
          })
        );
        return { success: true, data: data.data };
      } catch (err) {
        const message = err.response?.data?.message || "Failed to update brand.";
        dispatch(setError(message));
        dispatch(addToast({ message, type: "error" }));
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const handleDeleteBrand = useCallback(
    async (id) => {
      dispatch(setLoading(true));
      try {
        const res = await deleteBrandApi(id);
        dispatch(removeBrandFromState(id));
        dispatch(
          addToast({
            message: res.message || "Brand deleted successfully!",
            type: "success",
          })
        );
        return { success: true };
      } catch (err) {
        const message = err.response?.data?.message || "Failed to delete brand.";
        dispatch(setError(message));
        dispatch(addToast({ message, type: "error" }));
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  return {
    brands,
    loading,
    creating,
    error,
    handleFetchBrands,
    handleCreateBrand,
    handleUpdateBrand,
    handleDeleteBrand,
  };
};
