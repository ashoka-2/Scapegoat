import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToast } from "../../../utils/toast.slice";
import Modal from "../../../Components/Modal";
import { useProduct } from "../../Products/Hooks/useProduct";
import SellerTableSkeleton from "../Components/Skeletons/SellerTableSkeleton";

/**
 * SellerCatalog Component (WooCommerce Table Style + Apple/Shopify Polish)
 * Multi-select bulk actions, filters, quick edit, duplicate, trash, restore, and table grid.
 */
const SellerCatalog = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const {
    sellerProducts,
    loading,
    handleFetchSellerProducts,
    handleDeleteProduct,
    handleUpdateProduct,
    handleRestoreProduct,
  } = useProduct();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [bulkAction, setBulkAction] = useState("");
  const [deleteModal, setDeleteModal] = useState({ open: false, productId: null });

  useEffect(() => {
    if (user?._id || user?.id) {
      handleFetchSellerProducts(user._id || user.id);
    }
  }, [user, handleFetchSellerProducts]);

  const handleEditProduct = (prodId) => {
    navigate(`/products/edit/${prodId}`);
  };

  const handleDuplicateProduct = (prod) => {
    navigate(`/products/create?duplicate=${prod._id}`);
  };

  const confirmDelete = (productId) => {
    setDeleteModal({ open: true, productId });
  };

  const runDelete = async () => {
    if (deleteModal.productId) {
      await handleDeleteProduct(deleteModal.productId);
      setDeleteModal({ open: false, productId: null });
      setSelectedProductIds((prev) => prev.filter((id) => id !== deleteModal.productId));
      if (user?._id || user?.id) handleFetchSellerProducts(user._id || user.id);
    }
  };

  const handleRestoreSingle = async (prodId) => {
    await handleRestoreProduct(prodId);
    if (user?._id || user?.id) handleFetchSellerProducts(user._id || user.id);
  };

  // Filtered Products List
  const filteredProducts = sellerProducts.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all"
        ? p.status !== "trash"
        : p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Counts
  const countAll = sellerProducts.filter((p) => p.status !== "trash").length;
  const countPublished = sellerProducts.filter((p) => p.status === "published").length;
  const countDraft = sellerProducts.filter((p) => p.status === "draft").length;
  const countTrash = sellerProducts.filter((p) => p.status === "trash").length;

  // Checkbox Select All Toggle
  const isAllSelected =
    filteredProducts.length > 0 && filteredProducts.every((p) => selectedProductIds.includes(p._id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedProductIds([]);
    } else {
      setSelectedProductIds(filteredProducts.map((p) => p._id));
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedProductIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Bulk Actions Apply Handler
  const handleApplyBulkAction = async () => {
    if (!bulkAction) {
      dispatch(addToast({ message: "Please select a bulk action from the dropdown.", type: "info" }));
      return;
    }
    if (selectedProductIds.length === 0) {
      dispatch(addToast({ message: "Please select at least one product using the checkboxes.", type: "info" }));
      return;
    }

    if (bulkAction === "restore") {
      await Promise.all(selectedProductIds.map((id) => handleRestoreProduct(id)));
      setSelectedProductIds([]);
      if (user?._id || user?.id) handleFetchSellerProducts(user._id || user.id);
    } else if (bulkAction === "trash" || bulkAction === "delete_permanently") {
      await Promise.all(selectedProductIds.map((id) => handleDeleteProduct(id)));
      setSelectedProductIds([]);
      if (user?._id || user?.id) handleFetchSellerProducts(user._id || user.id);
    } else if (bulkAction === "publish") {
      await Promise.all(
        selectedProductIds.map((id) => {
          const payload = new FormData();
          payload.append("status", "published");
          return handleUpdateProduct(id, payload);
        })
      );
      setSelectedProductIds([]);
      if (user?._id || user?.id) handleFetchSellerProducts(user._id || user.id);
    } else if (bulkAction === "draft") {
      await Promise.all(
        selectedProductIds.map((id) => {
          const payload = new FormData();
          payload.append("status", "draft");
          return handleUpdateProduct(id, payload);
        })
      );
      setSelectedProductIds([]);
      if (user?._id || user?.id) handleFetchSellerProducts(user._id || user.id);
    }
  };

  return (
    <div className="w-full space-y-6 selection:bg-accent selection:text-accent-content font-sans">
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, productId: null })}
        onConfirm={runDelete}
        title="Delete Product Listing?"
        description="This action is permanent. This product will be removed from your catalog."
        confirmText="Delete Permanently"
        type="danger"
      />

      {/* WooCommerce-Style Top Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div className="flex items-center space-x-3">
          <h1 className="text-2xl font-black text-foreground tracking-tight">Products</h1>
          <Link
            to="/products/create"
            className="px-4 py-2 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow-md hover:opacity-90 transition cursor-pointer flex items-center gap-1.5"
          >
            <i className="ri-add-line text-sm" />
            <span>Add Product</span>
          </Link>
        </div>

        {/* View Counts Tabs */}
        <div className="flex items-center space-x-3 text-xs font-semibold text-foreground/70">
          <button
            type="button"
            onClick={() => setStatusFilter("all")}
            className={`hover:text-foreground cursor-pointer ${statusFilter === "all" ? "text-accent font-extrabold underline" : ""}`}
          >
            All ({countAll})
          </button>
          <span>|</span>
          <button
            type="button"
            onClick={() => setStatusFilter("published")}
            className={`hover:text-foreground cursor-pointer ${statusFilter === "published" ? "text-accent font-extrabold underline" : ""}`}
          >
            Published ({countPublished})
          </button>
          <span>|</span>
          <button
            type="button"
            onClick={() => setStatusFilter("draft")}
            className={`hover:text-foreground cursor-pointer ${statusFilter === "draft" ? "text-accent font-extrabold underline" : ""}`}
          >
            Draft ({countDraft})
          </button>
          <span>|</span>
          <button
            type="button"
            onClick={() => setStatusFilter("trash")}
            className={`hover:text-foreground cursor-pointer ${statusFilter === "trash" ? "text-accent font-extrabold underline" : ""}`}
          >
            Trash ({countTrash})
          </button>
        </div>
      </div>

      {/* Trash View Notice Banner */}
      {statusFilter === "trash" && (
        <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-red-500 font-bold">
          <div className="flex items-center gap-2">
            <i className="ri-delete-bin-line text-lg shrink-0" />
            <span>Products in Trash are hidden from your store. You can restore them anytime or delete them permanently.</span>
          </div>
          {countTrash > 0 && (
            <button
              type="button"
              onClick={() => {
                setSelectedProductIds(filteredProducts.map((p) => p._id));
                setBulkAction("restore");
              }}
              className="px-3 py-1.5 rounded-xl bg-red-500 text-white hover:bg-red-600 transition text-[11px] font-extrabold cursor-pointer shrink-0"
            >
              Select All Trashed ({countTrash})
            </button>
          )}
        </div>
      )}

      {/* Filters & Bulk Action Toolbars (WooCommerce Layout) */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-surface border border-border-theme p-4 rounded-2xl shadow-sm">
        {/* Bulk Action Controls */}
        <div className="flex items-center space-x-2">
          <select
            value={bulkAction}
            onChange={(e) => setBulkAction(e.target.value)}
            className="bg-background border border-border-theme text-foreground rounded-xl px-3 py-2 text-xs font-bold outline-none cursor-pointer focus:border-accent"
          >
            <option value="">Bulk Actions</option>
            {statusFilter === "trash" ? (
              <>
                <option value="restore">Restore Selected</option>
                <option value="delete_permanently">Delete Permanently</option>
              </>
            ) : (
              <>
                <option value="publish">Mark as Published</option>
                <option value="draft">Mark as Draft</option>
                <option value="trash">Move to Trash</option>
              </>
            )}
          </select>
          <button
            type="button"
            onClick={handleApplyBulkAction}
            className="px-4 py-2 rounded-xl bg-accent/10 text-accent font-bold text-xs border border-accent/20 hover:bg-accent hover:text-accent-content transition cursor-pointer"
          >
            Apply
          </button>

          {selectedProductIds.length > 0 && (
            <span className="text-xs font-bold text-accent font-mono ml-2">
              {selectedProductIds.length} Selected
            </span>
          )}
        </div>

        {/* Search & Filter Bar */}
        <div className="flex items-center space-x-3 flex-1 max-w-md">
          <div className="relative w-full">
            <input
              type="text"
              placeholder="Search products by title or SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-border-theme rounded-xl pl-9 pr-4 py-2 text-xs text-foreground outline-none focus:border-accent"
            />
            <i className="ri-search-line absolute left-3 top-2.5 text-foreground/40 text-xs" />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-surface border border-border-theme rounded-2xl overflow-hidden shadow-sm">
        {filteredProducts.length === 0 && !loading ? (
          <div className="p-12 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground/60">No products match your filter.</p>
            <Link
              to="/products/create"
              className="inline-block px-4 py-2 rounded-xl bg-accent/10 text-accent font-bold text-xs border border-accent/20"
            >
              + Add Product
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto scrollbar-thin">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-background/80 border-b border-border-theme font-extrabold text-foreground/70 uppercase tracking-wider text-[11px]">
                  <th className="p-4 w-10 text-center">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={toggleSelectAll}
                      className="accent-accent w-4 h-4 cursor-pointer"
                    />
                  </th>
                  <th className="p-4 w-16">Image</th>
                  <th className="p-4">Name</th>
                  <th className="p-4">SKU</th>
                  <th className="p-4">Stock</th>
                  <th className="p-4">Price</th>
                  <th className="p-4">Categories</th>
                  <th className="p-4">Tags</th>
                </tr>
              </thead>

              {loading ? (
                <SellerTableSkeleton rows={6} />
              ) : (
                <tbody className="divide-y divide-border-theme/40">
                {filteredProducts.map((prod) => {
                  const isChecked = selectedProductIds.includes(prod._id);
                  const imgUrl = prod.images?.[0]?.url || prod.images?.[0] || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200";
                  const priceAmount = prod.sellingPrice?.amount || prod.maxPrice?.amount || 0;

                  return (
                    <tr
                      key={prod._id}
                      className={`group hover:bg-background/50 transition-colors ${isChecked ? "bg-accent/5" : ""}`}
                    >
                      {/* Checkbox */}
                      <td className="p-4 text-center">
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(prod._id)}
                          className="accent-accent w-4 h-4 cursor-pointer"
                        />
                      </td>

                      {/* Thumbnail */}
                      <td className="p-4">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-border-theme bg-background">
                          <img src={imgUrl} alt={prod.title} className="w-full h-full object-cover" />
                        </div>
                      </td>

                      {/* Name & Quick Action Links */}
                      <td className="p-4 space-y-1">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-foreground hover:text-accent cursor-pointer transition text-sm">
                            {prod.title}
                          </span>
                          {prod.status === "trash" ? (
                            <span className="text-[10px] font-extrabold uppercase bg-red-500/10 text-red-500 border border-red-500/20 px-2 py-0.5 rounded-full flex items-center gap-1">
                              <i className="ri-delete-bin-line text-[10px]" /> Trashed
                            </span>
                          ) : prod.status === "draft" ? (
                            <span className="text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full">
                              Draft
                            </span>
                          ) : null}
                        </div>

                        {/* Actions */}
                        {prod.status === "trash" ? (
                          <div className="flex items-center space-x-2.5 text-[11px] font-semibold pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleRestoreSingle(prod._id)}
                              className="text-emerald-500 hover:underline cursor-pointer font-bold flex items-center gap-1"
                            >
                              <i className="ri-history-line" />
                              <span>Restore</span>
                            </button>
                            <span>|</span>
                            <button
                              type="button"
                              onClick={() => confirmDelete(prod._id)}
                              className="text-red-500 hover:underline cursor-pointer font-bold flex items-center gap-1"
                            >
                              <i className="ri-delete-bin-line" />
                              <span>Delete Permanently</span>
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2 text-[11px] font-semibold text-foreground/50 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => handleEditProduct(prod._id)}
                              className="text-accent hover:underline cursor-pointer"
                            >
                              Edit
                            </button>
                            <span>|</span>
                            <button
                              type="button"
                              onClick={() => handleDuplicateProduct(prod)}
                              className="text-foreground/70 hover:underline cursor-pointer"
                            >
                              Duplicate
                            </button>
                            <span>|</span>
                            <button
                              type="button"
                              onClick={() => confirmDelete(prod._id)}
                              className="text-red-400 hover:underline cursor-pointer"
                            >
                              Move to Trash
                            </button>
                            <span>|</span>
                            <a
                              href={`/product/${prod.slug || prod._id}`}
                              target="_blank"
                              rel="noreferrer"
                              className="text-foreground/70 hover:underline cursor-pointer"
                            >
                              View
                            </a>
                          </div>
                        )}
                      </td>

                      {/* SKU */}
                      <td className="p-4 font-mono font-bold text-foreground/80">
                        {prod.sku || "—"}
                      </td>

                      {/* Stock */}
                      <td className="p-4">
                        {prod.manageStock ? (
                          Number(prod.stock) > 0 ? (
                            <span className="text-emerald-500 font-bold flex items-center space-x-1">
                              <span>In stock</span>
                              <span className="text-[10px] text-foreground/50 font-mono">× {prod.stock}</span>
                            </span>
                          ) : (
                            <span className="text-red-400 font-bold">Out of stock</span>
                          )
                        ) : (
                          <span className="text-emerald-500 font-bold">In stock</span>
                        )}
                      </td>

                      {/* Price */}
                      <td className="p-4 font-extrabold text-foreground font-mono">
                        ₹{Number(priceAmount).toLocaleString("en-IN")}
                      </td>

                      {/* Category */}
                      <td className="p-4 text-foreground/80 font-medium">
                        {prod.category?.name || "Uncategorized"}
                      </td>

                      {/* Tags */}
                      <td className="p-4 text-foreground/60">
                        {Array.isArray(prod.tags) && prod.tags.length > 0 ? prod.tags.join(", ") : "—"}
                      </td>

                      {/* Date */}
                      <td className="p-4 text-right text-foreground/50 font-mono text-[11px] whitespace-nowrap">
                        {prod.updatedAt ? new Date(prod.updatedAt).toLocaleDateString() : "Recently"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              )}
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerCatalog;
