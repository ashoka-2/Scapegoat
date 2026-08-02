import React, { useState, useEffect } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
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
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = routeId || searchParams.get("edit");

  const { creating, handleCreateProduct, handleFetchSingleProduct, handleUpdateProduct } = useProduct();
  const { categories, handleFetchCategories, handleCreateCategory, handleUpdateCategory, handleDeleteCategory } = useCategory();
  const { brands, handleFetchBrands, handleCreateBrand, handleUpdateBrand, handleDeleteBrand } = useBrand();
  const { units, handleFetchUnits, handleCreateUnit, handleUpdateUnit, handleDeleteUnit } = useUnit();

  const [activeTab, setActiveTab] = useState("general");
  const [mainImages, setMainImages] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Reusable Modal Confirmation / Alert State
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: "",
    description: "",
    confirmText: "Confirm",
    showCancel: true,
    onConfirm: null,
  });

  const openConfirmModal = ({ title, description, confirmText = "Confirm", showCancel = true, onConfirm }) => {
    setConfirmModal({
      isOpen: true,
      title,
      description,
      confirmText,
      showCancel,
      onConfirm,
    });
  };

  const closeConfirmModal = () => {
    setConfirmModal((prev) => ({ ...prev, isOpen: false, onConfirm: null }));
  };

  // Category & Subcategory Creation / Edit Modal
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [isSubcategoryModal, setIsSubcategoryModal] = useState(false);
  const [modalParentCat, setModalParentCat] = useState("");

  // Brand Creation / Edit Modal
  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [newBrandName, setNewBrandName] = useState("");

  // Unit Creation / Edit Modal
  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitAbbr, setNewUnitAbbr] = useState("");

  // Main Attributes
  const [mainAttrName, setMainAttrName] = useState("");
  const [mainAttrValues, setMainAttrValues] = useState("");
  const [mainAttributes, setMainAttributes] = useState([]);

  // Product Variants List
  const [variantsList, setVariantsList] = useState([]);

  // Digital Downloadable Files
  const [downloadableFiles, setDownloadableFiles] = useState([]);
  const [digitalFileName, setDigitalFileName] = useState("");
  const [digitalFileUrl, setDigitalFileUrl] = useState("");
  const [downloadLimit, setDownloadLimit] = useState("");
  const [expiryDays, setExpiryDays] = useState("");

  // Bulk Quantity Discount Rules
  const [bulkDiscountRules, setBulkDiscountRules] = useState([]);
  const [bulkRuleMinQty, setBulkRuleMinQty] = useState("");
  const [bulkRuleDiscType, setBulkRuleDiscType] = useState("percentage");
  const [bulkRuleDiscValue, setBulkRuleDiscValue] = useState("");

  const initialFormData = {
    title: "",
    shortDescription: "",
    description: "",
    category: "",
    subcategories: [],
    brand: "",
    unit: "",
    tags: "",
    sku: "",
    maxPriceAmount: "",
    maxPriceCurrency: "INR",
    sellingPriceAmount: "",
    discountType: "percentage",
    discountValue: "",
    stock: 10,
    manageStock: true,
    lowStockThreshold: 5,
    stockStatus: "instock",
    isCodAvailable: false, // Default COD is unchecked
    productType: "physical",
    weight: "",
    weightUnit: "g",
    length: "",
    width: "",
    height: "",
    dimensionUnit: "cm",
    purchaseNote: "",
    enableReviews: true,
    showSizeChart: false,
    status: "published",
    metaTitle: "",
    metaDescription: "",
    keywords: "",
    canonicalUrl: "",
  };

  // Form State matching MongoDB Product Schema
  const [formData, setFormData] = useState(initialFormData);

  const DRAFT_STORAGE_KEY = "scapegoat_product_draft";

  // Fetch Categories, Brands & Units on Mount
  useEffect(() => {
    handleFetchCategories();
    handleFetchBrands();
    handleFetchUnits();
  }, [handleFetchCategories, handleFetchBrands, handleFetchUnits]);

  // Restore draft state from localStorage if in create mode
  useEffect(() => {
    if (!editId) {
      try {
        const savedDraft = localStorage.getItem(DRAFT_STORAGE_KEY);
        if (savedDraft) {
          const parsed = JSON.parse(savedDraft);
          if (parsed.formData) setFormData(parsed.formData);
          if (parsed.mainAttributes) setMainAttributes(parsed.mainAttributes);
          if (parsed.variantsList) setVariantsList(parsed.variantsList);
          if (parsed.downloadableFiles) setDownloadableFiles(parsed.downloadableFiles);
          if (parsed.bulkDiscountRules) setBulkDiscountRules(parsed.bulkDiscountRules);
        }
      } catch (err) {
        console.error("Failed to restore draft:", err);
      }
    }
  }, [editId]);

  // Auto-save draft to localStorage when user types in create mode
  useEffect(() => {
    if (!editId) {
      const isFormDirty =
        formData.title ||
        formData.description ||
        mainAttributes.length > 0 ||
        variantsList.length > 0;

      if (isFormDirty) {
        const draftPayload = {
          formData,
          mainAttributes,
          variantsList,
          downloadableFiles,
          bulkDiscountRules,
        };
        localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(draftPayload));
      }
    }
  }, [formData, mainAttributes, variantsList, downloadableFiles, bulkDiscountRules, editId]);

  // Unsaved changes browser prompt on tab/window close
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      const isDirty = formData.title || formData.description || mainAttributes.length > 0;
      if (!editId && isDirty) {
        e.preventDefault();
        e.returnValue = "You have unsaved product details. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [formData, mainAttributes, editId]);

  // Clear All Form Fields
  const handleClearAll = () => {
    openConfirmModal({
      title: "🧹 Clear All Form Fields",
      description: "Are you sure you want to clear all form fields? All entered product details will be reset.",
      confirmText: "Yes, Clear Form",
      showCancel: true,
      onConfirm: () => {
        setFormData(initialFormData);
        setMainAttributes([]);
        setVariantsList([]);
        setDownloadableFiles([]);
        setBulkDiscountRules([]);
        setMainImages([]);
        localStorage.removeItem(DRAFT_STORAGE_KEY);
      },
    });
  };

  // Prepopulate form if in Edit Mode
  useEffect(() => {
    if (editId) {
      handleFetchSingleProduct(editId).then((prod) => {
        if (!prod) return;
        try {
          const maxP = prod.maxPrice?.amount || "";
          const sellP = prod.sellingPrice?.amount || "";

          let discType = "percentage";
          let discVal = "";

          if (maxP && sellP && Number(sellP) < Number(maxP)) {
            const diff = Number(maxP) - Number(sellP);
            discVal = Math.round((diff / Number(maxP)) * 100);
          }

          setFormData({
            title: prod.title || "",
            shortDescription: prod.shortDescription || "",
            description: prod.description || "",
            category: prod.category?._id || prod.category || "",
            subcategories: (prod.subcategories || []).map((sc) => sc._id || sc),
            brand: prod.brand?._id || prod.brand || "",
            unit: prod.unit?._id || prod.unit || "",
            tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : prod.tags || "",
            sku: prod.sku || "",
            maxPriceAmount: maxP,
            maxPriceCurrency: prod.maxPrice?.currency || "INR",
            sellingPriceAmount: sellP,
            discountType: discType,
            discountValue: discVal ? String(discVal) : "",
            stock: prod.stock !== undefined ? prod.stock : 10,
            manageStock: prod.manageStock ?? true,
            lowStockThreshold: prod.lowStockThreshold ?? 5,
            stockStatus: prod.stockStatus || "instock",
            isCodAvailable: prod.isCodAvailable ?? true,
            productType: prod.productType || "physical",
            weight: prod.weight || "",
            weightUnit: prod.weightUnit || "g",
            length: prod.dimensions?.length || "",
            width: prod.dimensions?.width || "",
            height: prod.dimensions?.height || "",
            dimensionUnit: prod.dimensions?.unit || "cm",
            purchaseNote: prod.purchaseNote || "",
            enableReviews: prod.enableReviews ?? true,
            showSizeChart: prod.showSizeChart ?? false,
            status: prod.status || "published",
            metaTitle: prod.seo?.metaTitle || "",
            metaDescription: prod.seo?.metaDescription || "",
            keywords: Array.isArray(prod.seo?.keywords) ? prod.seo.keywords.join(", ") : prod.seo?.keywords || "",
            canonicalUrl: prod.seo?.canonicalUrl || "",
          });

          if (prod.images && prod.images.length > 0) {
            setMainImages(
              prod.images.map((img) => {
                const u = typeof img === "string" ? img : img?.url || img;
                return {
                  id: Math.random().toString(36).substring(2, 9),
                  url: u,
                  preview: u,
                  isUrl: true,
                  filter: "normal",
                };
              })
            );
          }

          if (prod.attributes && prod.attributes.length > 0) {
            const variantAttrKeys = new Set();
            (prod.variants || []).forEach((v) => {
              (v.dynamicAttributes || []).forEach((da) => {
                const k = da.key || da.name;
                if (k) variantAttrKeys.add(String(k).trim().toLowerCase());
              });
              if (v.attributes) {
                const raw =
                  typeof v.attributes.forEach === "function"
                    ? Object.fromEntries(v.attributes)
                    : v.attributes instanceof Map
                    ? Object.fromEntries(v.attributes)
                    : v.attributes._doc || v.attributes;
                if (raw && typeof raw === "object") {
                  Object.keys(raw).forEach((k) => variantAttrKeys.add(String(k).trim().toLowerCase()));
                }
              }
            });

            const filteredMainAttrs = prod.attributes
              .filter((attr) => {
                const name = (attr.name || attr.key || "").trim().toLowerCase();
                return !variantAttrKeys.has(name);
              })
              .map((attr) => ({
                name: attr.name || attr.key || "",
                options: Array.from(new Set(attr.options || attr.values || [])),
              }));

            setMainAttributes(filteredMainAttrs);
          }

          if (prod.variants && prod.variants.length > 0) {
            const productMainAttrs = prod.attributes || [];
            setVariantsList(
              prod.variants.map((v, i) => {
                const rawAttrs = {};

                // 1. Check existing attributes on v.attributes
                if (v.attributes) {
                  const raw =
                    typeof v.attributes.forEach === "function"
                      ? Object.fromEntries(v.attributes)
                      : v.attributes instanceof Map
                      ? Object.fromEntries(v.attributes)
                      : v.attributes._doc || v.attributes;

                  if (raw && typeof raw === "object") {
                    Object.entries(raw).forEach(([k, val]) => {
                      if (val) {
                        const targetKey = productMainAttrs.find((a) => (a.name || a.key || "").toLowerCase() === k.toLowerCase())?.name || k;
                        rawAttrs[targetKey] = Array.isArray(val) ? (val.length > 1 ? val.join(", ") : val[0]) : val;
                      }
                    });
                  }
                }

                // 2. Check existing dynamicAttributes array
                if (Array.isArray(v.dynamicAttributes)) {
                  v.dynamicAttributes.forEach((da) => {
                    const k = da.key || da.name;
                    const vals = da.values || da.options || (da.value ? [da.value] : []);
                    if (k && vals.length > 0) {
                      const targetKey = productMainAttrs.find((a) => (a.name || a.key || "").toLowerCase() === k.toLowerCase())?.name || k;
                      rawAttrs[targetKey] = vals.length > 1 ? vals.join(", ") : vals[0];
                    }
                  });
                }

                // 3. Search text sources: v.sku (prioritized) + v.name against product attributes
                if (Array.isArray(productMainAttrs) && productMainAttrs.length > 0) {
                  const skuText = (v.sku || "").toLowerCase();
                  const nameText = (v.name || "").toLowerCase();
                  const skuTokens = skuText.split(/[\s/\-,_.]+/).filter(Boolean);
                  const nameTokens = nameText.split(/[\s/\-,_.]+/).filter(Boolean);

                  productMainAttrs.forEach((attr) => {
                    const attrName = attr.name || attr.key;
                    if (!attrName) return;

                    const keyLower = attrName.toLowerCase();
                    const hasKey = Object.keys(rawAttrs).some((k) => k.toLowerCase() === keyLower);

                    if (!hasKey) {
                      const options = attr.options || attr.values || [];
                      // First check SKU tokens (authoritative for variant codes like SNIT-M-WHITE)
                      let foundOpt = options.find((opt) => {
                        const optLower = String(opt).trim().toLowerCase();
                        const optNoSpaces = optLower.replace(/\s+/g, "");
                        return skuTokens.some((t) => t === optLower || t === optNoSpaces);
                      });

                      // If not in SKU tokens, check name tokens or full SKU string
                      if (!foundOpt) {
                        foundOpt = options.find((opt) => {
                          const optLower = String(opt).trim().toLowerCase();
                          const optNoSpaces = optLower.replace(/\s+/g, "");
                          if (skuText.includes(optLower) || skuText.includes(optNoSpaces)) return true;
                          return nameTokens.some((t) => t === optLower || t === optNoSpaces);
                        });
                      }

                      if (foundOpt) {
                        rawAttrs[attrName] = foundOpt;
                      }
                    }
                  });
                }

                const dynamicAttrs = Object.entries(rawAttrs).map(([k, val]) => ({
                  key: k,
                  values: Array.isArray(val) ? val : [val],
                }));

                const vImgs = v.images
                  ? v.images.map((img) => {
                      const u = typeof img === "string" ? img : img?.url || img;
                      return {
                        id: Math.random().toString(36).substring(2, 9),
                        url: u,
                        preview: u,
                        isUrl: true,
                        filter: "normal",
                      };
                    })
                  : [];

                return {
                  id: v._id || Math.random().toString(36).substring(2, 9),
                  name: v.name || `Variant ${i + 1}`,
                  priceAmount: v.price?.amount || "",
                  stock: v.stock !== undefined ? v.stock : 10,
                  sku: v.sku || "",
                  dynamicAttributes: dynamicAttrs,
                  images: vImgs,
                };
              })
            );
          }

          if (prod.downloadableFiles && prod.downloadableFiles.length > 0) {
            setDownloadableFiles(prod.downloadableFiles);
          }

          if (prod.bulkDiscountRules && prod.bulkDiscountRules.length > 0) {
            setBulkDiscountRules(prod.bulkDiscountRules);
          }
        } catch (err) {
          console.error("Error prepopulating edit product form:", err);
        }
      });
    }
  }, [editId, handleFetchSingleProduct]);

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

  // Auto-calculate selling price when MRP or Discount changes
  const calculateSellingPrice = (mrp, discType, discVal) => {
    const p = Number(mrp);
    const d = Number(discVal);
    if (!p || p <= 0) return "";
    if (discVal === "" || d === 0) return String(p);

    if (discType === "percentage") {
      const calculated = p - (p * d) / 100;
      return calculated > 0 ? String(Math.round(calculated)) : "";
    } else {
      const calculated = p - d;
      return calculated > 0 ? String(Math.round(calculated)) : "";
    }
  };

  const handleMRPChange = (e) => {
    const val = e.target.value;
    const computedSelling = calculateSellingPrice(val, formData.discountType, formData.discountValue);
    setFormData((prev) => ({
      ...prev,
      maxPriceAmount: val,
      sellingPriceAmount: computedSelling !== "" ? computedSelling : val,
    }));
  };

  const handleDiscountTypeChange = (e) => {
    const type = e.target.value;
    const computedSelling = calculateSellingPrice(formData.maxPriceAmount, type, formData.discountValue);
    setFormData((prev) => ({
      ...prev,
      discountType: type,
      sellingPriceAmount: computedSelling !== "" ? computedSelling : prev.maxPriceAmount,
    }));
  };

  const handleDiscountValueChange = (e) => {
    const val = e.target.value;
    const computedSelling = calculateSellingPrice(formData.maxPriceAmount, formData.discountType, val);
    setFormData((prev) => ({
      ...prev,
      discountValue: val,
      sellingPriceAmount: computedSelling !== "" ? computedSelling : prev.maxPriceAmount,
    }));
  };

  const handleSellingPriceChange = (e) => {
    const val = e.target.value;
    const p = Number(formData.maxPriceAmount);
    const s = Number(val);
    let newDiscVal = formData.discountValue;

    if (p > 0 && val !== "") {
      if (s < p && s > 0) {
        const diff = p - s;
        if (formData.discountType === "percentage") {
          newDiscVal = String(Math.round((diff / p) * 100));
        } else {
          newDiscVal = String(Math.round(diff));
        }
      } else if (s >= p) {
        newDiscVal = "0";
      }
    }

    setFormData((prev) => ({
      ...prev,
      sellingPriceAmount: val,
      discountValue: newDiscVal,
    }));
  };

  // Subcategories Toggle Handler
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

  // Create or Update Category / Subcategory Submit Handler
  const handleCategoryFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newCatName.trim()) return;

    if (editingCatId) {
      const res = await handleUpdateCategory(editingCatId, { name: newCatName.trim() });
      if (res.success) {
        setEditingCatId(null);
        setNewCatName("");
        setShowCategoryModal(false);
      }
    } else {
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
    }
  };

  // Create or Update Brand Handler
  const handleBrandFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newBrandName.trim()) return;

    if (editingBrandId) {
      const res = await handleUpdateBrand(editingBrandId, { name: newBrandName.trim() });
      if (res.success) {
        setEditingBrandId(null);
        setNewBrandName("");
        setShowBrandModal(false);
      }
    } else {
      const res = await handleCreateBrand({ name: newBrandName.trim() });
      if (res.success && res.data) {
        setFormData((prev) => ({ ...prev, brand: res.data._id }));
        setNewBrandName("");
        setShowBrandModal(false);
      }
    }
  };

  // Create or Update Unit Handler
  const handleUnitFormSubmit = async (e) => {
    if (e) e.preventDefault();
    if (!newUnitName.trim() || !newUnitAbbr.trim()) return;

    if (editingUnitId) {
      const res = await handleUpdateUnit(editingUnitId, {
        name: newUnitName.trim(),
        abbreviation: newUnitAbbr.trim(),
      });
      if (res.success) {
        setEditingUnitId(null);
        setNewUnitName("");
        setNewUnitAbbr("");
        setShowUnitModal(false);
      }
    } else {
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

  // Auto-Generate Variant Matrix from Main Attributes
  const handleAutoGenerateVariants = () => {
    if (mainAttributes.length === 0) {
      openConfirmModal({
        title: "⚡ No Attributes Defined",
        description: "Please define at least 1 attribute with options above (e.g. Size: UK 6, UK 7 or Color: Red, Blue) before auto-generating variants.",
        confirmText: "Understood",
        showCancel: false,
        onConfirm: () => {},
      });
      return;
    }

    const cartesian = (arrays) =>
      arrays.reduce(
        (acc, curr) => acc.flatMap((d) => curr.map((e) => [...d, e])),
        [[]]
      );

    const attrArrays = mainAttributes.map((attr) => {
      const options = attr.options || attr.values || [];
      const key = attr.name || attr.key;
      return options.map((opt) => ({ key, value: opt }));
    });

    const combinations = cartesian(attrArrays);

    const generatedVariants = combinations.map((combo) => {
      const comboNameStr = combo.map((item) => item.value).join(" / ");
      const variantTitle = formData.title
        ? `${formData.title} - ${comboNameStr}`
        : comboNameStr;

      const dynamicAttributes = combo.map((item) => ({
        key: item.key,
        values: [item.value],
      }));

      const attributesMap = {};
      combo.forEach((item) => {
        attributesMap[item.key] = item.value;
      });

      const skuSlug = combo.map((item) => item.value.replace(/\s+/g, "").toUpperCase()).join("-");

      return {
        id: Math.random().toString(36).substring(2, 9),
        name: variantTitle,
        priceAmount: formData.sellingPriceAmount || formData.maxPriceAmount || "",
        stock: formData.stock !== "" && formData.stock !== undefined ? formData.stock : 10,
        sku: formData.title
          ? `${formData.title.substring(0, 4).toUpperCase()}-${skuSlug}`
          : `SKU-${skuSlug}`,
        dynamicAttributes,
        attributes: attributesMap,
        images: [],
      };
    });

    setVariantsList((prev) => {
      const existingNames = new Set(prev.map((v) => v.name));
      const newOnly = generatedVariants.filter((v) => !existingNames.has(v.name));
      return [...prev, ...newOnly];
    });
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
          const newAttributesObj = { ...(v.attributes || {}), [key.trim()]: value.trim() };
          return { ...v, dynamicAttributes: mergedAttrs, attributes: newAttributesObj };
        }
        return v;
      })
    );
  };

  const removeVariantAttribute = (variantId, attrIndex, targetKey) => {
    setVariantsList((prev) =>
      prev.map((v) => {
        if (v.id === variantId) {
          const updatedAttrs = (v.dynamicAttributes || []).filter((_, i) => i !== attrIndex);
          const updatedAttributesObj = { ...(v.attributes || {}) };
          if (targetKey) {
            delete updatedAttributesObj[targetKey];
            Object.keys(updatedAttributesObj).forEach((k) => {
              if (k.toLowerCase() === targetKey.toLowerCase()) {
                delete updatedAttributesObj[k];
              }
            });
          }
          return { ...v, dynamicAttributes: updatedAttrs, attributes: updatedAttributesObj };
        }
        return v;
      })
    );
  };

  // Helper to extract color attribute value from a variant object
  const getVariantColorValue = (variant) => {
    if (!variant) return null;

    // 1. Check dynamicAttributes array (e.g. [{ key: "Color", values: ["Green"] }])
    if (Array.isArray(variant.dynamicAttributes)) {
      const colorAttr = variant.dynamicAttributes.find((attr) =>
        (attr.key || "").toLowerCase().includes("color")
      );
      if (colorAttr && colorAttr.values?.length > 0) {
        return String(colorAttr.values[0]).trim().toLowerCase();
      }
    }

    // 2. Check attributes object or map
    if (variant.attributes) {
      const rawAttrs =
        variant.attributes instanceof Map
          ? Object.fromEntries(variant.attributes)
          : (variant.attributes._doc || variant.attributes);
      const colorEntry = Object.entries(rawAttrs).find(([k]) =>
        k.toLowerCase().includes("color")
      );
      if (colorEntry && colorEntry[1]) {
        const val = Array.isArray(colorEntry[1]) ? colorEntry[1][0] : colorEntry[1];
        return String(val).trim().toLowerCase();
      }
    }

    // 3. Fallback: Parse color from variant name (e.g., "Nike C1TY - Green / UK 6")
    if (variant.name && typeof variant.name === "string") {
      const nameParts = variant.name.split("-").map((p) => p.trim());
      if (nameParts.length > 1) {
        const attrString = nameParts[nameParts.length - 1];
        const subParts = attrString.split("/").map((s) => s.trim());
        if (subParts.length > 0) {
          return subParts[0].toLowerCase();
        }
      }
    }

    return null;
  };

  // Helper to extract the primary grouping attribute (Color or primary attribute) from a variant
  const getVariantGroupValue = (variant) => {
    if (!variant) return null;

    // 1. Color attribute priority
    const colorVal = getVariantColorValue(variant);
    if (colorVal) return `color:${colorVal}`;

    // 2. Check dynamicAttributes for primary attribute
    if (Array.isArray(variant.dynamicAttributes) && variant.dynamicAttributes.length > 0) {
      const primaryAttr = variant.dynamicAttributes[0];
      if (primaryAttr.key && primaryAttr.values?.length > 0) {
        return `${primaryAttr.key.toLowerCase()}:${String(primaryAttr.values[0]).toLowerCase()}`;
      }
    }

    // 3. Check attributes map/object
    if (variant.attributes) {
      const rawAttrs =
        variant.attributes instanceof Map
          ? Object.fromEntries(variant.attributes)
          : (variant.attributes._doc || variant.attributes);
      const entries = Object.entries(rawAttrs);
      if (entries.length > 0) {
        const [k, v] = entries[0];
        const val = Array.isArray(v) ? v[0] : v;
        return `${k.toLowerCase()}:${String(val).toLowerCase()}`;
      }
    }

    return null;
  };

  // Smart Variant Image Change Handler (Syncs images to sister variants sharing the same Color / Attribute)
  const handleVariantImagesChange = (id, updaterOrImages) => {
    setVariantsList((prev) => {
      const targetVariant = prev.find((v) => v.id === id);
      if (!targetVariant) return prev;

      const currentImages = targetVariant.images || [];
      const updatedImages =
        typeof updaterOrImages === "function"
          ? updaterOrImages(currentImages)
          : updaterOrImages;

      const targetGroupKey = getVariantGroupValue(targetVariant);

      return prev.map((v) => {
        // Always update the target variant being edited
        if (v.id === id) {
          return { ...v, images: updatedImages };
        }

        // If target variant has a grouping attribute (e.g. Color: Green), sync images to sister variants sharing the exact same group value!
        if (targetGroupKey) {
          const sisterGroupKey = getVariantGroupValue(v);
          if (sisterGroupKey && sisterGroupKey === targetGroupKey) {
            return { ...v, images: updatedImages };
          }
        }

        return v;
      });
    });
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

  // Bulk Quantity Discount Handlers
  const handleAddBulkRule = () => {
    if (!bulkRuleMinQty || Number(bulkRuleMinQty) < 2 || !bulkRuleDiscValue || Number(bulkRuleDiscValue) <= 0) return;

    setBulkDiscountRules((prev) => [
      ...prev,
      {
        minQty: Number(bulkRuleMinQty),
        discType: bulkRuleDiscType,
        discValue: Number(bulkRuleDiscValue),
      },
    ].sort((a, b) => a.minQty - b.minQty));
    setBulkRuleMinQty("");
    setBulkRuleDiscValue("");
  };

  const removeBulkRule = (index) => {
    setBulkDiscountRules((prev) => prev.filter((_, i) => i !== index));
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

    if (finalStatus === "published" && mainImages.length === 0) {
      openConfirmModal({
        title: "📸 Image Required",
        description: "At least 1 product image is required to publish a product listing. Please upload or paste an image in the Media tab.",
        confirmText: "Go to Media Tab",
        showCancel: false,
        onConfirm: () => setActiveTab("media"),
      });
      return;
    }

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
    if (formData.sku) payload.append("sku", formData.sku);
    if (formData.purchaseNote) payload.append("purchaseNote", formData.purchaseNote);

    // Bulk Discount Rules
    if (bulkDiscountRules.length > 0) {
      payload.append("bulkDiscountRules", JSON.stringify(bulkDiscountRules));
    }

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

    // SEO Metadata
    if (formData.metaTitle) payload.append("seo[metaTitle]", formData.metaTitle);
    if (formData.metaDescription) payload.append("seo[metaDescription]", formData.metaDescription);
    if (formData.canonicalUrl) payload.append("seo[canonicalUrl]", formData.canonicalUrl);
    if (formData.keywords) {
      const kwArray = formData.keywords.split(",").map((k) => k.trim()).filter(Boolean);
      kwArray.forEach((kw, idx) => payload.append(`seo[keywords][${idx}]`, kw));
    }

    // Top-Level Main Product Attributes (isolated from variant card attributes)
    if (mainAttributes.length > 0) {
      mainAttributes.forEach((attr, idx) => {
        const name = attr.name || attr.key;
        if (!name) return;
        const options = Array.from(new Set(attr.options || attr.values || []));
        payload.append(`attributes[${idx}][name]`, name);
        options.forEach((opt, oIdx) => {
          payload.append(`attributes[${idx}][options][${oIdx}]`, opt);
        });
      });
    }

    // Custom Product Variants
    if (variantsList.length > 0) {
      const formattedVariants = await Promise.all(
        variantsList.map(async (v) => {
          const attrMap = { ...(v.attributes || {}) };
          const formattedDynamicAttrs = [];

          (v.dynamicAttributes || []).forEach((da) => {
            const k = da.key || da.name;
            const vals = da.values || da.options || (da.value ? [da.value] : []);
            if (k && vals.length > 0) {
              attrMap[k] = vals.length > 1 ? vals : vals[0];
              formattedDynamicAttrs.push({
                key: k,
                name: k,
                values: vals,
                options: vals,
              });
            }
          });

          // Infer missing attributes from variant name against mainAttributes
          if (mainAttributes.length > 0) {
            const vTokens = (v.name || "").toLowerCase().split(/[\s/\-,_]+/);
            mainAttributes.forEach((attr) => {
              const attrName = attr.name || attr.key;
              if (!attrName) return;
              const keyLower = attrName.toLowerCase();
              const hasKey = Object.keys(attrMap).some((k) => k.toLowerCase() === keyLower);

              if (!hasKey) {
                const options = attr.options || attr.values || [];
                const foundOpt = options.find((opt) => {
                  const optLower = String(opt).trim().toLowerCase();
                  const optWords = optLower.split(/\s+/).filter(Boolean);
                  if (optWords.length > 1) {
                    return optWords.every((w) => (v.name || "").toLowerCase().includes(w));
                  }
                  return vTokens.some((t) => t === optLower);
                });
                if (foundOpt) {
                  attrMap[attrName] = foundOpt;
                }
              }
            });
          }

          // Process variant images (both URL links & local file uploads)
          const processedImages = await Promise.all(
            (v.images || []).map(async (img) => {
              if (img.file && !img.isUrl) {
                try {
                  const reader = new FileReader();
                  const b64 = await new Promise((resolve) => {
                    reader.onload = () => resolve(reader.result);
                    reader.onerror = () => resolve(null);
                    reader.readAsDataURL(img.file);
                  });
                  if (b64) return { url: b64 };
                } catch (e) {
                  return null;
                }
              }
              const u = typeof img === "string" ? img : img.url || img.preview;
              return u ? { url: u } : null;
            })
          );

          return {
            name: v.name || formData.title,
            attributes: attrMap,
            dynamicAttributes: formattedDynamicAttrs,
            price: {
              amount: Number(v.priceAmount || formData.sellingPriceAmount || formData.maxPriceAmount),
              currency: formData.maxPriceCurrency,
            },
            stock: Number(v.stock),
            sku: v.sku,
            images: processedImages.filter(Boolean),
          };
        })
      );

      payload.append("variants", JSON.stringify(formattedVariants));
    }

    // Main Media Images
    const rawFiles = mainImages.filter((img) => !img.isUrl).map((img) => img.file);
    const rawUrls = mainImages.filter((img) => img.isUrl).map((img) => img.url);

    rawFiles.forEach((file) => payload.append("images", file));
    rawUrls.forEach((url) => payload.append("imageUrls", url));

    let res;
    if (editId) {
      res = await handleUpdateProduct(editId, payload);
    } else {
      res = await handleCreateProduct(payload);
    }

    if (res.success) {
      localStorage.removeItem(DRAFT_STORAGE_KEY);
      navigate("/seller/catalog");
    }
  };

  const selectedCategoryObj = categories.find((c) => c._id === formData.category);
  const parentCategories = categories.filter((c) => !c.parentCategory);

  const subcatsFromParent = selectedCategoryObj?.subcategories || [];
  const subcatsFromRef = categories.filter(
    (c) =>
      c.parentCategory &&
      (String(c.parentCategory._id || c.parentCategory) === String(formData.category))
  );

  const combinedSubcats = [...subcatsFromParent, ...subcatsFromRef];
  const availableSubcategories = combinedSubcats.filter(
    (sub, idx, self) =>
      self.findIndex((s) => String(s._id || s) === String(sub._id || sub)) === idx
  );

  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-300 selection:bg-accent selection:text-accent-content">
      {/* Top Header & Quick Actions */}
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-surface border border-border-theme p-6 sm:p-8 rounded-2xl shadow-sm">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-accent">
              {editId ? "✏️ Edit Product Mode" : "Product Listing Creator"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight mt-1">
              {editId ? `Edit Product: ${formData.title || "Untitled"}` : "Create New Product Listing"}
            </h1>
            <p className="text-xs sm:text-sm text-foreground/60 mt-1">
              {editId
                ? "Update product details, pricing, discount, attributes, and photos."
                : "Build a physical or digital product listing with variants, attributes, and photos."}
            </p>
          </div>

          <div className="flex flex-wrap items-center space-x-3 w-full sm:w-auto justify-end gap-y-2">
            {!editId && (
              <button
                type="button"
                onClick={handleClearAll}
                className="px-4 py-3 rounded-xl border border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-500 font-bold text-xs transition cursor-pointer"
              >
                🧹 Clear Form
              </button>
            )}
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "draft")}
              disabled={creating}
              className="px-5 py-3 rounded-xl border border-border-theme bg-surface hover:bg-background text-foreground font-bold text-xs transition cursor-pointer"
            >
              Save as Draft
            </button>
            <button
              type="button"
              onClick={(e) => handleSubmit(e, "published")}
              disabled={creating}
              className="px-6 py-3 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow-lg shadow-accent/20 hover:opacity-90 transition cursor-pointer"
            >
              {creating ? "Saving..." : editId ? "Update Product" : "🚀 Publish Product"}
            </button>
          </div>
        </div>

        {/* Form Navigation Tabs */}
        <ProductFormTabs activeTab={activeTab} setActiveTab={setActiveTab} />

        {/* Tab Contents */}
        <form className="space-y-8">
          {/* ═══════ TAB 1: GENERAL INFORMATION ═══════ */}
          {activeTab === "general" && (
            <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                📋 General Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <FormField label="Product Title" required error={formErrors.title}>
                  <input
                    type="text"
                    name="title"
                    value={formData.title}
                    onChange={handleChange}
                    placeholder="e.g. Nike Air Force 1 '07"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Category" required error={formErrors.category}>
                  <div className="flex gap-2">
                    <select
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                      className={selectClass}
                    >
                      <option value="">Select Category</option>
                      {parentCategories.map((cat) => (
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

                <FormField label="Brand / Designer">
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

              {/* Subcategory Selector */}
              {formData.category && (
                <div className="space-y-2 pt-2 border-t border-border-theme/50">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-foreground">
                      Subcategories (Select applicable tags for this product):
                    </label>
                    <button
                      type="button"
                      onClick={() => {
                        setIsSubcategoryModal(true);
                        setModalParentCat(formData.category);
                        setShowCategoryModal(true);
                      }}
                      className="text-xs font-bold text-accent hover:underline cursor-pointer"
                    >
                      + Create Subcategory
                    </button>
                  </div>

                  {availableSubcategories.length === 0 ? (
                    <p className="text-xs text-foreground/40 italic">
                      No subcategories defined for this category yet. Click "+ Create Subcategory" to add one.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {availableSubcategories.map((sub) => {
                        const isSelected = formData.subcategories?.includes(sub._id);
                        return (
                          <button
                            key={sub._id}
                            type="button"
                            onClick={() => toggleSubcategory(sub._id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                              isSelected
                                ? "bg-accent text-accent-content font-bold shadow-sm"
                                : "bg-background border border-border-theme text-foreground/70 hover:border-accent/50"
                            }`}
                          >
                            {isSelected ? "✓ " : "+ "}
                            {sub.name}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              <FormField label="Short Summary / Subtitle">
                <input
                  type="text"
                  name="shortDescription"
                  value={formData.shortDescription}
                  onChange={handleChange}
                  placeholder="e.g. Premium leather retro sneakers with air cushioning"
                  className={inputClass}
                />
              </FormField>

              <FormField label="Full Description" required error={formErrors.description}>
                <textarea
                  name="description"
                  rows={5}
                  value={formData.description}
                  onChange={handleChange}
                  placeholder="Detailed product story, features, specifications, washing instructions, etc."
                  className={`${inputClass} resize-y`}
                />
              </FormField>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormField label="SKU (Stock Keeping Unit)" helperText="Unique identifier for inventory tracking">
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="e.g. NK-AF1-WHT-42"
                    className={inputClass}
                  />
                </FormField>

                <FormField label="Search Tags (Comma separated)">
                  <input
                    type="text"
                    name="tags"
                    value={formData.tags}
                    onChange={handleChange}
                    placeholder="shoes, sneakers, footwear, nike, running, brown"
                    className={inputClass}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* ═══════ TAB 2: PRICING & STOCK ═══════ */}
          {activeTab === "pricing" && (
            <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                💰 Pricing & Inventory
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                <FormField label="MRP Price (Maximum ₹)" required error={formErrors.maxPriceAmount}>
                  <input
                    type="number"
                    name="maxPriceAmount"
                    value={formData.maxPriceAmount}
                    onChange={handleMRPChange}
                    placeholder="2999"
                    className={inputClass}
                    min={0}
                  />
                </FormField>

                <FormField
                  label="Selling Offer Price (₹)"
                  helperText={
                    formData.maxPriceAmount && formData.sellingPriceAmount && Number(formData.sellingPriceAmount) < Number(formData.maxPriceAmount) ? (
                      <span className="text-emerald-500 font-bold">
                        🔥 {Math.round(((Number(formData.maxPriceAmount) - Number(formData.sellingPriceAmount)) / Number(formData.maxPriceAmount)) * 100)}% OFF
                        {" "}(Save ₹{Number(formData.maxPriceAmount) - Number(formData.sellingPriceAmount)})
                      </span>
                    ) : "Set a price lower than MRP to show discount"
                  }
                >
                  <input
                    type="number"
                    name="sellingPriceAmount"
                    value={formData.sellingPriceAmount}
                    onChange={handleSellingPriceChange}
                    placeholder="1999"
                    className={inputClass}
                    min={0}
                  />
                </FormField>

                <FormField label="Discount Type">
                  <select
                    name="discountType"
                    value={formData.discountType}
                    onChange={handleDiscountTypeChange}
                    className={selectClass}
                  >
                    <option value="percentage">% Percentage Discount</option>
                    <option value="fixed">₹ Fixed Amount Discount</option>
                  </select>
                </FormField>

                <FormField label={formData.discountType === "percentage" ? "Discount Value (%)" : "Discount Amount (₹)"}>
                  <input
                    type="number"
                    name="discountValue"
                    value={formData.discountValue}
                    onChange={handleDiscountValueChange}
                    placeholder={formData.discountType === "percentage" ? "e.g. 15 for 15% OFF" : "e.g. 500 for ₹500 OFF"}
                    className={inputClass}
                    min={0}
                  />
                </FormField>

                <FormField label="Currency">
                  <select
                    name="maxPriceCurrency"
                    value={formData.maxPriceCurrency}
                    onChange={handleChange}
                    className={selectClass}
                  >
                    <option value="INR">₹ INR (Indian Rupee)</option>
                    <option value="USD">$ USD (US Dollar)</option>
                    <option value="EUR">€ EUR (Euro)</option>
                    <option value="AED">د.إ AED (Dirham)</option>
                  </select>
                </FormField>
              </div>

              {/* Inventory Section */}
              <div className="pt-4 border-t border-border-theme space-y-4">
                <h3 className="text-sm font-bold text-foreground">📦 Inventory Management</h3>

                <div className="flex items-center space-x-4 bg-background border border-border-theme rounded-xl p-4">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input
                      type="checkbox"
                      name="manageStock"
                      checked={formData.manageStock}
                      onChange={handleChange}
                      className="accent-accent w-4 h-4 cursor-pointer"
                    />
                    <span className="text-sm text-foreground font-medium">Enable Stock Management</span>
                  </label>
                  <span className="text-xs text-foreground/50">Track stock quantity and auto-update availability</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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

                  <FormField label="Low Stock Alert Threshold">
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
                      <option value="instock">✅ In Stock</option>
                      <option value="outofstock">❌ Out of Stock</option>
                      <option value="onbackorder">⏳ On Backorder</option>
                    </select>
                  </FormField>
                </div>
              </div>
            </div>
          )}

          {/* ═══════ TAB 3: DISCOUNTS ═══════ */}
          {activeTab === "discount" && (
            <div className="space-y-6">
              {/* SECTION 1: Quick Discount (Percentage or Flat) */}
              <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                  🏷️ Quick Discount — Percentage or Flat
                </h2>
                <p className="text-xs text-foreground/50">
                  Apply a simple discount to the MRP. The selling price will be calculated automatically.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                  <FormField label="MRP Price (₹)" helperText="Base Maximum Retail Price">
                    <input
                      type="number"
                      value={formData.maxPriceAmount}
                      onChange={handleMRPChange}
                      placeholder="2999"
                      className={inputClass}
                      min={0}
                    />
                  </FormField>

                  <FormField label="Discount Type">
                    <select
                      name="discountType"
                      value={formData.discountType}
                      onChange={handleDiscountTypeChange}
                      className={selectClass}
                    >
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="fixed">Flat Amount Off (₹)</option>
                    </select>
                  </FormField>

                  <FormField label={formData.discountType === "percentage" ? "Discount (%)" : "Flat Discount (₹)"}>
                    <input
                      type="number"
                      name="discountValue"
                      value={formData.discountValue}
                      onChange={handleDiscountValueChange}
                      placeholder={formData.discountType === "percentage" ? "20" : "500"}
                      className={inputClass}
                      min={0}
                      max={formData.discountType === "percentage" ? 100 : undefined}
                    />
                  </FormField>

                  <FormField label="Selling Price (₹)">
                    <input
                      type="number"
                      name="sellingPriceAmount"
                      value={formData.sellingPriceAmount}
                      onChange={handleChange}
                      placeholder="Auto-calculated"
                      className={inputClass}
                      min={0}
                    />
                  </FormField>
                </div>

                {/* Discount Preview Badge */}
                {formData.maxPriceAmount && formData.sellingPriceAmount && Number(formData.sellingPriceAmount) < Number(formData.maxPriceAmount) && (
                  <div className="bg-gradient-to-r from-emerald-500/10 to-accent/10 border border-emerald-500/30 rounded-xl p-4 flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <span className="text-2xl">🔥</span>
                      <div>
                        <p className="text-sm font-bold text-foreground">
                          <span className="line-through text-foreground/40 mr-2">₹{formData.maxPriceAmount}</span>
                          <span className="text-emerald-600 text-lg">₹{formData.sellingPriceAmount}</span>
                        </p>
                        <p className="text-xs text-foreground/60">
                          Customer saves ₹{Number(formData.maxPriceAmount) - Number(formData.sellingPriceAmount)}
                        </p>
                      </div>
                    </div>
                    <span className="px-4 py-2 bg-emerald-500 text-white font-extrabold text-sm rounded-xl shadow">
                      {Math.round(((Number(formData.maxPriceAmount) - Number(formData.sellingPriceAmount)) / Number(formData.maxPriceAmount)) * 100)}% OFF
                    </span>
                  </div>
                )}
              </div>

              {/* SECTION 2: Bulk Quantity Discount Rules */}
              <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                  📦 Bulk / Quantity Discount Rules
                </h2>
                <p className="text-xs text-foreground/50">
                  Offer tiered pricing when customers buy in larger quantities. e.g. "Buy 10+ items, get 10% off".
                </p>

                {/* Add Rule Form */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-background border border-border-theme p-4 rounded-xl">
                  <FormField label="Min Quantity">
                    <input
                      type="number"
                      value={bulkRuleMinQty}
                      onChange={(e) => setBulkRuleMinQty(e.target.value)}
                      placeholder="e.g. 10"
                      className={inputClass}
                      min={2}
                    />
                  </FormField>

                  <FormField label="Discount Type">
                    <select
                      value={bulkRuleDiscType}
                      onChange={(e) => setBulkRuleDiscType(e.target.value)}
                      className={selectClass}
                    >
                      <option value="percentage">Percentage (%)</option>
                      <option value="fixed">Flat Amount (₹)</option>
                    </select>
                  </FormField>

                  <FormField label={bulkRuleDiscType === "percentage" ? "Discount (%)" : "Flat Off (₹)"}>
                    <input
                      type="number"
                      value={bulkRuleDiscValue}
                      onChange={(e) => setBulkRuleDiscValue(e.target.value)}
                      placeholder={bulkRuleDiscType === "percentage" ? "10" : "100"}
                      className={inputClass}
                      min={0}
                    />
                  </FormField>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleAddBulkRule}
                      className="w-full px-4 py-3 rounded-xl bg-accent text-accent-content font-bold text-sm hover:opacity-90 transition cursor-pointer"
                    >
                      + Add Rule
                    </button>
                  </div>
                </div>

                {/* Rules List */}
                {bulkDiscountRules.length === 0 ? (
                  <div className="p-6 text-center bg-background border border-dashed border-border-theme rounded-2xl">
                    <p className="text-xs text-foreground/50">No bulk discount rules added yet.</p>
                    <p className="text-xs text-foreground/30 mt-1">Example: Buy 5+ → 5% OFF, Buy 10+ → 10% OFF, Buy 50+ → ₹200 OFF per item</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {bulkDiscountRules.map((rule, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between bg-background border border-border-theme rounded-xl px-5 py-3"
                      >
                        <div className="flex items-center space-x-4">
                          <span className="w-8 h-8 flex items-center justify-center bg-accent/10 text-accent font-bold text-xs rounded-lg">
                            {idx + 1}
                          </span>
                          <div>
                            <p className="text-sm font-bold text-foreground">
                              Buy <span className="text-accent">{rule.minQty}+</span> items
                            </p>
                            <p className="text-xs text-foreground/60">
                              Get{" "}
                              <span className="text-emerald-500 font-bold">
                                {rule.discType === "percentage" ? `${rule.discValue}% OFF` : `₹${rule.discValue} OFF`}
                              </span>{" "}
                              {rule.discType === "percentage" ? "per item" : "per item"}
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeBulkRule(idx)}
                          className="text-red-400 hover:text-red-600 font-bold text-sm cursor-pointer px-2 py-1"
                        >
                          ✕ Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ TAB 4: ATTRIBUTES & DYNAMIC VARIANTS ═══════ */}
          {activeTab === "variants" && (
            <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-8 shadow-sm">
              {/* SECTION 1: MAIN ATTRIBUTES */}
              <div>
                <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                  🔀 Main Product Attributes
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
                        <span className="text-xs font-bold text-accent uppercase">{attr.name || attr.key}:</span>
                        <span className="text-xs text-foreground/80 font-medium ml-2">
                          {(attr.options || attr.values || []).join(", ")}
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
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-bold text-foreground">
                      Product Variants & Inventory Stock
                    </h2>
                    <p className="text-xs text-foreground/60">
                      Manage individual stock, prices, SKUs, and photos for each size/color variant combination.
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {mainAttributes.length > 0 && (
                      <button
                        type="button"
                        onClick={handleAutoGenerateVariants}
                        className="px-4 py-2.5 rounded-xl bg-accent/20 border border-accent/40 text-accent font-bold text-xs hover:bg-accent hover:text-accent-content transition cursor-pointer flex items-center gap-1.5"
                      >
                        ⚡ Auto-Generate Variants
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={handleAddCustomVariant}
                      className="px-4 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs shadow hover:opacity-90 transition cursor-pointer"
                    >
                      + Add Variant Card
                    </button>
                  </div>
                </div>

                {variantsList.length === 0 ? (
                  <div className="p-8 text-center bg-background border border-border-theme rounded-2xl">
                    <p className="text-xs text-foreground/60">
                      No custom variants created yet. Click "+ Add Variant Card" to define variant combinations.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    {variantsList.map((vItem, vIdx) => (
                      <VariantItemCard
                        key={vItem.id}
                        variant={vItem}
                        vIdx={vIdx}
                        handleVariantChange={handleVariantChange}
                        handleAddVariantAttribute={handleAddVariantAttribute}
                        removeVariantAttribute={removeVariantAttribute}
                        handleVariantImagesChange={handleVariantImagesChange}
                        removeVariant={removeVariant}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ═══════ TAB 5: SHIPPING & OPTIONS ═══════ */}
          {activeTab === "shipping" && (
            <div className="space-y-6">
              {/* Product Type Toggle */}
              <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                  📦 Product Type
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { value: "physical", label: "Physical Product", desc: "Shipped to the customer", icon: "🚚" },
                    { value: "downloadable", label: "Digital / Downloadable", desc: "Delivered via download link", icon: "💾" },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => setFormData((prev) => ({ ...prev, productType: opt.value }))}
                      className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer ${
                        formData.productType === opt.value
                          ? "border-accent bg-accent/5 shadow-lg shadow-accent/10"
                          : "border-border-theme bg-background hover:border-accent/40"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className="text-2xl">{opt.icon}</span>
                        <div>
                          <p className="text-sm font-bold text-foreground">{opt.label}</p>
                          <p className="text-xs text-foreground/50">{opt.desc}</p>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Physical Product: Weight & Dimensions */}
              {formData.productType === "physical" && (
                <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                    ⚖️ Weight & Dimensions
                  </h2>
                  <p className="text-xs text-foreground/50">
                    Used for shipping cost calculations by logistics partners.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <FormField label="Product Weight">
                      <div className="flex gap-2">
                        <input
                          type="number"
                          name="weight"
                          value={formData.weight}
                          onChange={handleChange}
                          placeholder="e.g. 350"
                          className={inputClass}
                          min={0}
                          step="0.01"
                        />
                        <select
                          name="weightUnit"
                          value={formData.weightUnit}
                          onChange={handleChange}
                          className={`${selectClass} max-w-[100px]`}
                        >
                          <option value="g">g</option>
                          <option value="kg">kg</option>
                          <option value="lb">lb</option>
                          <option value="oz">oz</option>
                        </select>
                      </div>
                    </FormField>

                    <FormField label="Dimension Unit">
                      <select
                        name="dimensionUnit"
                        value={formData.dimensionUnit}
                        onChange={handleChange}
                        className={selectClass}
                      >
                        <option value="cm">Centimeters (cm)</option>
                        <option value="in">Inches (in)</option>
                      </select>
                    </FormField>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField label={`Length (${formData.dimensionUnit})`}>
                      <input
                        type="number"
                        name="length"
                        value={formData.length}
                        onChange={handleChange}
                        placeholder="30"
                        className={inputClass}
                        min={0}
                        step="0.1"
                      />
                    </FormField>
                    <FormField label={`Width (${formData.dimensionUnit})`}>
                      <input
                        type="number"
                        name="width"
                        value={formData.width}
                        onChange={handleChange}
                        placeholder="20"
                        className={inputClass}
                        min={0}
                        step="0.1"
                      />
                    </FormField>
                    <FormField label={`Height (${formData.dimensionUnit})`}>
                      <input
                        type="number"
                        name="height"
                        value={formData.height}
                        onChange={handleChange}
                        placeholder="10"
                        className={inputClass}
                        min={0}
                        step="0.1"
                      />
                    </FormField>
                  </div>
                </div>
              )}

              {/* Digital Product: Downloadable Files */}
              {formData.productType === "downloadable" && (
                <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                  <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                    💾 Downloadable Files
                  </h2>
                  <p className="text-xs text-foreground/50">
                    Attach digital files that buyers can download after purchase.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-background border border-border-theme p-4 rounded-xl">
                    <FormField label="File Name">
                      <input
                        type="text"
                        value={digitalFileName}
                        onChange={(e) => setDigitalFileName(e.target.value)}
                        placeholder="e.g. eBook.pdf"
                        className={inputClass}
                      />
                    </FormField>
                    <FormField label="File URL">
                      <input
                        type="url"
                        value={digitalFileUrl}
                        onChange={(e) => setDigitalFileUrl(e.target.value)}
                        placeholder="https://..."
                        className={inputClass}
                      />
                    </FormField>
                    <FormField label="Download Limit" helperText="Leave empty = unlimited">
                      <input
                        type="number"
                        value={downloadLimit}
                        onChange={(e) => setDownloadLimit(e.target.value)}
                        placeholder="∞"
                        className={inputClass}
                        min={1}
                      />
                    </FormField>
                    <FormField label="Expiry (Days)" helperText="Leave empty = never">
                      <input
                        type="number"
                        value={expiryDays}
                        onChange={(e) => setExpiryDays(e.target.value)}
                        placeholder="∞"
                        className={inputClass}
                        min={1}
                      />
                    </FormField>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddDigitalFile}
                    className="px-5 py-3 rounded-xl bg-accent text-accent-content font-bold text-sm hover:opacity-90 transition cursor-pointer"
                  >
                    + Add File
                  </button>

                  {downloadableFiles.length > 0 && (
                    <div className="space-y-2 pt-2">
                      {downloadableFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-background border border-border-theme rounded-xl px-4 py-3"
                        >
                          <div>
                            <p className="text-sm font-bold text-foreground">💾 {file.name}</p>
                            <p className="text-xs text-foreground/50 truncate max-w-md">{file.url}</p>
                            <p className="text-xs text-foreground/40">
                              Downloads: {file.downloadLimit || "Unlimited"} · Expires: {file.expiryDays ? `${file.expiryDays} days` : "Never"}
                            </p>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeDigitalFile(idx)}
                            className="text-red-400 hover:text-red-600 font-bold text-xs cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Product Page Options */}
              <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                  ⚙️ Product Page Options
                </h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  {[
                    { name: "isCodAvailable", label: "Cash on Delivery", desc: "Allow COD payment for this product", icon: "💵" },
                    { name: "enableReviews", label: "Customer Reviews", desc: "Allow customers to leave reviews", icon: "⭐" },
                    { name: "showSizeChart", label: "Size Chart", desc: "Show size chart on product page", icon: "📏" },
                  ].map((opt) => (
                    <label
                      key={opt.name}
                      className={`flex items-start space-x-3 p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        formData[opt.name]
                          ? "border-accent bg-accent/5"
                          : "border-border-theme bg-background hover:border-accent/40"
                      }`}
                    >
                      <input
                        type="checkbox"
                        name={opt.name}
                        checked={formData[opt.name]}
                        onChange={handleChange}
                        className="accent-accent w-4 h-4 mt-1 cursor-pointer"
                      />
                      <div>
                        <p className="text-sm font-bold text-foreground">{opt.icon} {opt.label}</p>
                        <p className="text-xs text-foreground/50">{opt.desc}</p>
                      </div>
                    </label>
                  ))}
                </div>

                <FormField label="Purchase Note" helperText="Shown to customers after purchase (e.g. 'Wash before first use')">
                  <textarea
                    name="purchaseNote"
                    rows={3}
                    value={formData.purchaseNote}
                    onChange={handleChange}
                    placeholder="e.g. Handle with care. Wash before first use."
                    className={`${inputClass} resize-y`}
                  />
                </FormField>
              </div>
            </div>
          )}

          {/* ═══════ TAB 6: MEDIA & PHOTOS ═══════ */}
          {activeTab === "media" && (
            <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
              <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                🖼️ Primary Product Photo Gallery
              </h2>
              <p className="text-xs text-foreground/50">
                Upload up to 7 product images. Drag & drop, paste from clipboard, or enter image URLs.
              </p>
              <ImageDropzone images={mainImages} setImages={setMainImages} maxImages={7} />
            </div>
          )}

          {/* ═══════ TAB 7: SEO & SOCIAL ═══════ */}
          {activeTab === "seo" && (
            <div className="space-y-6">
              <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
                <h2 className="text-lg font-bold text-foreground border-b border-border-theme pb-3">
                  🔍 Search Engine Optimization (SEO) & Social Meta Tags
                </h2>
                <p className="text-xs text-foreground/50">
                  Optimize how this product listing appears in Google Search results and social media shares.
                </p>

                <div className="space-y-4">
                  <FormField label="Meta Title" helperText="Recommended length: 50-60 characters">
                    <input
                      type="text"
                      name="metaTitle"
                      value={formData.metaTitle}
                      onChange={handleChange}
                      placeholder={formData.title ? `${formData.title} | Official ScapeGoat Store` : "Product Meta Title"}
                      className={inputClass}
                      maxLength={70}
                    />
                  </FormField>

                  <FormField label="Meta Description" helperText="Recommended length: 150-160 characters">
                    <textarea
                      name="metaDescription"
                      rows={3}
                      value={formData.metaDescription}
                      onChange={handleChange}
                      placeholder={formData.shortDescription || formData.description?.substring(0, 150) || "Comprehensive description for search engines."}
                      className={`${inputClass} resize-y`}
                      maxLength={200}
                    />
                  </FormField>

                  <FormField label="Canonical URL (Optional)" helperText="Use if this product page is duplicated across multiple URLs">
                    <input
                      type="url"
                      name="canonicalUrl"
                      value={formData.canonicalUrl}
                      onChange={handleChange}
                      placeholder="https://scapegoat.com/product/nike-c1ty"
                      className={inputClass}
                    />
                  </FormField>
                </div>

                {/* Live Google Search Results Snippet Preview */}
                <div className="pt-4 border-t border-border-theme">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/60 mb-3">
                    🌐 Google Search Result Snippet Preview
                  </h3>
                  <div className="bg-background border border-border-theme p-4 rounded-xl space-y-1 font-sans">
                    <div className="text-xs text-emerald-500 truncate flex items-center space-x-1">
                      <span>https://scapegoat.com › product › {formData.title ? formData.title.toLowerCase().replace(/\s+/g, "-") : "product-slug"}</span>
                    </div>
                    <div className="text-sm font-semibold text-blue-400 hover:underline cursor-pointer truncate">
                      {formData.metaTitle || formData.title || "Product Title - ScapeGoat Online Store"}
                    </div>
                    <div className="text-xs text-foreground/70 line-clamp-2">
                      {formData.metaDescription || formData.shortDescription || formData.description?.substring(0, 150) || "Discover premium products on ScapeGoat with express shipping and secure checkout."}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </form>
      </div>

      {/* Modal for Creating / Managing Category & Subcategory */}
      {showCategoryModal && (
        <Modal
          isOpen={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCatId(null);
            setNewCatName("");
          }}
          onSubmit={handleCategoryFormSubmit}
          title={
            editingCatId
              ? "Edit Category / Subcategory"
              : isSubcategoryModal
              ? "Create New Subcategory"
              : "Create New Category"
          }
          confirmText={
            editingCatId
              ? "Update Name"
              : isSubcategoryModal
              ? "Create Subcategory"
              : "Create Category"
          }
        >
          <div className="space-y-4">
            {isSubcategoryModal && !editingCatId && (
              <FormField label="Parent Category" required>
                <select
                  value={modalParentCat}
                  onChange={(e) => setModalParentCat(e.target.value)}
                  className={selectClass}
                >
                  <option value="">Select Parent Category</option>
                  {parentCategories.map((cat) => (
                    <option key={cat._id} value={cat._id}>
                      {cat.name}
                    </option>
                  ))}
                </select>
              </FormField>
            )}

            <FormField label={editingCatId ? "Update Name" : isSubcategoryModal ? "Subcategory Name" : "Category Name"} required>
              <input
                type="text"
                placeholder={isSubcategoryModal ? "Subcategory Name (e.g. Graphic Tees)" : "Category Name (e.g. Clothing)"}
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </FormField>

            {/* Manager List: Edit & Delete Existing Categories */}
            {categories.length > 0 && (
              <div className="pt-4 border-t border-border-theme space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider block">
                  Manage Existing Categories ({categories.length})
                </label>
                <div className="space-y-1.5">
                  {categories.map((cat) => (
                    <div
                      key={cat._id}
                      className="flex items-center justify-between bg-background/60 border border-border-theme/40 rounded-xl px-3 py-1.5 text-xs"
                    >
                      <div>
                        <span className="font-semibold text-foreground">{cat.name}</span>
                        {cat.parentCategory && (
                          <span className="ml-1.5 text-[10px] text-accent bg-accent/10 px-1.5 py-0.5 rounded-md font-bold">
                            Subcategory
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCatId(cat._id);
                            setNewCatName(cat.name);
                          }}
                          className="text-accent hover:underline text-[11px] font-bold cursor-pointer"
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
                          className="text-red-400 hover:text-red-600 text-[11px] font-bold cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal for Creating / Managing Brand */}
      {showBrandModal && (
        <Modal
          isOpen={showBrandModal}
          onClose={() => {
            setShowBrandModal(false);
            setEditingBrandId(null);
            setNewBrandName("");
          }}
          onSubmit={handleBrandFormSubmit}
          title={editingBrandId ? "Edit Brand" : "Create New Brand"}
          confirmText={editingBrandId ? "Update Brand" : "Create Brand"}
        >
          <div className="space-y-4">
            <FormField label="Brand Name" required>
              <input
                type="text"
                placeholder="Brand Name (e.g. Nike, Zara, Apple)"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </FormField>

            {/* Manager List: Edit & Delete Existing Brands */}
            {brands.length > 0 && (
              <div className="pt-4 border-t border-border-theme space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider block">
                  Manage Existing Brands ({brands.length})
                </label>
                <div className="space-y-1.5">
                  {brands.map((b) => (
                    <div
                      key={b._id}
                      className="flex items-center justify-between bg-background/60 border border-border-theme/40 rounded-xl px-3 py-1.5 text-xs"
                    >
                      <span className="font-semibold text-foreground">{b.name}</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingBrandId(b._id);
                            setNewBrandName(b.name);
                          }}
                          className="text-accent hover:underline text-[11px] font-bold cursor-pointer"
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
                          className="text-red-400 hover:text-red-600 text-[11px] font-bold cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Modal for Creating / Managing Unit */}
      {showUnitModal && (
        <Modal
          isOpen={showUnitModal}
          onClose={() => {
            setShowUnitModal(false);
            setEditingUnitId(null);
            setNewUnitName("");
            setNewUnitAbbr("");
          }}
          onSubmit={handleUnitFormSubmit}
          title={editingUnitId ? "Edit Unit of Measurement" : "Create Unit of Measurement"}
          confirmText={editingUnitId ? "Update Unit" : "Create Unit"}
        >
          <div className="space-y-4">
            <FormField label="Unit Name" required>
              <input
                type="text"
                placeholder="Unit Name (e.g. Pieces, Kilograms)"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </FormField>
            <FormField label="Abbreviation" required>
              <input
                type="text"
                placeholder="Abbreviation (e.g. pcs, kg, dz)"
                value={newUnitAbbr}
                onChange={(e) => setNewUnitAbbr(e.target.value)}
                className={inputClass}
              />
            </FormField>

            {/* Manager List: Edit & Delete Existing Units */}
            {units.length > 0 && (
              <div className="pt-4 border-t border-border-theme space-y-2 max-h-48 overflow-y-auto scrollbar-thin">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider block">
                  Manage Existing Units ({units.length})
                </label>
                <div className="space-y-1.5">
                  {units.map((u) => (
                    <div
                      key={u._id}
                      className="flex items-center justify-between bg-background/60 border border-border-theme/40 rounded-xl px-3 py-1.5 text-xs"
                    >
                      <span className="font-semibold text-foreground">{u.name} ({u.abbreviation})</span>
                      <div className="flex items-center space-x-2">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingUnitId(u._id);
                            setNewUnitName(u.name);
                            setNewUnitAbbr(u.abbreviation || "");
                          }}
                          className="text-accent hover:underline text-[11px] font-bold cursor-pointer"
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
                          className="text-red-400 hover:text-red-600 text-[11px] font-bold cursor-pointer"
                        >
                          🗑️ Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Reusable Confirmation / Alert Modal */}
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

export default CreateProduct;
