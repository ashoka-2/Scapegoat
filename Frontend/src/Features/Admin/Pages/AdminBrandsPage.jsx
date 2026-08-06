import React, { useEffect, useState } from "react";
import { useBrand } from "../../Brands/Hooks/useBrand";

const AdminBrandsPage = () => {
  const {
    brands,
    loading,
    handleFetchBrands,
    handleCreateBrand,
    handleUpdateBrand,
    handleDeleteBrand,
  } = useBrand();

  // Form State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [image, setImage] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [formError, setFormError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    handleFetchBrands();
  }, [handleFetchBrands]);

  const openCreateModal = () => {
    setEditingId(null);
    setName("");
    setDescription("");
    setImage("");
    setIsActive(true);
    setFormError("");
    setIsModalOpen(true);
  };

  const openEditModal = (b) => {
    setEditingId(b._id);
    setName(b.name);
    setDescription(b.description || "");
    setImage(b.image || "");
    setIsActive(b.isActive);
    setFormError("");
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");

    if (!name.trim()) {
      setFormError("Brand name is required.");
      return;
    }

    setSaving(true);
    let result;
    const brandData = {
      name: name.trim(),
      description,
      image,
      isActive,
    };

    if (editingId) {
      result = await handleUpdateBrand(editingId, brandData);
    } else {
      result = await handleCreateBrand(brandData);
    }

    setSaving(false);
    if (result?.success) {
      setIsModalOpen(false);
    } else if (result?.error) {
      setFormError(result.error);
    }
  };

  const onDeleteClick = async (id, brandName) => {
    if (!window.confirm(`Are you sure you want to delete brand "${brandName}"?`)) return;
    await handleDeleteBrand(id);
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
            Brand Management
          </span>
          <h1 className="text-2xl font-black text-foreground">Brands & Manufacturers</h1>
        </div>

        <button
          onClick={openCreateModal}
          className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center gap-2"
        >
          <i className="ri-add-line text-sm" /> Add New Brand
        </button>
      </div>

      {/* Brands Table */}
      <div className="bg-surface border border-border-theme rounded-3xl p-6 shadow-sm overflow-hidden">
        {loading && brands.length === 0 ? (
          <div className="py-12 text-center text-xs text-foreground/40 font-mono animate-pulse">
            Loading brands...
          </div>
        ) : brands.length === 0 ? (
          <div className="py-12 text-center text-xs text-foreground/40 italic">
            No brands created yet. Click "Add New Brand" to get started.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-border-theme text-[10px] font-extrabold uppercase text-foreground/50 tracking-wider">
                  <th className="pb-3 px-3">Logo</th>
                  <th className="pb-3 px-3">Brand Name</th>
                  <th className="pb-3 px-3">Slug</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 font-medium">
                {brands.map((b) => (
                  <tr key={b._id} className="hover:bg-background/40 transition">
                    <td className="py-3 px-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-background border border-border-theme flex items-center justify-center">
                        {b.image ? (
                          <img src={b.image} alt={b.name} className="w-full h-full object-cover" />
                        ) : (
                          <i className="ri-[#1] ri-store-line text-foreground/30 text-lg" />
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold text-foreground">{b.name}</td>
                    <td className="py-3 px-3 font-mono text-foreground/60">{b.slug || "—"}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-1.5">
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                            b.isActive !== false
                              ? "bg-emerald-500/10 text-emerald-500"
                              : "bg-red-500/10 text-red-500"
                          }`}
                        >
                          {b.isActive !== false ? "Active" : "Inactive"}
                        </span>
                        {b.isLocked && (
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center gap-1">
                            <i className="ri-lock-line" /> Locked
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-3 text-right space-x-2">
                      <button
                        onClick={() => handleUpdateBrand(b._id, { isLocked: !b.isLocked })}
                        className={`p-1.5 rounded-lg border text-xs transition cursor-pointer ${
                          b.isLocked
                            ? "bg-purple-500/10 text-purple-500 border-purple-500/30 hover:bg-purple-500 hover:text-white"
                            : "bg-surface border-border-theme text-foreground/50 hover:text-foreground"
                        }`}
                        title={b.isLocked ? "Unlock Brand" : "Lock Brand (Prevents Edit/Delete)"}
                      >
                        <i className={b.isLocked ? "ri-lock-line" : "ri-lock-unlock-line"} />
                      </button>
                      <button
                        onClick={() => openEditModal(b)}
                        className="p-1.5 rounded-lg bg-surface border border-border-theme hover:border-accent text-foreground text-xs transition cursor-pointer"
                        title="Edit Brand"
                      >
                        <i className="ri-pencil-line" />
                      </button>
                      <button
                        onClick={() => onDeleteClick(b._id, b.name)}
                        className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white transition cursor-pointer"
                        title="Delete Brand"
                      >
                        <i className="ri-delete-bin-line" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Screen-Centered Modal Form */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <h2 className="text-lg font-black text-foreground">
                {editingId ? "Edit Brand" : "Create New Brand"}
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
                  Brand Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Nike, Adidas, Zara"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-foreground/70 text-[10px] font-extrabold uppercase">
                  Logo URL
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
                  placeholder="Brief description of the brand"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-background border border-border-theme rounded-xl px-4 py-2.5 text-foreground focus:outline-none focus:border-accent resize-none"
                />
              </div>

              {editingId && (
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="brandIsActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded accent-accent"
                  />
                  <label htmlFor="brandIsActive" className="text-xs text-foreground cursor-pointer">
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
                  {saving ? "Saving..." : editingId ? "Update Brand" : "Create Brand"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminBrandsPage;
