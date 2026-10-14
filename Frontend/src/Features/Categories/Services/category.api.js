import { createApiInstance } from "../../../utils/axios";

const categoryApiInstance = createApiInstance("/api/categories");

/**
 * Fetch all categories
 */
export async function getAllCategoriesApi(all = true) {
  const response = await categoryApiInstance.get("", { params: { all } });
  return response.data;
}

export async function getCategoriesPageApi({ page = 1, limit = 12, roots = false, parentCategory } = {}) {
  const response = await categoryApiInstance.get("", { params: { all: false, page, limit, ...(roots ? { roots: true } : {}), ...(parentCategory ? { parentCategory } : {}) } });
  return response.data;
}

export async function getCategoryByIdApi(id) {
  const response = await categoryApiInstance.get(`/${id}`);
  return response.data;
}

/**
 * Create a new category or subcategory
 */
export async function createCategoryApi(categoryData) {
  const response = await categoryApiInstance.post("", categoryData);
  return response.data;
}

/**
 * Update an existing category
 */
export async function updateCategoryApi(id, categoryData) {
  const response = await categoryApiInstance.put(`/${id}`, categoryData);
  return response.data;
}

/**
 * Delete a category (blocked if used by active products)
 */
export async function deleteCategoryApi(id) {
  const response = await categoryApiInstance.delete(`/${id}`);
  return response.data;
}
