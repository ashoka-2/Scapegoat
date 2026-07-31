import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setLoading,
  setCreating,
  setError,
  setCategories,
  addCreatedCategory,
  updateCategoryInState,
  removeCategoryFromState,
} from "../State/category.slice.js";
import {
  getAllCategoriesApi,
  createCategoryApi,
  updateCategoryApi,
  deleteCategoryApi,
} from "../Services/category.api.js";
import { addToast } from "../../../utils/toast.slice.js";

export const useCategory = () => {
  const dispatch = useDispatch();
  const { categories, loading, creating, error } = useSelector(
    (state) => state.category
  );

  const handleFetchCategories = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const data = await getAllCategoriesApi();
      dispatch(setCategories(data.data || []));
      return data.data || [];
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch categories.";
      dispatch(setError(message));
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const handleCreateCategory = useCallback(
    async (categoryData) => {
      dispatch(setCreating(true));
      dispatch(setError(null));
      try {
        const data = await createCategoryApi(categoryData);
        if (data.data) {
          dispatch(addCreatedCategory(data.data));
        }
        dispatch(
          addToast({
            message: "🎉 Category created successfully!",
            type: "success",
          })
        );
        return { success: true, data: data.data };
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to create category.";
        dispatch(setError(message));
        dispatch(addToast({ message, type: "error" }));
        return { success: false, error: message };
      } finally {
        dispatch(setCreating(false));
      }
    },
    [dispatch]
  );

  const handleUpdateCategory = useCallback(
    async (id, categoryData) => {
      dispatch(setLoading(true));
      try {
        const data = await updateCategoryApi(id, categoryData);
        if (data.data) {
          dispatch(updateCategoryInState(data.data));
        }
        dispatch(
          addToast({
            message: "Category updated successfully!",
            type: "success",
          })
        );
        return { success: true, data: data.data };
      } catch (err) {
        const message = err.response?.data?.message || "Failed to update category.";
        dispatch(setError(message));
        dispatch(addToast({ message, type: "error" }));
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const handleDeleteCategory = useCallback(
    async (id) => {
      dispatch(setLoading(true));
      try {
        const res = await deleteCategoryApi(id);
        dispatch(removeCategoryFromState(id));
        dispatch(
          addToast({
            message: res.message || "Category deleted successfully!",
            type: "success",
          })
        );
        return { success: true };
      } catch (err) {
        const message = err.response?.data?.message || "Failed to delete category.";
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
    categories,
    loading,
    creating,
    error,
    handleFetchCategories,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
  };
};
