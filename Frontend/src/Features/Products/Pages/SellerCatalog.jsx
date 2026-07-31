import React, { useState, useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useProduct } from "../Hooks/useProduct";
import SellerProductCard from "../Components/SellerProductCard";
import Modal from "../../../Components/Modal";

const SellerCatalog = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const { sellerProducts, loading, handleFetchSellerProducts, handleDeleteProduct } = useProduct();

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [deleteModal, setDeleteModal] = useState({ open: false, productId: null });

  useEffect(() => {
    if (user?._id || user?.id) {
      handleFetchSellerProducts(user._id || user.id);
    }
  }, [user, handleFetchSellerProducts]);

  const handleEditProduct = (prod) => {
    navigate(`/products/edit/${prod._id}`);
  };

  const confirmDelete = (productId) => {
    setDeleteModal({ open: true, productId });
  };

  const runDelete = async () => {
    if (deleteModal.productId) {
      await handleDeleteProduct(deleteModal.productId);
      setDeleteModal({ open: false, productId: null });
    }
  };

  const filteredProducts = sellerProducts.filter((p) => {
    const matchesSearch =
      p.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.sku?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || p.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6 selection:bg-accent selection:text-accent-content">
      {/* Delete Modal */}
      <Modal
        isOpen={deleteModal.open}
        onClose={() => setDeleteModal({ open: false, productId: null })}
        onConfirm={runDelete}
        title="Delete Product Listing?"
        description="This action is permanent. This product will be removed from your catalog and storefront."
        confirmText="Delete Permanently"
        type="danger"
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Seller Product Catalog</h1>
          <p className="text-xs text-foreground/60 mt-1">
            Manage, update, edit, and filter all products listed under your seller account.
          </p>
        </div>
        <Link
          to="/products/create"
          className="px-5 py-3 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow-md hover:opacity-90 transition cursor-pointer"
        >
          🚀 + Create New Product
        </Link>
      </div>

      {/* Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center gap-4 bg-background border border-border-theme p-4 rounded-2xl shadow-sm">
        <div className="flex-1 w-full">
          <input
            type="text"
            placeholder="Search catalog by product title or SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-surface border border-border-theme rounded-xl px-4 py-2.5 text-xs text-foreground outline-none focus:border-accent"
          />
        </div>

        <div className="flex items-center space-x-2 w-full sm:w-auto">
          {["all", "published", "draft"].map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setStatusFilter(st)}
              className={`px-4 py-2 rounded-xl text-xs font-extrabold capitalize transition ${
                statusFilter === st
                  ? "bg-accent text-accent-content shadow"
                  : "bg-surface text-foreground/70 hover:text-foreground border border-border-theme"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Products Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs font-bold text-foreground/60 animate-pulse">
          Loading catalog products...
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="py-16 text-center space-y-3 bg-background border border-border-theme rounded-2xl">
          <p className="text-sm font-semibold text-foreground/60">No products match your filter.</p>
          <Link
            to="/products/create"
            className="inline-block px-4 py-2 rounded-xl bg-accent/10 text-accent font-bold text-xs border border-accent/20"
          >
            + Create New Product
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {filteredProducts.map((prod) => (
            <SellerProductCard
              key={prod._id}
              product={prod}
              onEdit={handleEditProduct}
              onDelete={confirmDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default SellerCatalog;
