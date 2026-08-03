import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useProduct } from "../../Products/Hooks/useProduct";
import { useCategory } from "../../Categories/Hooks/useCategory";
import { useBrand } from "../../Brands/Hooks/useBrand";
import { useUnit } from "../../Units/Hooks/useUnit";
import Modal from "../../../Components/Modal";
import SellerMetadataManager from "./SellerMetadataManager";


// Cards showing in the seller dashboard
const GridCard = (name,count) =>{
  return <div className="bg-background border border-border-theme p-4 rounded-2xl space-y-1 shadow-sm">
          <span className="text-xs font-semibold text-foreground/70 ">{name}</span>
          <p className="text-3xl font-extrabold text-accent">{count}</p>
        </div>
}



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
          Create New Product
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
        {GridCard("Total Products",totalProducts)}
        {GridCard("Published Products",publishedProducts)}
        {GridCard("Drafts",draftProducts)}
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

      {/* <SellerMetadataManager/> */}
    </div>
  );
};

export default SellerDashboard;
