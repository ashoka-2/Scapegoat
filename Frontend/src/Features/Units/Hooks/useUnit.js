import { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  setLoading,
  setCreating,
  setError,
  setUnits,
  addCreatedUnit,
  updateUnitInState,
  removeUnitFromState,
} from "../State/unit.slice.js";
import {
  getAllUnitsApi,
  createUnitApi,
  updateUnitApi,
  deleteUnitApi,
} from "../Services/unit.api.js";
import { addToast } from "../../../utils/toast.slice.js";

export const useUnit = () => {
  const dispatch = useDispatch();
  const { units, loading, creating, error } = useSelector(
    (state) => state.unit
  );

  const handleFetchUnits = useCallback(async () => {
    dispatch(setLoading(true));
    try {
      const data = await getAllUnitsApi();
      dispatch(setUnits(data.data || []));
      return data.data || [];
    } catch (err) {
      const message = err.response?.data?.message || "Failed to fetch units.";
      dispatch(setError(message));
      return [];
    } finally {
      dispatch(setLoading(false));
    }
  }, [dispatch]);

  const handleCreateUnit = useCallback(
    async (unitData) => {
      dispatch(setCreating(true));
      dispatch(setError(null));
      try {
        const data = await createUnitApi(unitData);
        if (data.data) {
          dispatch(addCreatedUnit(data.data));
        }
        dispatch(
          addToast({
            message: "🎉 Unit created successfully!",
            type: "success",
          })
        );
        return { success: true, data: data.data };
      } catch (err) {
        const message =
          err.response?.data?.message || "Failed to create unit.";
        dispatch(setError(message));
        dispatch(addToast({ message, type: "error" }));
        return { success: false, error: message };
      } finally {
        dispatch(setCreating(false));
      }
    },
    [dispatch]
  );

  const handleUpdateUnit = useCallback(
    async (id, unitData) => {
      dispatch(setLoading(true));
      try {
        const data = await updateUnitApi(id, unitData);
        if (data.data) {
          dispatch(updateUnitInState(data.data));
        }
        dispatch(
          addToast({
            message: "Unit updated successfully!",
            type: "success",
          })
        );
        return { success: true, data: data.data };
      } catch (err) {
        const message = err.response?.data?.message || "Failed to update unit.";
        dispatch(setError(message));
        dispatch(addToast({ message, type: "error" }));
        return { success: false, error: message };
      } finally {
        dispatch(setLoading(false));
      }
    },
    [dispatch]
  );

  const handleDeleteUnit = useCallback(
    async (id) => {
      dispatch(setLoading(true));
      try {
        const res = await deleteUnitApi(id);
        dispatch(removeUnitFromState(id));
        dispatch(
          addToast({
            message: res.message || "Unit deleted successfully!",
            type: "success",
          })
        );
        return { success: true };
      } catch (err) {
        const message = err.response?.data?.message || "Failed to delete unit.";
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
    units,
    loading,
    creating,
    error,
    handleFetchUnits,
    handleCreateUnit,
    handleUpdateUnit,
    handleDeleteUnit,
  };
};
