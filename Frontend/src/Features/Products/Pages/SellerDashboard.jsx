import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useProduct } from "../Hooks/useProduct";
import { useCategory } from "../../Categories/Hooks/useCategory";
import { useBrand } from "../../Brands/Hooks/useBrand";
import { useUnit } from "../../Units/Hooks/useUnit";
import Modal from "../../../Components/Modal";

const SellerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { sellerProducts, loading: loadingProducts, handleFetchSellerProducts } = useProduct();
  const { categories, handleFetchCategories, handleCreateCategory, handleUpdateCategory, handleDeleteCategory } = useCategory();
  const { brands, handleFetchBrands, handleCreateBrand, handleUpdateBrand, handleDeleteBrand } = useBrand();
  const { units, handleFetchUnits, handleCreateUnit, handleUpdateUnit, handleDeleteUnit } = useUnit();

  // Dashboard Active Management Section Tab
  const [mgmtTab, setMgmtTab] = useState("categories");

  // Confirmation Modal State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    onConfirm: null,
  });

  const openConfirmModal = ({ title, description, confirmText = "Confirm", onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      description,
      confirmText,
      onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  // Category Form State
  const [catName, setCatName] = useState("");
  const [parentCatId, setParentCatId] = useState("");
  const [editingCatId, setEditingCatId] = useState(null);

  // Brand Form State
  const [brandName, setBrandName] = useState("");
  const [editingBrandId, setEditingBrandId] = useState(null);

  // Unit Form State
  const [unitName, setUnitName] = useState("");
  const [unitAbbr, setUnitAbbr] = useState("");
  const [editingUnitId, setEditingUnitId] = useState(null);

  useEffect(() => {
    if (user?._id || user?.id) {
      handleFetchSellerProducts(user._id || user.id);
    }
    handleFetchCategories();
    handleFetchBrands();
    handleFetchUnits();
  }, [user, handleFetchSellerProducts, handleFetchCategories, handleFetchBrands, handleFetchUnits]);

  const totalProducts = sellerProducts.length;
  const publishedProducts = sellerProducts.filter((p) => p.status === "published").length;
  const draftProducts = sellerProducts.filter((p) => p.status === "draft").length;

  const parentCategories = categories.filter((c) => !c.parentCategory);

  // Category Form Submit
  const handleCategorySubmit = async (e) => {
    e.preventDefault();
    if (!catName.trim()) return;

    if (editingCatId) {
      const res = await handleUpdateCategory(editingCatId, { name: catName.trim() });
      if (res.success) {
        setEditingCatId(null);
        setCatName("");
      }
    } else {
      const payload = {
        name: catName.trim(),
        parentCategory: parentCatId || null,
      };
      const res = await handleCreateCategory(payload);
      if (res.success) {
        setCatName("");
        setParentCatId("");
      }
    }
  };

  // Brand Form Submit
  const handleBrandSubmit = async (e) => {
    e.preventDefault();
    if (!brandName.trim()) return;

    if (editingBrandId) {
      const res = await handleUpdateBrand(editingBrandId, { name: brandName.trim() });
      if (res.success) {
        setEditingBrandId(null);
        setBrandName("");
      }
    } else {
      const res = await handleCreateBrand({ name: brandName.trim() });
      if (res.success) {
        setBrandName("");
      }
    }
  };

  // Unit Form Submit
  const handleUnitSubmit = async (e) => {
    e.preventDefault();
    if (!unitName.trim() || !unitAbbr.trim()) return;

    if (editingUnitId) {
      const res = await handleUpdateUnit(editingUnitId, {
        name: unitName.trim(),
        abbreviation: unitAbbr.trim(),
      });
      if (res.success) {
        setEditingUnitId(null);
        setUnitName("");
        setUnitAbbr("");
      }
    } else {
      const res = await handleCreateUnit({
        name: unitName.trim(),
        abbreviation: unitAbbr.trim(),
      });
      if (res.success) {
        setUnitName("");
        setUnitAbbr("");
      }
    }
  };

  const inputStyle = "w-full px-4 py-2.5 rounded-xl border border-border-theme bg-background text-foreground text-xs font-semibold focus:outline-none focus:border-accent transition";
  const selectStyle = "w-full px-4 py-2.5 rounded-xl border border-border-theme bg-background text-foreground text-xs font-semibold focus:outline-none focus:border-accent transition cursor-pointer";

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Seller Dashboard</h1>
          <p className="text-xs text-foreground/60 mt-1">
            Welcome back, <strong className="text-accent">{user?.fullname || user?.username}</strong>! Manage your products, categories, brands, and catalog performance.
          </p>
        </div>
        <Link
          to="/products/create"
          className="px-5 py-3 rounded-xl bg-accent text-accent-content font-bold text-xs shadow-md hover:opacity-90 transition cursor-pointer"
        >
          🚀 Create New Product
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        <div className="bg-background border border-border-theme p-6 rounded-2xl space-y-1 shadow-sm">
          <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Total Products</span>
          <p className="text-3xl font-extrabold text-accent">{totalProducts}</p>
        </div>

        <div className="bg-background border border-border-theme p-6 rounded-2xl space-y-1 shadow-sm">
          <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Published Listings</span>
          <p className="text-3xl font-extrabold text-emerald-400">{publishedProducts}</p>
        </div>

        <div className="bg-background border border-border-theme p-6 rounded-2xl space-y-1 shadow-sm">
          <span className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Drafts</span>
          <p className="text-3xl font-extrabold text-amber-400">{draftProducts}</p>
        </div>
      </div>

      {/* Seller Products Table / List */}
      <div className="bg-background border border-border-theme rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Your Products Catalog</h2>
          <span className="text-xs text-foreground/60">{sellerProducts.length} items listed</span>
        </div>

        {loadingProducts ? (
          <div className="py-12 text-center text-xs text-foreground/60 font-semibold animate-pulse">
            Loading products catalog...
          </div>
        ) : sellerProducts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground/60">No products created yet.</p>
            <Link
              to="/products/create"
              className="inline-block px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 text-xs font-bold"
            >
              + Create your first product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {sellerProducts.map((p) => (
              <div
                key={p._id}
                className="bg-surface border border-border-theme p-4 rounded-xl space-y-3 flex flex-col justify-between"
              >
                <div className="flex space-x-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-background shrink-0 border border-border-theme">
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0].url} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-foreground/40 font-bold">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      {p.status}
                    </span>
                    <h3 className="font-bold text-xs text-foreground truncate mt-1">{p.title}</h3>
                    <p className="text-xs font-bold text-accent mt-0.5">
                      ₹{p.sellingPrice?.amount || p.maxPrice?.amount || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ════════════════════════════════════════════════════════════════════ */}
      {/* ⚙️ CATALOG METADATA MANAGER (Categories, Brands & Units) Section   */}
      {/* ════════════════════════════════════════════════════════════════════ */}
      <div className="bg-background border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
          <div>
            <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
              <span>⚙️</span> Catalog Metadata Manager
            </h2>
            <p className="text-xs text-foreground/60 mt-0.5">
              Create, update, or delete Categories, Subcategories, Brands, and Units of Measurement.
            </p>
          </div>

          {/* Sub-tabs */}
          <div className="flex items-center space-x-2 bg-surface border border-border-theme p-1 rounded-xl">
            {[
              { id: "categories", label: `Categories (${categories.length})` },
              { id: "brands", label: `Brands (${brands.length})` },
              { id: "units", label: `Units (${units.length})` },
            ].map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setMgmtTab(tab.id)}
                className={`px-4 py-2 rounded-lg font-bold text-xs transition cursor-pointer ${
                  mgmtTab === tab.id
                    ? "bg-accent text-accent-content shadow"
                    : "text-foreground/70 hover:text-foreground hover:bg-background"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── TAB 1: CATEGORIES & SUBCATEGORIES MANAGEMENT ── */}
        {mgmtTab === "categories" && (
          <div className="space-y-6">
            <form onSubmit={handleCategorySubmit} className="bg-surface border border-border-theme p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent">
                {editingCatId ? "✏️ Edit Category" : "+ Add New Category / Subcategory"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Category Name (e.g. Footwear)"
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  className={inputStyle}
                  required
                />
                {!editingCatId && (
                  <select
                    value={parentCatId}
                    onChange={(e) => setParentCatId(e.target.value)}
                    className={selectStyle}
                  >
                    <option value="">None (Top-Level Category)</option>
                    {parentCategories.map((pCat) => (
                      <option key={pCat._id} value={pCat._id}>
                        Parent: {pCat.name}
                      </option>
                    ))}
                  </select>
                )}
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs shadow hover:opacity-90 transition cursor-pointer"
                  >
                    {editingCatId ? "Update Category" : "Save Category"}
                  </button>
                  {editingCatId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCatId(null);
                        setCatName("");
                      }}
                      className="px-3 py-2.5 rounded-xl bg-background border border-border-theme text-foreground text-xs font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                Existing Categories List
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {categories.map((cat) => (
                  <div
                    key={cat._id}
                    className="flex items-center justify-between bg-surface border border-border-theme/70 p-3.5 rounded-xl text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-foreground truncate">{cat.name}</p>
                      <p className="text-[10px] text-foreground/50">
                        {cat.parentCategory ? "Subcategory" : "Main Category"}
                      </p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingCatId(cat._id);
                          setCatName(cat.name);
                        }}
                        className="px-2 py-1 rounded bg-accent/10 text-accent font-bold text-[11px] hover:bg-accent hover:text-accent-content transition cursor-pointer"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openConfirmModal({
                            title: "Delete Category",
                            description: `Are you sure you want to delete category "${cat.name}"?`,
                            confirmText: "Delete Category",
                            onConfirm: () => handleDeleteCategory(cat._id),
                          });
                        }}
                        className="px-2 py-1 rounded bg-red-500/10 text-red-500 font-bold text-[11px] hover:bg-red-500 hover:text-white transition cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 2: BRANDS MANAGEMENT ── */}
        {mgmtTab === "brands" && (
          <div className="space-y-6">
            <form onSubmit={handleBrandSubmit} className="bg-surface border border-border-theme p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent">
                {editingBrandId ? "✏️ Edit Brand" : "+ Add New Brand"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input
                  type="text"
                  placeholder="Brand Name (e.g. Nike, Adidas, Apple)"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  className={inputStyle}
                  required
                />
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs shadow hover:opacity-90 transition cursor-pointer"
                  >
                    {editingBrandId ? "Update Brand" : "Save Brand"}
                  </button>
                  {editingBrandId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBrandId(null);
                        setBrandName("");
                      }}
                      className="px-3 py-2.5 rounded-xl bg-background border border-border-theme text-foreground text-xs font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                Existing Brands List
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {brands.map((b) => (
                  <div
                    key={b._id}
                    className="flex items-center justify-between bg-surface border border-border-theme/70 p-3.5 rounded-xl text-xs"
                  >
                    <p className="font-bold text-foreground truncate pr-2">{b.name}</p>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBrandId(b._id);
                          setBrandName(b.name);
                        }}
                        className="px-2 py-1 rounded bg-accent/10 text-accent font-bold text-[11px] hover:bg-accent hover:text-accent-content transition cursor-pointer"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openConfirmModal({
                            title: "Delete Brand",
                            description: `Are you sure you want to delete brand "${b.name}"?`,
                            confirmText: "Delete Brand",
                            onConfirm: () => handleDeleteBrand(b._id),
                          });
                        }}
                        className="px-2 py-1 rounded bg-red-500/10 text-red-500 font-bold text-[11px] hover:bg-red-500 hover:text-white transition cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── TAB 3: UNITS MANAGEMENT ── */}
        {mgmtTab === "units" && (
          <div className="space-y-6">
            <form onSubmit={handleUnitSubmit} className="bg-surface border border-border-theme p-5 rounded-xl space-y-4">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-accent">
                {editingUnitId ? "✏️ Edit Unit" : "+ Add New Unit of Measurement"}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <input
                  type="text"
                  placeholder="Unit Name (e.g. Pieces)"
                  value={unitName}
                  onChange={(e) => setUnitName(e.target.value)}
                  className={inputStyle}
                  required
                />
                <input
                  type="text"
                  placeholder="Abbreviation (e.g. pcs)"
                  value={unitAbbr}
                  onChange={(e) => setUnitAbbr(e.target.value)}
                  className={inputStyle}
                  required
                />
                <div className="flex items-center space-x-2">
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs shadow hover:opacity-90 transition cursor-pointer"
                  >
                    {editingUnitId ? "Update Unit" : "Save Unit"}
                  </button>
                  {editingUnitId && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingUnitId(null);
                        setUnitName("");
                        setUnitAbbr("");
                      }}
                      className="px-3 py-2.5 rounded-xl bg-background border border-border-theme text-foreground text-xs font-bold"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </form>

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-foreground/70 uppercase tracking-wider">
                Existing Units List
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {units.map((u) => (
                  <div
                    key={u._id}
                    className="flex items-center justify-between bg-surface border border-border-theme/70 p-3.5 rounded-xl text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-foreground truncate">{u.name}</p>
                      <p className="text-[10px] text-foreground/50">Symbol: {u.abbreviation}</p>
                    </div>
                    <div className="flex items-center space-x-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setEditingUnitId(u._id);
                          setUnitName(u.name);
                          setUnitAbbr(u.abbreviation || "");
                        }}
                        className="px-2 py-1 rounded bg-accent/10 text-accent font-bold text-[11px] hover:bg-accent hover:text-accent-content transition cursor-pointer"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          openConfirmModal({
                            title: "Delete Unit",
                            description: `Are you sure you want to delete unit "${u.name}"?`,
                            confirmText: "Delete Unit",
                            onConfirm: () => handleDeleteUnit(u._id),
                          });
                        }}
                        className="px-2 py-1 rounded bg-red-500/10 text-red-500 font-bold text-[11px] hover:bg-red-500 hover:text-white transition cursor-pointer"
                      >
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Reusable Confirmation Modal */}
      {confirmModal.isOpen && (
        <Modal
          isOpen={confirmModal.isOpen}
          onClose={closeConfirmModal}
          onSubmit={() => {
            if (confirmModal.onConfirm) confirmModal.onConfirm();
            closeConfirmModal();
          }}
          title={confirmModal.title}
          confirmText={confirmModal.confirmText}
          cancelText="Cancel"
          showFooterActions={true}
        >
          <p className="text-sm text-foreground/80 font-medium py-1">
            {confirmModal.description}
          </p>
        </Modal>
      )}
    </div>
  );
};

export default SellerDashboard;
