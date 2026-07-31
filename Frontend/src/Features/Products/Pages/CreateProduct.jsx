import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useProduct } from "../Hooks/useProduct";
import { useCategory } from "../../Categories/Hooks/useCategory";
import { useBrand } from "../../Brands/Hooks/useBrand";
import { useUnit } from "../../Units/Hooks/useUnit";
import FormField from "../Components/FormField";
import ImageDropzone from "../Components/ImageDropzone";
import ProductFormTabs from "../Components/ProductFormTabs";
import VariantItemCard from "../Components/VariantItemCard";
import Modal from "../../../Components/Modal";
import { mergeAttributeItem } from "../../../utils/attributeUtils";

const inputClass =
  "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-foreground outline-none transition-all duration-300 focus:ring-4 focus:ring-accent/10 placeholder:text-foreground/25";

const selectClass =
  "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-foreground outline-none transition-all duration-300 focus:ring-4 focus:ring-accent/10 cursor-pointer";

const CreateProduct = () => {
  const navigate = useNavigate();
  const { creating, handleCreateProduct } = useProduct();
  const { categories, handleFetchCategories, handleCreateCategory } = useCategory();
  const { brands, handleFetchBrands, handleCreateBrand } = useBrand();
  const { units, handleFetchUnits, handleCreateUnit } = useUnit();

  const [activeTab, setActiveTab] = useState("general");
  const [mainImages, setMainImages] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Category & Subcategory Creation Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [isSubcategoryModal, setIsSubcategoryModal] = useState(false);
  const [modalParentCat, setModalParentCat] = useState("");

  // Brand Creation Modal
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState("");

  // Unit Creation Modal
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitAbbr, setNewUnitAbbr] = useState("");

  // Main Attributes (Empty by default)
  const [mainAttrName, setMainAttrName] = useState("");
  const [mainAttrValues, setMainAttrValues] = useState("");
  const [mainAttributes, setMainAttributes] = useState([]);

  // Product Variants List (Empty by default)
  const [variantsList, setVariantsList] = useState([]);

  // Digital Downloadable Files (Empty by default)
  const [downloadableFiles, setDownloadableFiles] = useState([]);
  const [digitalFileName, setDigitalFileName] = useState("");
  const [digitalFileUrl, setDigitalFileUrl] = useState("");
  const [downloadLimit, setDownloadLimit] = useState("");
  const [expiryDays, setExpiryDays] = useState("");

  // Form State matching MongoDB Product Schema
  const [formData, setFormData] = useState({
    title: "",
    shortDescription: "",
    description: "",
    category: "",
    subcategories: [],
    brand: "",
    unit: "",
    tags: "",
    maxPriceAmount: "",
    maxPriceCurrency: "INR",
    sellingPriceAmount: "",
    stock: 10,
    manageStock: true,
    lowStockThreshold: 5,
    stockStatus: "instock",
    isCodAvailable: true,
    productType: "physical",
    weight: "",
    weightUnit: "kg",
    length: "",
    width: "",
    height: "",
    dimensionUnit: "cm",
    purchaseNote: "",
    enableReviews: true,
    showSizeChart: false,
    status: "published",
  });

  // Fetch Categories, Brands & Units on Mount
  useEffect(() => {
    handleFetchCategories();
    handleFetchBrands();
    handleFetchUnits();
  }, [handleFetchCategories, handleFetchBrands, handleFetchUnits]);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  // Subcategories Toggle Handler (Allows multi-select array)
  const toggleSubcategory = (subCatId) => {
    setFormData((prev) => {
      const currentSubCats = prev.subcategories || [];
      const exists = currentSubCats.includes(subCatId);
      const updated = exists
        ? currentSubCats.filter((id) => id !== subCatId)
        : [...currentSubCats, subCatId];
      return { ...prev, subcategories: updated };
    });
  };

  // Create Category or Subcategory Submit Handler
  const handleCreateCategorySubmit = async (e) => {
    e.preventDefault();
    if (!newCatName.trim()) return;
    const payload = {
      name: newCatName.trim(),
      parentCategory: isSubcategoryModal ? modalParentCat || formData.category || null : null,
    };
    const res = await handleCreateCategory(payload);
    if (res.success && res.data) {
      if (isSubcategoryModal) {
        toggleSubcategory(res.data._id);
      } else {
        setFormData((prev) => ({ ...prev, category: res.data._id }));
      }
      setNewCatName("");
      setIsSubcategoryModal(false);
      setModalParentCat("");
      setShowCategoryModal(false);
    }
  };

  // Create Brand Handler
  const handleCreateBrandSubmit = async (e) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    const res = await handleCreateBrand({ name: newBrandName.trim() });
    if (res.success && res.data) {
      setFormData((prev) => ({ ...prev, brand: res.data._id }));
      setNewBrandName("");
      setShowBrandModal(false);
    }
  };

  // Create Unit Handler
  const handleCreateUnitSubmit = async (e) => {
    e.preventDefault();
    if (!newUnitName.trim() || !newUnitAbbr.trim()) return;
    const res = await handleCreateUnit({
      name: newUnitName.trim(),
      abbreviation: newUnitAbbr.trim(),
    });
    if (res.success && res.data) {
      setFormData((prev) => ({ ...prev, unit: res.data._id }));
      setNewUnitName("");
      setNewUnitAbbr("");
      setShowUnitModal(false);
    }
  };

  // Main Attributes Handler
  const handleAddMainAttribute = (e) => {
    e.preventDefault();
    if (!mainAttrName.trim() || !mainAttrValues.trim()) return;

    setMainAttributes((prev) => mergeAttributeItem(prev, mainAttrName, mainAttrValues));
    setMainAttrName("");
    setMainAttrValues("");
  };

  const removeMainAttribute = (index) => {
    setMainAttributes((prev) => prev.filter((_, i) => i !== index));
  };

  // Custom Variant Handlers
  const handleAddCustomVariant = () => {
    const defaultName = formData.title
      ? `${formData.title} - Variant ${variantsList.length + 1}`
      : `Variant ${variantsList.length + 1}`;

    const newVariant = {
      id: Math.random().toString(36).substring(2, 9),
      name: defaultName,
      priceAmount: formData.sellingPriceAmount || formData.maxPriceAmount || "",
      stock: formData.stock || 10,
      sku: "",
      dynamicAttributes: [],
      images: [],
    };
    setVariantsList((prev) => [...prev, newVariant]);
  };

  const handleVariantChange = (id, field, value) => {
    setVariantsList((prev) =>
      prev.map((v) => (v.id === id ? { ...v, [field]: value } : v))
    );
  };

  const handleAddVariantAttribute = (variantId, key, value) => {
    if (!key.trim() || !value.trim()) return;
    setVariantsList((prev) =>
      prev.map((v) => {
        if (v.id === variantId) {
          const mergedAttrs = mergeAttributeItem(v.dynamicAttributes || [], key, value);
          return { ...v, dynamicAttributes: mergedAttrs };
        }
        return v;
      })
    );
  };

  const removeVariantAttribute = (variantId, attrIndex) => {
    setVariantsList((prev) =>
      prev.map((v) => {
        if (v.id === variantId) {
          const updatedAttrs = v.dynamicAttributes.filter((_, i) => i !== attrIndex);
          return { ...v, dynamicAttributes: updatedAttrs };
        }
        return v;
      })
    );
  };

  const handleVariantImagesChange = (id, newImages) => {
    setVariantsList((prev) =>
      prev.map((v) => (v.id === id ? { ...v, images: newImages } : v))
    );
  };

  const removeVariant = (id) => {
    setVariantsList((prev) => prev.filter((v) => v.id !== id));
  };

  // Downloadable Files Handler
  const handleAddDigitalFile = (e) => {
    e.preventDefault();
    if (!digitalFileName.trim() || !digitalFileUrl.trim()) return;

    setDownloadableFiles((prev) => [
      ...prev,
      {
        name: digitalFileName.trim(),
        url: digitalFileUrl.trim(),
        downloadLimit: downloadLimit ? Number(downloadLimit) : null,
        expiryDays: expiryDays ? Number(expiryDays) : null,
      },
    ]);
    setDigitalFileName("");
    setDigitalFileUrl("");
    setDownloadLimit("");
    setExpiryDays("");
  };

  const removeDigitalFile = (index) => {
    setDownloadableFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.title.trim()) errors.title = "Product title is required";
    if (!formData.description.trim()) errors.description = "Description is required";
    if (!formData.category) errors.category = "Category selection is required";
    if (!formData.maxPriceAmount || Number(formData.maxPriceAmount) <= 0) {
      errors.maxPriceAmount = "Valid MRP Price is required";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e, targetStatus = null) => {
    if (e) e.preventDefault();
    if (!validateForm()) {
      setActiveTab("general");
      return;
    }

    const finalStatus = targetStatus || formData.status || "published";

    const payload = new FormData();
    payload.append("title", formData.title);
    payload.append("shortDescription", formData.shortDescription);
    payload.append("description", formData.description);
    payload.append("category", formData.category);
    if (formData.brand) payload.append("brand", formData.brand);
    if (formData.unit) payload.append("unit", formData.unit);
    payload.append("productType", formData.productType);
    payload.append("status", finalStatus);
    payload.append("manageStock", formData.manageStock);
    payload.append("stockStatus", formData.stockStatus);
    payload.append("stock", formData.stock);
    payload.append("lowStockThreshold", formData.lowStockThreshold);
    payload.append("isCodAvailable", formData.isCodAvailable);
    payload.append("enableReviews", formData.enableReviews);
    payload.append("showSizeChart", formData.showSizeChart);
    if (formData.purchaseNote) payload.append("purchaseNote", formData.purchaseNote);

    // Subcategories Array
    if (formData.subcategories && formData.subcategories.length > 0) {
      formData.subcategories.forEach((subId, idx) => {
        payload.append(`subcategories[${idx}]`, subId);
      });
    }

    // Physical Specs
    if (formData.productType === "physical") {
      if (formData.weight) {
        payload.append("weight", formData.weight);
        payload.append("weightUnit", formData.weightUnit);
      }
      if (formData.length || formData.width || formData.height) {
        payload.append("dimensions[length]", formData.length || 0);
        payload.append("dimensions[width]", formData.width || 0);
        payload.append("dimensions[height]", formData.height || 0);
        payload.append("dimensions[unit]", formData.dimensionUnit || "cm");
      }
    }

    // Downloadable Digital Files
    if (formData.productType === "downloadable" && downloadableFiles.length > 0) {
      payload.append("downloadableFiles", JSON.stringify(downloadableFiles));
    }

    // Prices
    payload.append("maxPrice[amount]", formData.maxPriceAmount);
    payload.append("maxPrice[currency]", formData.maxPriceCurrency);
    if (formData.sellingPriceAmount) {
      payload.append("sellingPrice[amount]", formData.sellingPriceAmount);
      payload.append("sellingPrice[currency]", formData.maxPriceCurrency);
    }

    // Tags
    if (formData.tags) {
      const tagArray = formData.tags
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      tagArray.forEach((tag, idx) => payload.append(`tags[${idx}]`, tag));
    }

    // Main Attributes
    if (mainAttributes.length > 0) {
      mainAttributes.forEach((attr, idx) => {
        payload.append(`attributes[${idx}][name]`, attr.name);
        attr.options.forEach((opt, optIdx) => {
          payload.append(`attributes[${idx}][options][${optIdx}]`, opt);
        });
      });
    }

    // Variants Array
    if (variantsList.length > 0) {
      const formattedVariants = variantsList.map((v) => {
        const attrMap = {};
        v.dynamicAttributes.forEach((da) => {
          attrMap[da.key] = da.value;
        });

        return {
          name: v.name || formData.title,
          attributes: attrMap,
          price: {
            amount: Number(v.priceAmount || formData.sellingPriceAmount || formData.maxPriceAmount),
            currency: formData.maxPriceCurrency,
          },
          stock: Number(v.stock),
          sku: v.sku,
          imageUrls: v.images.filter((img) => img.isUrl).map((img) => img.url),
        };
      });

      payload.append("variants", JSON.stringify(formattedVariants));
    }

    // Main Product Images
    mainImages.forEach((imgObj) => {
      if (imgObj.isUrl && imgObj.url) {
        payload.append("imageUrls", imgObj.url);
      } else if (imgObj.file) {
        payload.append("images", imgObj.file);
      }
    });

    const result = await handleCreateProduct(payload);
    if (result.success) {
      navigate("/shop");
    }
  };

  const discountPercent =
    formData.maxPriceAmount && formData.sellingPriceAmount
      ? Math.round(
          ((formData.maxPriceAmount - formData.sellingPriceAmount) /
            formData.maxPriceAmount) *
            100
        )
      : 0;

  // Filter Categories into Parent Categories vs Subcategories
  const mainCategories = categories.filter((c) => !c.parentCategory);
  const subCategoriesList = categories.filter(
    (c) =>
      c.parentCategory &&
      (formData.category ? c.parentCategory.toString() === formData.category.toString() : true)
  );

  return (
    <div className="min-h-screen bg-background text-foreground p-4 sm:p-6 md:p-10 transition-colors duration-300">
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Top Header & Actions */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border-theme pb-6">
          <div>
            <span className="inline-flex items-center space-x-2 text-xs font-bold px-3 py-1 rounded-full bg-accent/10 text-accent border border-accent/20 mb-2">
              <span>🛍️ Seller Dashboard</span>
            </span>
            <h1 className="text-3xl font-extrabold tracking-tight text-foreground">
              Create New Product Listing
            </h1>
            <p className="text-foreground/60 text-sm mt-1">
              Add product details, prices, inventory, custom attributes, variants, and photos.
            </p>
          </div>

          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => navigate(-1)}
              className="px-4 py-2.5 rounded-xl border border-border-theme text-foreground/80 hover:bg-surface hover:text-foreground transition font-medium text-sm cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={creating}
              className="px-4 py-2.5 rounded-xl border border-border-theme bg-surface hover:bg-background text-foreground font-semibold text-sm transition cursor-pointer"
            >
              💾 Save as Draft
            </button>
            <button
              type="submit"
              onClick={(e) => handleSubmit(e, "published")}
              disabled={creating}
              className="px-6 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-sm shadow-lg shadow-accent/20 hover:opacity-95 transition duration-200 disabled:opacity-50 flex items-center space-x-2 cursor-pointer"
            >
              {creating ? (
                <span>Publishing...</span>
              ) : (
                <span>🚀 Publish Product</span>
              )}
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <ProductFormTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Form Body */}
        <form onSubmit={(e) => handleSubmit(e, "published")} className="space-y-6">
          {/* TAB 1: BASIC INFO */}
          {activeTab === "general" && (
            <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                General Information
              </h2>

              <FormField label="Product Title" required error={formErrors.title}>
                <input
                  type="text"
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  placeholder="Enter product title..."
                  className={inputClass}
                  maxLength={200}
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Main Category */}
                <FormField label="Main Category" required error={formErrors.category}>
                  <div className="flex gap-2">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">Select Main Category</option>
                      {mainCategories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubcategoryModal(false);
                        setShowCategoryModal(true);
                      }}
                      className="px-3 py-2 bg-accent/10 border border-accent/30 text-accent rounded-xl text-xs font-bold whitespace-nowrap hover:bg-accent hover:text-accent-content transition cursor-pointer"
                    >
                      + New
                    </button>
                  </div>
                </FormField>

                {/* Brand */}
                <FormField label="Brand (Optional)">
                  <div className="flex gap-2">
                    <select
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">Select Brand</option>
                      {brands.map((b) => (
                        <option key={b._id} value={b._id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowBrandModal(true)}
                      className="px-3 py-2 bg-accent/10 border border-accent/30 text-accent rounded-xl text-xs font-bold whitespace-nowrap hover:bg-accent hover:text-accent-content transition cursor-pointer"
                    >
                      + New
                    </button>
                  </div>
                </FormField>
              </div>

              {/* Subcategories Selector (Multi-Select Group) */}
              <div className="space-y-2 pt-2 border-t border-border-theme">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-semibold text-foreground flex items-center space-x-2">
                    <span>Multiple Subcategories (Optional):</span>
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setIsSubcategoryModal(true);
                      setModalParentCat(formData.category);
                      setShowCategoryModal(true);
                    }}
                    className="text-xs font-bold text-accent underline hover:opacity-80 cursor-pointer"
                  >
                    + Create New Subcategory
                  </button>
                </div>

                {subCategoriesList.length > 0 ? (
                  <div className="flex flex-wrap gap-2 pt-1">
                    {subCategoriesList.map((subCat) => {
                      const isSelected = formData.subcategories.includes(subCat._id);
                      return (
                        <button
                          key={subCat._id}
                          type="button"
                          onClick={() => toggleSubcategory(subCat._id)}
                          className={`px-3 py-1.5 rounded-xl border text-xs font-semibold transition cursor-pointer ${
                            isSelected
                              ? "bg-accent text-accent-content border-accent font-bold shadow-md shadow-accent/20"
                              : "bg-background border-border-theme text-foreground/70 hover:border-accent"
                          }`}
                        >
                          {isSelected ? "✓ " : "+ "} {subCat.name}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-foreground/50 italic">
                    {formData.category
                      ? "No subcategories found under selected category. Click '+ Create New Subcategory' to add one."
                      : "Select a Main Category above to view and assign subcategories."}
                  </p>
                )}
              </div>

              <FormField label="Short Summary / Tagline">
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="Catchy brief summary..."
                  className={inputClass}
                  maxLength={500}
                />
              </FormField>

              <FormField label="Full Description" required error={formErrors.description}>
                <textarea
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed description, features, fabric info, care instructions..."
                  className={inputClass}
                  maxLength={5000}
                />
              </FormField>

              <FormField label="Tags (Comma Separated)">
                <input
                  type="text"
                  name="tags"
                  value={formData.tags}
                  onChange={handleChange}
                  placeholder="oversized, hoodie, streetwear"
                  className={inputClass}
                />
              </FormField>
            </div>
          )}

          {/* TAB 2: PRICING & STOCK */}
          {activeTab === "pricing" && (
            <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                Pricing & Inventory
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="MRP / Maximum Price (₹)" required error={formErrors.maxPriceAmount}>
                  <input
                    type="number"
                    name="maxPriceAmount"
                    value={formData.maxPriceAmount}
                    onChange={handleChange}
                    placeholder="2999"
                    className={inputClass}
                    min={0}
                  />
                </FormField>

                <FormField
                  label="Selling Price (Special Offer ₹)"
                  helperText={
                    discountPercent > 0 ? (
                      <span className="text-emerald-500 font-bold">
                        🔥 {discountPercent}% OFF
                      </span>
                    ) : (
                      "Leave empty if same as MRP"
                    )
                  }
                >
                  <input
                    type="number"
                    name="sellingPriceAmount"
                    value={formData.sellingPriceAmount}
                    onChange={handleChange}
                    placeholder="1999"
                    className={inputClass}
                    min={0}
                  />
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-6 pt-4 border-t border-border-theme">
                <FormField label="Stock Quantity">
                  <input
                    type="number"
                    name="stock"
                    value={formData.stock}
                    onChange={handleChange}
                    className={inputClass}
                    min={0}
                  />
                </FormField>

                <FormField label="Unit of Measurement">
                  <div className="flex gap-2">
                    <select
                      name="unit"
                      value={formData.unit}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">Select Unit</option>
                      {units.map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name} ({u.abbreviation.toUpperCase()})
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      onClick={() => setShowUnitModal(true)}
                      className="px-3 py-2 bg-accent/10 border border-accent/30 text-accent rounded-xl text-xs font-bold whitespace-nowrap hover:bg-accent hover:text-accent-content transition cursor-pointer"
                    >
                      + New
                    </button>
                  </div>
                </FormField>

                <FormField label="Low Stock Alert">
                  <input
                    type="number"
                    name="lowStockThreshold"
                    value={formData.lowStockThreshold}
                    onChange={handleChange}
                    className={inputClass}
                    min={0}
                  />
                </FormField>

                <FormField label="Stock Status">
                  <select
                    name="stockStatus"
                    value={formData.stockStatus}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    <option value="instock">In Stock</option>
                    <option value="outofstock">Out of Stock</option>
                    <option value="onbackorder">On Backorder</option>
                  </select>
                </FormField>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 border-t border-border-theme">
                <label className="flex items-center space-x-3 p-4 rounded-xl bg-background border border-border-theme cursor-pointer hover:border-accent/50 transition">
                  <input
                    type="checkbox"
                    name="isCodAvailable"
                    checked={formData.isCodAvailable}
                    onChange={handleChange}
                    className="w-5 h-5 accent-accent rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-foreground">Cash On Delivery (COD)</span>
                    <p className="text-xs text-foreground/60">Allow cash payment upon delivery</p>
                  </div>
                </label>

                <label className="flex items-center space-x-3 p-4 rounded-xl bg-background border border-border-theme cursor-pointer hover:border-accent/50 transition">
                  <input
                    type="checkbox"
                    name="manageStock"
                    checked={formData.manageStock}
                    onChange={handleChange}
                    className="w-5 h-5 accent-accent rounded cursor-pointer"
                  />
                  <div>
                    <span className="text-sm font-semibold text-foreground">Automated Inventory Tracking</span>
                    <p className="text-xs text-foreground/60">Auto-decrement stock on orders</p>
                  </div>
                </label>
              </div>
            </div>
          )}

          {/* TAB 3: ATTRIBUTES & DYNAMIC VARIANTS */}
          {activeTab === "variants" && (
            <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm">
              {/* SECTION 1: MAIN ATTRIBUTES */}
              <div>
                <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                  1. Main Product Attributes
                </h2>
                <p className="text-xs text-foreground/60 mt-1">
                  Define general attributes for the product (e.g. Material, Origin, Care Instructions).
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-background border border-border-theme p-4 rounded-xl">
                <input
                  type="text"
                  placeholder="Attribute Name (e.g. Material)"
                  value={mainAttrName}
                  onChange={(e) => setMainAttrName(e.target.value)}
                  className={inputClass}
                />
                <input
                  type="text"
                  placeholder="Options (e.g. 100% Cotton, Denim)"
                  value={mainAttrValues}
                  onChange={(e) => setMainAttrValues(e.target.value)}
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={handleAddMainAttribute}
                  className="px-5 py-3 rounded-xl bg-accent text-accent-content font-bold text-sm hover:opacity-90 transition cursor-pointer"
                >
                  + Add Attribute
                </button>
              </div>

              {mainAttributes.length > 0 && (
                <div className="flex flex-wrap gap-3">
                  {mainAttributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="bg-background border border-border-theme rounded-xl px-4 py-2.5 flex items-center space-x-3"
                    >
                      <div>
                        <span className="text-xs font-bold text-accent uppercase">{attr.name}:</span>
                        <span className="text-xs text-foreground/80 font-medium ml-2">
                          {attr.options.join(", ")}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeMainAttribute(idx)}
                        className="text-red-400 hover:text-red-600 font-bold text-xs cursor-pointer"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* SECTION 2: CUSTOM DYNAMIC VARIANTS */}
              <div className="pt-6 border-t border-border-theme space-y-6">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      2. Product Variants
                    </h2>
                    <p className="text-xs text-foreground/60">
                      Add custom product variants with any dynamic attributes, prices, stock, and dedicated photos.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={handleAddCustomVariant}
                    className="px-5 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs shadow-md hover:opacity-90 transition cursor-pointer"
                  >
                    + Add Product Variant
                  </button>
                </div>

                {variantsList.length === 0 ? (
                  <div className="text-center py-8 border border-dashed border-border-theme rounded-2xl bg-background/50">
                    <p className="text-sm font-semibold text-foreground/70">No variants added yet.</p>
                    <p className="text-xs text-foreground/50 mt-1">
                      Click "+ Add Product Variant" if this product has multiple variations.
                    </p>
                  </div>
                ) : (
                  variantsList.map((variant, vIdx) => (
                    <VariantItemCard
                      key={variant.id}
                      variant={variant}
                      vIdx={vIdx}
                      handleVariantChange={handleVariantChange}
                      handleAddVariantAttribute={handleAddVariantAttribute}
                      removeVariantAttribute={removeVariantAttribute}
                      handleVariantImagesChange={handleVariantImagesChange}
                      removeVariant={removeVariant}
                    />
                  ))
                )}
              </div>
            </div>
          )}

          {/* TAB 4: SHIPPING & SPECS */}
          {activeTab === "shipping" && (
            <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                Shipping & Product Options
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="Product Type">
                  <select
                    name="productType"
                    value={formData.productType}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    <option value="physical">Physical Shipped Product</option>
                    <option value="downloadable">Digital Downloadable Product</option>
                  </select>
                </FormField>

                {formData.productType === "physical" && (
                  <div className="flex gap-2 items-end">
                    <div className="flex-1">
                      <FormField label="Item Weight">
                        <input
                          type="number"
                          step="0.01"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="0.5"
                          className={inputClass}
                        />
                      </FormField>
                    </div>
                    <select
                      name="weightUnit"
                      value={formData.weightUnit}
                      onChange={handleChange}
                      className="bg-background border border-border-theme rounded-xl px-3 py-3 text-sm text-foreground outline-none"
                    >
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="lb">lb</option>
                      <option value="oz">oz</option>
                    </select>
                  </div>
                )}
              </div>

              {formData.productType === "physical" && (
                <div className="grid grid-cols-3 gap-4">
                  <FormField label="Length (cm)">
                    <input
                      type="number"
                      name="length"
                      value={formData.length}
                      onChange={handleChange}
                      placeholder="30"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Width (cm)">
                    <input
                      type="number"
                      name="width"
                      value={formData.width}
                      onChange={handleChange}
                      placeholder="20"
                      className={inputClass}
                    />
                  </FormField>

                  <FormField label="Height (cm)">
                    <input
                      type="number"
                      name="height"
                      value={formData.height}
                      onChange={handleChange}
                      placeholder="5"
                      className={inputClass}
                    />
                  </FormField>
                </div>
              )}

              {/* Digital Downloadable Products Section */}
              {formData.productType === "downloadable" && (
                <div className="bg-background border border-border-theme p-6 rounded-2xl space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-foreground">📥 Digital Downloadable Files</h3>
                    <p className="text-xs text-foreground/60">
                      Add downloadable links or file URLs delivered to buyers after purchase.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="File Label (e.g. Software E-Book PDF)"
                      value={digitalFileName}
                      onChange={(e) => setDigitalFileName(e.target.value)}
                      className={inputClass}
                    />
                    <input
                      type="url"
                      placeholder="Download URL link..."
                      value={digitalFileUrl}
                      onChange={(e) => setDigitalFileUrl(e.target.value)}
                      className={inputClass}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <input
                      type="number"
                      placeholder="Download Limit (empty = unlimited)"
                      value={downloadLimit}
                      onChange={(e) => setDownloadLimit(e.target.value)}
                      className={inputClass}
                      min={1}
                    />
                    <input
                      type="number"
                      placeholder="Expiry Days (empty = never expires)"
                      value={expiryDays}
                      onChange={(e) => setExpiryDays(e.target.value)}
                      className={inputClass}
                      min={1}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={handleAddDigitalFile}
                    className="px-5 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs shadow cursor-pointer"
                  >
                    + Add Download File
                  </button>

                  {downloadableFiles.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {downloadableFiles.map((df, dfIdx) => (
                        <div
                          key={dfIdx}
                          className="flex items-center justify-between p-3 bg-surface border border-border-theme rounded-xl text-xs"
                        >
                          <div>
                            <span className="font-bold text-foreground">📁 {df.name}</span>
                            <span className="text-foreground/60 ml-2">({df.url})</span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDigitalFile(dfIdx)}
                            className="text-red-400 font-bold hover:text-red-600 cursor-pointer"
                          >
                            Remove
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <FormField label="Post-Purchase Customer Note">
                <input
                  type="text"
                  name="purchaseNote"
                  value={formData.purchaseNote}
                  onChange={handleChange}
                  placeholder="Thank you for your purchase!"
                  className={inputClass}
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <label className="flex items-center space-x-3 p-4 rounded-xl bg-background border border-border-theme cursor-pointer hover:border-accent/50 transition">
                  <input
                    type="checkbox"
                    name="enableReviews"
                    checked={formData.enableReviews}
                    onChange={handleChange}
                    className="w-5 h-5 accent-accent rounded cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-foreground">Enable Product Reviews & Ratings</span>
                </label>

                <label className="flex items-center space-x-3 p-4 rounded-xl bg-background border border-border-theme cursor-pointer hover:border-accent/50 transition">
                  <input
                    type="checkbox"
                    name="showSizeChart"
                    checked={formData.showSizeChart}
                    onChange={handleChange}
                    className="w-5 h-5 accent-accent rounded cursor-pointer"
                  />
                  <span className="text-sm font-semibold text-foreground">Display Size Chart Button on Product Page</span>
                </label>
              </div>
            </div>
          )}

          {/* TAB 5: MEDIA UPLOAD */}
          {activeTab === "media" && (
            <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <div className="flex items-center justify-between border-b border-border-theme pb-3">
                <h2 className="text-lg font-bold text-foreground">
                  Main Product Photos (Up to 7)
                </h2>
                <span className="text-xs text-foreground/60">
                  First photo is the primary display image
                </span>
              </div>

              <ImageDropzone images={mainImages} setImages={setMainImages} maxImages={7} />
            </div>
          )}

          {/* Bottom Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-border-theme">
            <button
              type="button"
              onClick={() => {
                const tabsList = ["general", "pricing", "variants", "shipping", "media"];
                const currentIndex = tabsList.indexOf(activeTab);
                if (currentIndex > 0) setActiveTab(tabsList[currentIndex - 1]);
              }}
              disabled={activeTab === "general"}
              className="px-5 py-2.5 rounded-xl border border-border-theme text-foreground/80 hover:bg-surface disabled:opacity-30 transition font-medium text-sm cursor-pointer"
            >
              ← Previous Step
            </button>

            <div className="flex items-center space-x-3">
              <button
                type="button"
                onClick={(e) => handleSubmit(e, "draft")}
                disabled={creating}
                className="px-4 py-2.5 rounded-xl border border-border-theme bg-surface hover:bg-background text-foreground font-semibold text-sm transition cursor-pointer"
              >
                💾 Save as Draft
              </button>

              {activeTab !== "media" ? (
                <button
                  type="button"
                  onClick={() => {
                    const tabsList = ["general", "pricing", "variants", "shipping", "media"];
                    const currentIndex = tabsList.indexOf(activeTab);
                    if (currentIndex < tabsList.length - 1) setActiveTab(tabsList[currentIndex + 1]);
                  }}
                  className="px-6 py-2.5 rounded-xl bg-surface border border-border-theme hover:border-accent text-foreground font-semibold text-sm transition cursor-pointer"
                >
                  Next Step →
                </button>
              ) : (
                <button
                  type="submit"
                  disabled={creating}
                  className="px-8 py-3 rounded-xl bg-accent text-accent-content font-bold text-base shadow-xl shadow-accent/20 hover:opacity-95 transition duration-200 flex items-center space-x-2 cursor-pointer"
                >
                  <span>🚀 Publish Listing Now</span>
                </button>
              )}
            </div>
          </div>
        </form>
      </div>

      {/* CREATE CATEGORY OR SUBCATEGORY MODAL */}
      <Modal
        isOpen={showCategoryModal}
        onClose={() => {
          setShowCategoryModal(false);
          setIsSubcategoryModal(false);
        }}
        onSubmit={handleCreateCategorySubmit}
        title={isSubcategoryModal ? "Create New Subcategory" : "Create New Category"}
        confirmText={isSubcategoryModal ? "Create Subcategory" : "Create Category"}
        isConfirmDisabled={!newCatName.trim()}
      >
        <input
          type="text"
          placeholder={
            isSubcategoryModal
              ? "Subcategory Name (e.g. Graphic Tees)"
              : "Category Name (e.g. Clothing)"
          }
          value={newCatName}
          onChange={(e) => setNewCatName(e.target.value)}
          className={inputClass}
          autoFocus
        />

        <div className="space-y-2 pt-2 border-t border-border-theme">
          <label className="flex items-center space-x-2 cursor-pointer text-xs font-semibold text-foreground">
            <input
              type="checkbox"
              checked={isSubcategoryModal}
              onChange={(e) => setIsSubcategoryModal(e.target.checked)}
              className="w-4 h-4 accent-accent rounded"
            />
            <span>This is a Subcategory</span>
          </label>

          {isSubcategoryModal && (
            <FormField label="Parent Main Category">
              <select
                value={modalParentCat || formData.category}
                onChange={(e) => setModalParentCat(e.target.value)}
                className={selectClass}
              >
                <option value="">Select Parent Category</option>
                {mainCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </FormField>
          )}
        </div>
      </Modal>

      {/* CREATE BRAND MODAL */}
      <Modal
        isOpen={showBrandModal}
        onClose={() => setShowBrandModal(false)}
        onSubmit={handleCreateBrandSubmit}
        title="Create New Brand"
        confirmText="Create Brand"
        isConfirmDisabled={!newBrandName.trim()}
      >
        <input
          type="text"
          placeholder="Brand Name (e.g. Puma)"
          value={newBrandName}
          onChange={(e) => setNewBrandName(e.target.value)}
          className={inputClass}
          autoFocus
        />
      </Modal>

      {/* CREATE UNIT MODAL */}
      <Modal
        isOpen={showUnitModal}
        onClose={() => setShowUnitModal(false)}
        onSubmit={handleCreateUnitSubmit}
        title="Create New Unit"
        confirmText="Create Unit"
        isConfirmDisabled={!newUnitName.trim() || !newUnitAbbr.trim()}
      >
        <input
          type="text"
          placeholder="Unit Name (e.g. Kilogram)"
          value={newUnitName}
          onChange={(e) => setNewUnitName(e.target.value)}
          className={inputClass}
          autoFocus
        />
        <input
          type="text"
          placeholder="Abbreviation (e.g. kg)"
          value={newUnitAbbr}
          onChange={(e) => setNewUnitAbbr(e.target.value)}
          className={inputClass}
        />
      </Modal>
    </div>
  );
};

export default CreateProduct;
