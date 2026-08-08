import { createApiInstance } from "../../../utils/axios";

const unitApiInstance = createApiInstance("/api/units");

/**
 * Fetch all units
 */
export async function getAllUnitsApi(all = true) {
  const response = await unitApiInstance.get("", { params: { all } });
  return response.data;
}

/**
 * Create a new unit
 */
export async function createUnitApi(unitData) {
  const response = await unitApiInstance.post("", unitData);
  return response.data;
}

/**
 * Update an existing unit
 */
export async function updateUnitApi(id, unitData) {
  const response = await unitApiInstance.put(`/${id}`, unitData);
  return response.data;
}

/**
 * Delete a unit (blocked if used by active products)
 */
export async function deleteUnitApi(id) {
  const response = await unitApiInstance.delete(`/${id}`);
  return response.data;
}
