import React, { useEffect, useState } from "react";
import { useCategory } from "../../Categories/Hooks/useCategory";
import AdminCategoriesSkeleton from "../Components/Skeletons/AdminCategoriesSkeleton";

const AdminCategoriesPage = () => {
  const {
    categories,
    loading,
    handleFetchCategories,
    handleCreateCategory,
    handleUpdateCategory,
    handleDeleteCategory,
  } = useCategory();

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [parentCategory, setParentCategory] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    handleFetchCategories();
  }, [handleFetchCategories]);

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setImage("");
    setParentCategory("");
    setIsActive(true);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingId(cat._id);
    setName(cat.name);
    setDescription(cat.description || "");
    setImage(cat.image || "");
    setParentCategory(cat.parentCategory?._id || cat.parentCategory || "");
    setIsActive(cat.isActive);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Category name is required.");
      return;
    }

    setSaving(true);
    let result;
    const categoryData = {
      name: name.trim(),
      description,
      image,
      parentCategory: parentCategory || null,
      isActive,
    };

    if (editingId) {
      result = await handleUpdateCategory(editingId, categoryData);
    } else {
      result = await handleCreateCategory(categoryData);
    }

    setSaving(false);
    if (result?.success) {
      setIsModalOpen(false);
    } else if (result?.error) {
      setFormError(result.error);
    }
  };

  const onDeleteClick = async (id, catName) => {
    if (!window.confirm(`Are you sure you want to delete category "${catName}"?`)) return;
    await handleDeleteCategory(id);
  };

  // Potential Parent Categories (ONLY main categories, excluding self if editing)
  const availableParents = categories.filter(
    (c) => (!c.parentCategory || !c.parentCategory._id) && (!editingId || c._id !== editingId)
  );

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
            Catalog Management
          </span>
          <h1 className="text-2xl font-black text-foreground">Categories & Subcategories</h1>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center gap-2"
        >
          <i className="ri-add-line text-sm" /> Add Category / Subcategory
        </button>
      </div>

      {/* Categories Content */}
      {loading && categories.length === 0 ? (
        <AdminCategoriesSkeleton />
      ) : (
        <div className="bg-surface border border-border-theme rounded-3xl p-6 shadow-sm overflow-hidden">
          {categories.length === 0 ? (
            <div className="py-12 text-center text-xs text-foreground/40 italic">
              No categories created yet. Click "Add Category / Subcategory" to get started.
            </div>
          ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-theme text-[10px] font-extrabold uppercase text-foreground/50 tracking-wider">
                  <th className="pb-3 px-3">Image</th>
                  <th className="pb-3 px-3">Category Name</th>
                  <th className="pb-3 px-3">Hierarchy / Parent</th>
                  <th className="pb-3 px-3">Slug</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 font-medium">
                {categories.map((c) => {
                  const parentName = c.parentCategory?.name;
                  return (
                    <tr key={c._id} className="hover:bg-background/40 transition">
                      <td className="py-3 px-3">
                        <div className="w-10 h-10 rounded-xl overflow-hidden bg-background border border-border-theme flex items-center justify-center">
                          {c.image ? (
                            <img src={c.image} alt={c.name} className="w-full h-full object-cover" />
                          ) : (
                            <i className="ri-folder-line text-foreground/30 text-lg" />
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 font-bold text-foreground">
                        {c.name}
                      </td>

                      <td className="py-3 px-3">
                        {parentName ? (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full">
                            <i className="ri-node-tree" /> Subcategory of {parentName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2.5 py-0.5 rounded-full">
                            Main Category
                          </span>
                        )}
                      </td>

                      <td className="py-3 px-3 font-mono text-foreground/60">{c.slug || "—"}</td>

                      <td className="py-3 px-3">
                        <div className="flex items-center gap-1.5">
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                              c.isActive !== false
                                ? "bg-emerald-500/10 text-emerald-500"
                                : "bg-red-500/10 text-red-500"
                            }`}
                          >
                            {c.isActive !== false ? "Active" : "Inactive"}
                          </span>
                          {c.isLocked && (
                            <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center gap-1">
                              <i className="ri-lock-line" /> Locked
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-right space-x-2">
                        <button
                          onClick={() => handleUpdateCategory(c._id, { isLocked: !c.isLocked })}
                          className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                            c.isLocked
                              ? "bg-purple-500/10 text-purple-500 border-purple-500/30 hover:bg-purple-500 hover:text-white"
                              : "bg-surface border-border-theme text-foreground/50 hover:text-foreground"
                          }`}
                          title={c.isLocked ? "Unlock Category" : "Lock Category (Prevents Edit/Delete)"}
                        >
                          <i className={c.isLocked ? "ri-lock-line" : "ri-lock-unlock-line"} />
                        </button>
                        <button
                          onClick={() => openEditModal(c)}
                          className="p-1.5 rounded-lg bg-surface border border-border-theme hover:border-accent text-foreground text-xs transition cursor-pointer"
                          title="Edit Category"
                        >
                          <i className="ri-pencil-line" />
                        </button>
                        <button
                          onClick={() => onDeleteClick(c._id, c.name)}
                          className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer"
                          title="Delete Category"
                        >
                          <i className="ri-delete-bin-line" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}

      {/* Screen-Centered Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <h2 className="text-lg font-black text-foreground">
                {editingId ? "Edit Category" : "Create Category / Subcategory"}
              </h2>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-foreground/40 hover:text-foreground text-xl cursor-pointer"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-semibold">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 text-xs">
                  {formError}
                </div>
              )}

              <div className="space-y-1.5">
                <label className="text-foreground/70 text-[10px] font-extrabold uppercase">
                  Category Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Shirts, Men, Sneakers"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              {/* Parent Category Selection for Subcategories */}
              <div className="space-y-1.5">
                <label className="text-foreground/70 text-[10px] font-extrabold uppercase">
                  Parent Category (Optional - For Subcategories)
                </label>
                <select
                  value={parentCategory}
                  onChange={(e) => setParentCategory(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent cursor-pointer"
                >
                  <option value="">None (Top-Level Main Category)</option>
                  {availableParents.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground/70 text-[10px] font-extrabold uppercase">
                  Image URL
                </label>
                <input
                  type="text"
                  placeholder="https://..."
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground/70 text-[10px] font-extrabold uppercase">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief description of the category"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {editingId && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="catIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded accent-accent"
                  />
                  <label htmlFor="catIsActive" className="text-xs text-foreground cursor-pointer">
                    Is Active
                  </label>
                </div>
              )}

              <div className="pt-4 flex justify-end gap-3 border-t border-border-theme">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-background text-foreground/70 font-bold hover:bg-surface transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 rounded-xl bg-accent text-accent-content font-bold hover:opacity-90 transition cursor-pointer disabled:opacity-50"
                >
                  {saving ? "Saving..." : editingId ? "Update Category" : "Save Category"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminCategoriesPage;
