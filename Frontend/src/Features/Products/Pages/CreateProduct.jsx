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
import LiveProductPreview from "../Components/LiveProductPreview";
import ProductHistoryTimeline from "../Components/ProductHistoryTimeline";
import Modal from "../../../Components/Modal";
import { mergeAttributeItem, normalizeAttributesArray } from "../../../utils/attributeUtils";
import { generateEAN13Barcode, generateCode128Barcode } from "../../../utils/barcodeUtils";
import { suggestProductDescriptionApi } from "../Services/product.api";
import RichTextEditor from "../Components/RichTextEditor";
import { useDispatch } from "react-redux";
import { addToast } from "../../../utils/toast.slice";

const inputClass =
  "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-all duration-300 focus:ring-4 focus:ring-accent/10 placeholder:text-foreground/25 font-medium";

const selectClass =
  "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-all duration-300 focus:ring-4 focus:ring-accent/10 cursor-pointer font-medium";

const CreateProduct = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { id: routeId } = useParams();
  const [searchParams] = useSearchParams();
  const editId = routeId || searchParams.get("edit");
  const duplicateId = searchParams.get("duplicate");

  const { creating, handleCreateProduct, handleFetchSingleProduct, handleUpdateProduct } = useProduct();
  const { categories, handleFetchCategories, handleCreateCategory, handleUpdateCategory, handleDeleteCategory } = useCategory();
  const { brands, handleFetchBrands, handleCreateBrand, handleUpdateBrand, handleDeleteBrand } = useBrand();
  const { units, handleFetchUnits, handleCreateUnit, handleUpdateUnit, handleDeleteUnit } = useUnit();

  const [activeTab, setActiveTab] = useState("general");
  const [mainImages, setMainImages] = useState([]);
  const [galleryImages, setGalleryImages] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Reusable Modal State
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

  // Category, Brand, Unit Modals State
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCatId, setEditingCatId] = useState(null);
  const [newCatName, setNewCatName] = useState("");
  const [isSubcategoryModal, setIsSubcategoryModal] = useState(false);
  const [modalParentCat, setModalParentCat] = useState("");

  const [showBrandModal, setShowBrandModal] = useState(false);
  const [editingBrandId, setEditingBrandId] = useState(null);
  const [newBrandName, setNewBrandName] = useState("");

  const [showUnitModal, setShowUnitModal] = useState(false);
  const [editingUnitId, setEditingUnitId] = useState(null);
  const [newUnitName, setNewUnitName] = useState("");
  const [newUnitAbbr, setNewUnitAbbr] = useState("");

  // Product Attributes (Source of Truth)
  const [mainAttrName, setMainAttrName] = useState("");
  const [mainAttrValues, setMainAttrValues] = useState("");
  const [mainAttributes, setMainAttributes] = useState([]);

  // Product Variants List
  const [variantsList, setVariantsList] = useState([]);

  // Strategy States (Only used when variantsList.length > 0)
  const [pricingStrategy, setPricingStrategy] = useState("same_product"); // 'same_product' | 'same_attribute' | 'different_variant'
  const [pricingSelectedAttr, setPricingSelectedAttr] = useState("");
  const [attributePriceMap, setAttributePriceMap] = useState({});

  const [inventoryStrategy, setInventoryStrategy] = useState("shared_product"); // 'shared_product' | 'shared_attribute' | 'different_variant'
  const [inventorySelectedAttr, setInventorySelectedAttr] = useState("");
  const [attributeStockMap, setAttributeStockMap] = useState({});

  // History & Timeline Audit Logs
  const [historyLogs, setHistoryLogs] = useState([]);
  const [inventoryTimeline, setInventoryTimeline] = useState([]);

  // Scheduled Publish Date & AI Catalog Suggestion State
  const [scheduledPublishDate, setScheduledPublishDate] = useState("");
  const [aiSuggestion, setAiSuggestion] = useState("");
  const [matchedCatalogTitle, setMatchedCatalogTitle] = useState("");
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Bulk Quantity Discounts State
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
    barcode: "",
    maxPriceAmount: "",
    maxPriceCurrency: "INR",
    sellingPriceAmount: "",
    costPriceAmount: "",
    discountType: "percentage",
    discountValue: "",
    stock: 10,
    manageStock: true,
    lowStockThreshold: 5,
    stockStatus: "instock",
    isCodAvailable: true,
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
    canonicalUrl: "",
  };

  const [formData, setFormData] = useState(initialFormData);

  // Fetch Categories, Brands & Units on Mount
  useEffect(() => {
    handleFetchCategories();
    handleFetchBrands();
    handleFetchUnits();
  }, [handleFetchCategories, handleFetchBrands, handleFetchUnits]);

  // Log Audit Action
  const logAuditAction = (action, details, oldValue = null, newValue = null) => {
    const newLog = {
      user: "Seller",
      action,
      details,
      oldValue,
      newValue,
      timestamp: new Date().toISOString(),
    };
    setHistoryLogs((prev) => [newLog, ...prev]);
  };

  // Log Inventory Movement
  const logInventoryMovement = (type, change, variantName = "Main Product", reason = "") => {
    const newMovement = {
      type,
      change,
      variantName,
      reason,
      timestamp: new Date().toISOString(),
    };
    setInventoryTimeline((prev) => [newMovement, ...prev]);
  };

  // Auto SKU Generator
  const handleAutoGenerateSku = () => {
    const code = generateCode128Barcode(formData.title ? formData.title.substring(0, 3) : "SG");
    setFormData((prev) => ({ ...prev, sku: code }));
    logAuditAction("Auto SKU", `Generated SKU ${code}`);
  };

  // Auto Barcode Generator for Main Product
  const handleGenerateMainBarcode = () => {
    const code = generateEAN13Barcode();
    setFormData((prev) => ({ ...prev, barcode: code }));
    logAuditAction("Barcode Generated", `Generated barcode ${code}`);
  };

  const [fetchingEditProduct, setFetchingEditProduct] = useState(false);

  // Prepopulate form if in Edit or Duplicate Mode
  useEffect(() => {
    const targetId = editId || duplicateId;
    if (targetId) {
      setFetchingEditProduct(true);
      handleFetchSingleProduct(targetId)
        .then((prod) => {
          setFetchingEditProduct(false);
          if (!prod) return;
          try {
          const maxP = prod.maxPrice?.amount || "";
          const sellP = prod.sellingPrice?.amount || "";
          let discVal = "";
          if (maxP && sellP && Number(sellP) < Number(maxP)) {
            const diff = Number(maxP) - Number(sellP);
            discVal = Math.round((diff / Number(maxP)) * 100);
          }

          setFormData({
            title: duplicateId ? `${prod.title} (Copy)` : prod.title || "",
            shortDescription: prod.shortDescription || "",
            description: prod.description || "",
            category: prod.category?._id || prod.category || "",
            subcategories: (prod.subcategories || []).map((sc) => sc._id || sc),
            brand: prod.brand?._id || prod.brand || "",
            unit: prod.unit?._id || prod.unit || "",
            tags: Array.isArray(prod.tags) ? prod.tags.join(", ") : prod.tags || "",
            sku: duplicateId ? `${prod.sku || "SG"}-COPY` : prod.sku || "",
            barcode: prod.barcode || "",
            maxPriceAmount: maxP,
            maxPriceCurrency: "INR",
            sellingPriceAmount: sellP,
            costPriceAmount: prod.costPrice?.amount ? String(prod.costPrice.amount) : "",
            discountType: "percentage",
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
            status: duplicateId ? "draft" : prod.status || "published",
            metaTitle: prod.seo?.metaTitle || "",
            metaDescription: prod.seo?.metaDescription || "",
            canonicalUrl: prod.seo?.canonicalUrl || "",
          });

          if (prod.images && prod.images.length > 0) {
            const parsed = prod.images.map((img) => ({
              id: Math.random().toString(36).substring(2, 9),
              url: typeof img === "string" ? img : img?.url || img,
              preview: typeof img === "string" ? img : img?.url || img,
              isUrl: true,
            }));
            setMainImages(parsed.slice(0, 1));
            setGalleryImages(parsed.slice(1));
          }

          if (prod.attributes && prod.attributes.length > 0) {
            setMainAttributes(
              prod.attributes.map((attr) => ({
                name: attr.name || attr.key || "",
                options: Array.from(new Set(attr.options || attr.values || [])),
              }))
            );
          }

          if (prod.variants && prod.variants.length > 0) {
            setVariantsList(
              prod.variants.map((v, i) => ({
                id: v._id || Math.random().toString(36).substring(2, 9),
                name: v.name || `Variation ${i + 1}`,
                priceAmount: v.price?.amount || "",
                stock: v.stock !== undefined ? v.stock : 10,
                sku: v.sku || "",
                barcode: v.barcode || "",
                attributes: v.attributes || {},
                images: (v.images || []).map((img) => ({
                  id: Math.random().toString(36).substring(2, 9),
                  url: typeof img === "string" ? img : img?.url || img,
                  preview: typeof img === "string" ? img : img?.url || img,
                  isUrl: true,
                })),
              }))
            );
          }
          if (prod.bulkDiscountRules && Array.isArray(prod.bulkDiscountRules) && prod.bulkDiscountRules.length > 0) {
            setBulkDiscountRules(prod.bulkDiscountRules);
          }
        } catch (err) {
          console.error("Error prepopulating product form:", err);
        }
      }).catch((err) => {
        console.error("Failed to fetch product for editing:", err);
        setFetchingEditProduct(false);
      });
    }
  }, [editId, duplicateId, handleFetchSingleProduct]);

  // ── Apply Pricing / Inventory Strategy immediately when changed ──
  useEffect(() => {
    if (variantsList.length === 0) return;

    setVariantsList((prev) => {
      return prev.map((v) => {
        let updated = { ...v };

        // Pricing
        if (pricingStrategy === "same_product") {
          const basePrice = formData.sellingPriceAmount || formData.maxPriceAmount;
          if (basePrice) updated.priceAmount = basePrice;
        } else if (pricingStrategy === "same_attribute") {
          const rawAttrs = v.attributes || {};
          const targetKey = pricingSelectedAttr || mainAttributes[0]?.name || mainAttributes[0]?.key || Object.keys(rawAttrs)[0];
          const targetVal = targetKey ? rawAttrs[targetKey] : null;
          if (targetVal) {
            const groupLeader = prev.find((other) => {
              const oAttrs = other.attributes || {};
              return oAttrs[targetKey] === targetVal && other.priceAmount;
            });
            if (groupLeader && groupLeader.id !== v.id) {
              updated.priceAmount = groupLeader.priceAmount;
            }
          }
        }

        // Inventory
        if (inventoryStrategy === "shared_product") {
          const baseStock = prev[0]?.stock ?? 10;
          updated.stock = baseStock;
        } else if (inventoryStrategy === "shared_attribute") {
          const rawAttrs = v.attributes || {};
          const targetKey = inventorySelectedAttr || mainAttributes[0]?.name || mainAttributes[0]?.key || Object.keys(rawAttrs)[0];
          const targetVal = targetKey ? rawAttrs[targetKey] : null;
          if (targetVal) {
            const groupLeader = prev.find((other) => {
              const oAttrs = other.attributes || {};
              return oAttrs[targetKey] === targetVal && other.stock !== undefined;
            });
            if (groupLeader && groupLeader.id !== v.id) {
              updated.stock = groupLeader.stock;
            }
          }
        }

        return updated;
      });
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pricingStrategy, pricingSelectedAttr, inventoryStrategy, inventorySelectedAttr]);

  // Form Field Change Handler
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

  // Price Calculation Handlers
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

    if (pricingStrategy === "same_product" && variantsList.length > 0) {
      const targetPrice = computedSelling !== "" ? computedSelling : val;
      setVariantsList((prev) => prev.map((v) => ({ ...v, priceAmount: targetPrice })));
    }
  };

  const handleSellingPriceChange = (e) => {
    const val = e.target.value;
    const p = Number(formData.maxPriceAmount);
    const s = Number(val);
    let newDiscVal = formData.discountValue;

    if (p > 0 && val !== "") {
      if (s < p && s > 0) {
        const diff = p - s;
        newDiscVal = formData.discountType === "percentage" ? String(Math.round((diff / p) * 100)) : String(Math.round(diff));
      } else if (s >= p) {
        newDiscVal = "0";
      }
    }

    setFormData((prev) => ({
      ...prev,
      sellingPriceAmount: val,
      discountValue: newDiscVal,
    }));

    if (pricingStrategy === "same_product" && variantsList.length > 0) {
      setVariantsList((prev) => prev.map((v) => ({ ...v, priceAmount: val })));
    }
  };

  // Subcategories Toggle Handler
  const toggleSubcategory = (subCatId) => {
    setFormData((prev) => {
      const current = prev.subcategories || [];
      const exists = current.includes(subCatId);
      return { ...prev, subcategories: exists ? current.filter((id) => id !== subCatId) : [...current, subCatId] };
    });
  };

  // Main Attributes Handler
  const handleAddMainAttribute = (e) => {
    e.preventDefault();
    if (!mainAttrName.trim() || !mainAttrValues.trim()) return;

    const updatedAttrs = mergeAttributeItem(mainAttributes, mainAttrName, mainAttrValues);
    setMainAttributes(updatedAttrs);
    logAuditAction("Added Attribute", `Added attribute ${mainAttrName.trim()} with values ${mainAttrValues.trim()}`);
    setMainAttrName("");
    setMainAttrValues("");
  };

  const removeMainAttribute = (index) => {
    const target = mainAttributes[index];
    const updated = mainAttributes.filter((_, i) => i !== index);
    setMainAttributes(updated);
    logAuditAction("Removed Attribute", `Removed attribute ${target?.name}`);
  };

  // Explicit Button Action: Generate Variations from Main Product Attributes
  const handleGenerateVariationsClick = () => {
    if (!mainAttributes || mainAttributes.length === 0) {
      dispatch(addToast({ message: "Please define at least 1 Main Attribute before generating variations!", type: "warning" }));
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

    const generated = combinations.map((combo) => {
      const comboNameStr = combo.map((item) => item.value).join(" / ");
      const variantTitle = formData.title ? `${formData.title} - ${comboNameStr}` : comboNameStr;

      const attributesMap = {};
      combo.forEach((item) => {
        attributesMap[item.key] = item.value;
      });

      const skuSlug = combo.map((item) => item.value.replace(/\s+/g, "").toUpperCase()).join("-");
      const eanCode = generateEAN13Barcode();

      return {
        id: Math.random().toString(36).substring(2, 9),
        name: variantTitle,
        priceAmount: formData.sellingPriceAmount || formData.maxPriceAmount || "",
        stock: formData.stock !== "" && formData.stock !== undefined ? formData.stock : 10,
        sku: formData.title ? `${formData.title.substring(0, 4).toUpperCase()}-${skuSlug}` : `SKU-${skuSlug}`,
        barcode: eanCode,
        attributes: attributesMap,
        images: [],
      };
    });

    setVariantsList(generated);
    logAuditAction("Generated Variations", `Generated ${generated.length} variation combinations`);
    dispatch(addToast({ message: `🎉 Successfully generated ${generated.length} variations!`, type: "success" }));
  };

  // Apply Attribute-Specific Price Changes
  const handleApplyPriceForAttributeOption = (attrName, optionValue, priceVal) => {
    setAttributePriceMap((prev) => ({
      ...prev,
      [`${attrName}:${optionValue}`]: priceVal,
    }));

    setVariantsList((prev) =>
      prev.map((v) => {
        const raw = typeof v.attributes?.forEach === "function" ? Object.fromEntries(v.attributes) : v.attributes || {};
        const matches = raw[attrName] === optionValue;
        return matches ? { ...v, priceAmount: priceVal } : v;
      })
    );
  };

  // Apply Attribute-Specific Stock Changes
  const handleApplyStockForAttributeOption = (attrName, optionValue, stockVal) => {
    setAttributeStockMap((prev) => ({
      ...prev,
      [`${attrName}:${optionValue}`]: stockVal,
    }));

    setVariantsList((prev) =>
      prev.map((v) => {
        const raw = typeof v.attributes?.forEach === "function" ? Object.fromEntries(v.attributes) : v.attributes || {};
        const matches = raw[attrName] === optionValue;
        return matches ? { ...v, stock: stockVal } : v;
      })
    );
    logInventoryMovement("Manual Change", stockVal, `${attrName}: ${optionValue}`, `Set stock to ${stockVal}`);
  };

  // Variant Field Change Handler
  const handleVariantChange = (id, field, value) => {
    setVariantsList((prev) =>
      prev.map((v) => {
        if (v.id === id) {
          if (field === "stock") {
            const diff = Number(value) - Number(v.stock || 0);
            if (diff !== 0) {
              logInventoryMovement(diff > 0 ? "Restock" : "Manual Change", diff, v.name, "Individual variant stock update");
            }
          }
          return { ...v, [field]: value };
        }
        return v;
      })
    );
  };

  // Variant Photo Gallery Sync
  const handleVariantImagesChange = (id, updaterOrImages) => {
    setVariantsList((prev) => {
      const target = prev.find((v) => v.id === id);
      if (!target) return prev;

      const currentImages = target.images || [];
      const updatedImages = typeof updaterOrImages === "function" ? updaterOrImages(currentImages) : updaterOrImages;

      return prev.map((v) => (v.id === id ? { ...v, images: updatedImages } : v));
    });
  };

  const removeVariant = (id) => {
    setVariantsList((prev) => prev.filter((v) => v.id !== id));
  };

  // Add a blank new variant with first available attribute combo not already used
  const addNewVariant = () => {
    if (!mainAttributes || mainAttributes.length === 0) {
      dispatch(addToast({ message: "Please define Main Attributes first (under the Attributes tab).", type: "warning" }));
      return;
    }

    // Build all possible combos as { AttrName: optionValue } objects
    const cartesian = (arrays) =>
      arrays.reduce((acc, curr) => acc.flatMap((d) => curr.map((e) => ({ ...d, ...e }))), [{}]);

    const attrArrays = mainAttributes.map((attr) => {
      const key = attr.name || attr.key;
      const opts = attr.options || attr.values || [];
      return opts.map((opt) => ({ [key]: opt }));
    });

    const allCombos = cartesian(attrArrays);

    // Find a combo not already in variantsList
    const usedCombos = variantsList.map((v) => {
      const raw = typeof v.attributes?.forEach === "function" ? Object.fromEntries(v.attributes) : v.attributes || {};
      return JSON.stringify(Object.entries(raw).sort().map(([k, val]) => `${k.toLowerCase()}=${String(val).toLowerCase()}`));
    });

    const availableCombo = allCombos.find((combo) => {
      const comboKey = JSON.stringify(
        Object.entries(combo).sort().map(([k, val]) => `${k.toLowerCase()}=${String(val).toLowerCase()}`)
      );
      return !usedCombos.includes(comboKey);
    });

    if (!availableCombo) {
      dispatch(addToast({ message: "All possible variations already exist!", type: "info" }));
      return;
    }

    const comboNameStr = Object.values(availableCombo).join(" / ");
    const variantTitle = formData.title ? `${formData.title} - ${comboNameStr}` : comboNameStr;
    const skuSlug = Object.values(availableCombo).map((v) => v.replace(/\s+/g, "").toUpperCase()).join("-");

    setVariantsList((prev) => [
      ...prev,
      {
        id: Math.random().toString(36).substring(2, 9),
        name: variantTitle,
        priceAmount: formData.sellingPriceAmount || formData.maxPriceAmount || "",
        stock: 10,
        sku: formData.title ? `${formData.title.substring(0, 4).toUpperCase()}-${skuSlug}` : `SKU-${skuSlug}`,
        barcode: generateEAN13Barcode(),
        attributes: availableCombo,
        images: [],
      },
    ]);
  };

  // Bulk Variant Actions
  const handleBulkSetPrice = () => {
    const p = prompt("Enter price (₹) to set across ALL variations:");
    if (p && !isNaN(p)) {
      setVariantsList((prev) => prev.map((v) => ({ ...v, priceAmount: p })));
      logAuditAction("Bulk Action", `Set price ₹${p} across all variations`);
    }
  };

  const handleBulkSetStock = () => {
    const s = prompt("Enter stock quantity to set across ALL variations:");
    if (s && !isNaN(s)) {
      setVariantsList((prev) => prev.map((v) => ({ ...v, stock: Number(s) })));
      logInventoryMovement("Restock", Number(s), "All Variations", "Bulk stock update");
    }
  };

  const handleBulkGenerateBarcodes = () => {
    setVariantsList((prev) =>
      prev.map((v) => ({
        ...v,
        barcode: generateEAN13Barcode(),
      }))
    );
    logAuditAction("Bulk Action", "Generated EAN-13 barcodes for all variations");
  };

  // Bulk Discount Rules Handlers
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

  // Backend Catalog Description Suggestion Workflow
  const handleSuggestCatalogDescription = async () => {
    const title = formData.title.trim();
    if (!title) {
      dispatch(addToast({ message: "Please enter a Product Title first!", type: "warning" }));
      return;
    }

    setIsAiLoading(true);

    try {
      const selectedCatObj = categories.find((c) => c._id === formData.category);
      const res = await suggestProductDescriptionApi({
        title,
        category: selectedCatObj?.name || "",
        shortDescription: formData.shortDescription || "",
      });

      if (res.success && res.description) {
        setAiSuggestion(res.description);
        setMatchedCatalogTitle(res.matchedProductTitle || "Similar Catalog Product");
        logAuditAction("Description Match", `Found matched catalog description from "${res.matchedProductTitle}"`);
      } else {
        setAiSuggestion("");
        setMatchedCatalogTitle("");
        dispatch(addToast({ message: "No catalog description match found for this title/category in database.", type: "info" }));
      }
    } catch (err) {
      console.warn("Backend suggest description error:", err?.message);
      dispatch(addToast({ message: "Failed to search catalog description. Please check server connection.", type: "error" }));
    } finally {
      setIsAiLoading(false);
    }
  };

  // Form Validation & Submission
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

    const allImages = [...mainImages, ...galleryImages];

    if (finalStatus === "published" && allImages.length === 0) {
      dispatch(addToast({ message: "At least 1 product image is required to publish.", type: "warning" }));
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
    if (formData.barcode) payload.append("barcode", formData.barcode);
    if (formData.purchaseNote) payload.append("purchaseNote", formData.purchaseNote);

    if (formData.subcategories && formData.subcategories.length > 0) {
      formData.subcategories.forEach((subId, idx) => {
        payload.append(`subcategories[${idx}]`, subId);
      });
    }

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

    payload.append("maxPrice[amount]", formData.maxPriceAmount);
    payload.append("maxPrice[currency]", "INR");
    if (formData.sellingPriceAmount) {
      payload.append("sellingPrice[amount]", formData.sellingPriceAmount);
      payload.append("sellingPrice[currency]", "INR");
    }
    if (formData.costPriceAmount) {
      payload.append("costPrice[amount]", formData.costPriceAmount);
      payload.append("costPrice[currency]", "INR");
    }

    if (formData.tags) {
      const tagArray = formData.tags.split(",").map((t) => t.trim()).filter(Boolean);
      tagArray.forEach((tag, idx) => payload.append(`tags[${idx}]`, tag));
    }

    if (formData.metaTitle) payload.append("seo[metaTitle]", formData.metaTitle);
    if (formData.metaDescription) payload.append("seo[metaDescription]", formData.metaDescription);
    if (formData.canonicalUrl) payload.append("seo[canonicalUrl]", formData.canonicalUrl);

    if (bulkDiscountRules && bulkDiscountRules.length > 0) {
      payload.append("bulkDiscountRules", JSON.stringify(bulkDiscountRules));
    }

    if (mainAttributes.length > 0) {
      // Normalize: merge duplicates + Title Case all names and values before saving
      const formattedAttributes = normalizeAttributesArray(mainAttributes);
      payload.append("attributes", JSON.stringify(formattedAttributes));
    }

    if (variantsList.length > 0) {
      const formattedVariants = await Promise.all(
        variantsList.map(async (v) => {
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
            attributes: v.attributes || {},
            price: {
              amount: Number(v.priceAmount || formData.sellingPriceAmount || formData.maxPriceAmount),
              currency: "INR",
            },
            stock: Number(v.stock),
            sku: v.sku,
            barcode: v.barcode,
            images: processedImages.filter(Boolean),
          };
        })
      );

      payload.append("variants", JSON.stringify(formattedVariants));
    }

    const rawFiles = allImages.filter((img) => !img.isUrl).map((img) => img.file);
    const rawUrls = allImages.filter((img) => img.isUrl).map((img) => img.url || img.preview);

    rawFiles.forEach((file) => payload.append("images", file));
    if (rawUrls.length > 0) {
      payload.append("imageUrls", JSON.stringify(rawUrls));
    }

    let res;
    if (editId) {
      res = await handleUpdateProduct(editId, payload);
    } else {
      res = await handleCreateProduct(payload);
    }

    if (res.success) {
      navigate("/seller/catalog");
    }
  };

  const selectedCategoryObj = categories.find((c) => c._id === formData.category);
  const parentCategories = categories.filter((c) => !c.parentCategory);
  const availableSubcategories = categories.filter(
    (c) => c.parentCategory && String(c.parentCategory._id || c.parentCategory) === String(formData.category)
  );

  return (
    <div className="w-full text-foreground py-6 px-4 sm:px-6 transition-colors duration-300 font-sans">
      {/* WooCommerce Style Full-Width Container (Main Content 75% + Right Sidebar 25%) */}
      <form onSubmit={(e) => handleSubmit(e, "published")} className="flex flex-col lg:flex-row gap-6 w-full">
        {/* LEFT COLUMN (75% width): Main Form Title, Editor & Product Data Container */}
        <div className="flex-1 space-y-6 min-w-0">
          {/* Main Title Input (WooCommerce Add Product Header Input) */}
          <div className="bg-surface border border-border-theme p-6 rounded-2xl space-y-3 shadow-sm">
            <h1 className="text-xl font-black text-foreground tracking-tight flex items-center justify-between">
              <span>{editId ? "Edit Product" : "Add New Product"}</span>
              <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
                INR Only (₹)
              </span>
            </h1>

            {fetchingEditProduct ? (
              <div className="w-full h-12 bg-foreground/15 rounded-xl animate-pulse border border-border-theme/40" />
            ) : (
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="Product title (e.g. Lenovo LOQ Gaming Laptop, Nike Air Force 1)"
                className="w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-lg font-bold text-foreground outline-none transition-all focus:ring-4 focus:ring-accent/10 placeholder:text-foreground/25"
              />
            )}

            {/* Permalink Preview */}
            <div className="text-xs font-mono text-foreground/50 flex items-center space-x-1 pl-1">
              <span>Permalink:</span>
              <span className="text-accent underline">
                https://scapegoat.com/product/{formData.title ? formData.title.toLowerCase().replace(/\s+/g, "-") : "sample-product"}
              </span>
            </div>

            {/* SKU Input Field right under Title */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-border-theme/40">
              <FormField label="Product SKU (Stock Keeping Unit)" error={formErrors.sku} loading={fetchingEditProduct}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="sku"
                    value={formData.sku}
                    onChange={handleChange}
                    placeholder="e.g. SG-LNV-LOQ-01"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleAutoGenerateSku}
                    className="px-3 py-2 bg-accent/10 border border-accent/30 text-accent rounded-xl text-xs font-bold whitespace-nowrap hover:bg-accent hover:text-accent-content transition cursor-pointer flex items-center gap-1"
                  >
                    <i className="ri-flashlight-line" />
                    <span>Auto SKU</span>
                  </button>
                </div>
              </FormField>

              <FormField label="Barcode (EAN-13)" loading={fetchingEditProduct}>
                <div className="flex gap-2">
                  <input
                    type="text"
                    name="barcode"
                    value={formData.barcode}
                    onChange={handleChange}
                    placeholder="8901234567890"
                    className={inputClass}
                  />
                  <button
                    type="button"
                    onClick={handleGenerateMainBarcode}
                    className="px-3 py-2 bg-accent/10 border border-accent/30 text-accent rounded-xl text-xs whitespace-nowrap hover:bg-accent hover:text-accent-content transition cursor-pointer flex items-center gap-1"
                  >
                    <i className="ri-barcode-line" />
                  </button>
                </div>
              </FormField>
            </div>
          </div>

          {/* Full Description & Catalog Description Suggestion */}
          <div className="bg-surface border border-border-theme p-6 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <i className="ri-file-text-line text-accent text-base" />
                <span>Product Description</span>
              </h2>

              <button
                type="button"
                onClick={handleSuggestCatalogDescription}
                disabled={isAiLoading}
                className="text-xs font-bold text-accent bg-accent/10 border border-accent/30 hover:bg-accent hover:text-accent-content px-3 py-1.5 rounded-xl transition cursor-pointer flex items-center gap-1.5"
              >
                <i className="ri-sparkling-line" />
                <span>{isAiLoading ? "Searching Catalog..." : "Suggest Catalog Description"}</span>
              </button>
            </div>

            <FormField label="Short Summary / Subtitle" loading={fetchingEditProduct}>
              <input
                type="text"
                name="shortDescription"
                value={formData.shortDescription}
                onChange={handleChange}
                placeholder="e.g. High-performance gaming laptop with RTX 4060 & AMD Ryzen 7"
                className={inputClass}
              />
            </FormField>

            <FormField label="Full Detailed Description" required error={formErrors.description} loading={fetchingEditProduct} skeletonHeight="h-36">
              <RichTextEditor
                value={formData.description}
                onChange={(newVal) => setFormData((prev) => ({ ...prev, description: newVal }))}
                placeholder="Enter detailed product description, specifications, washing instructions, features..."
                productImages={[
                  ...mainImages.map((img) => (typeof img === "string" ? img : img.preview || img.url)),
                  ...galleryImages.map((img) => (typeof img === "string" ? img : img.preview || img.url)),
                  ...variantsList.flatMap((v) => (v.images || []).map((img) => (typeof img === "string" ? img : img.preview || img.url))),
                ].filter(Boolean)}
              />
            </FormField>

            {aiSuggestion && (
              <div className="bg-accent/10 border border-accent/30 rounded-2xl p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-accent flex items-center gap-1">
                    <i className="ri-sparkling-fill" />
                    <span>Catalog Match: {matchedCatalogTitle || "Database Match"}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setFormData((prev) => ({ ...prev, description: aiSuggestion }));
                      setAiSuggestion("");
                    }}
                    className="text-xs font-bold bg-accent text-accent-content px-3 py-1 rounded-xl cursor-pointer"
                  >
                    Apply Description
                  </button>
                </div>
                <p className="text-xs text-foreground/80 leading-relaxed font-sans">{aiSuggestion}</p>
              </div>
            )}
          </div>

          {/* Product Data Box (WooCommerce Layout with Left Vertical Tabs Bar) */}
          <div className="bg-surface border border-border-theme rounded-2xl shadow-sm overflow-hidden">
            <div className="border-b border-border-theme p-4 bg-background/50 flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-wider text-foreground flex items-center gap-2">
                <i className="ri-settings-3-line text-accent text-sm" />
                <span>Product Data — {formData.productType === "physical" ? "Physical Product" : "Digital Downloadable"}</span>
              </h2>
            </div>

            {/* Split Container: Left Vertical Tabs + Right Form Tab Panel */}
            <div className="flex flex-col lg:flex-row min-h-[420px]">
              {/* Left Vertical Navigation Bar */}
              <ProductFormTabs
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                variantsCount={variantsList.length}
              />

              {/* Right Tab Content Panel */}
              <div className="flex-1 p-6 space-y-6">
                {/* ── TAB 1: GENERAL & PRICING ── */}
                {activeTab === "general" && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-foreground border-b border-border-theme pb-2 flex items-center gap-2">
                      <i className="ri-price-tag-3-line text-accent" />
                      <span>Pricing & Unit of Measurement</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <FormField label="Regular MRP Price (₹)" required error={formErrors.maxPriceAmount} loading={fetchingEditProduct}>
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

                      <FormField label="Sale Price (₹)" loading={fetchingEditProduct}>
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

                      <FormField label="Cost Price (₹) [Private]" loading={fetchingEditProduct} tooltip="Confidential cost price used for Profit & Loss calculations. Never visible to buyers.">
                        <input
                          type="number"
                          name="costPriceAmount"
                          value={formData.costPriceAmount}
                          onChange={handleChange}
                          placeholder="1200"
                          className={inputClass}
                          min={0}
                        />
                      </FormField>

                      {/* Prominent Unit Selector in Price Section */}
                      <FormField label="Unit of Measurement" loading={fetchingEditProduct}>
                        <div className="flex gap-2">
                          <select
                            name="unit"
                            value={formData.unit}
                            onChange={handleChange}
                            className={selectClass}
                          >
                            <option value="">Select Unit (e.g. pcs, kg, m)</option>
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
                    </div>

                    {/* Dynamic Profit & Loss Margin Calculation Badge */}
                    {formData.costPriceAmount && (formData.sellingPriceAmount || formData.maxPriceAmount) && (
                      (() => {
                        const sellP = Number(formData.sellingPriceAmount || formData.maxPriceAmount || 0);
                        const costP = Number(formData.costPriceAmount || 0);
                        const profit = sellP - costP;
                        const marginPercent = sellP > 0 ? Math.round((profit / sellP) * 100) : 0;
                        const isProfitable = profit >= 0;

                        return (
                          <div
                            className={`rounded-xl p-3.5 flex items-center justify-between text-xs border ${
                              isProfitable
                                ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-500"
                                : "bg-rose-500/10 border-rose-500/30 text-rose-500"
                            }`}
                          >
                            <span className="font-bold flex items-center gap-1.5">
                              <i className={isProfitable ? "ri-line-chart-line text-sm" : "ri-funds-line text-sm"} />
                              <span>
                                {isProfitable ? "Estimated Profit Per Unit:" : "Loss Per Unit:"} ₹{Math.abs(profit)}
                              </span>
                            </span>
                            <span
                              className={`font-extrabold px-2.5 py-0.5 rounded-full text-[11px] ${
                                isProfitable ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                              }`}
                            >
                              {marginPercent}% Margin
                            </span>
                          </div>
                        );
                      })()
                    )}

                    {formData.maxPriceAmount && formData.sellingPriceAmount && Number(formData.sellingPriceAmount) < Number(formData.maxPriceAmount) && (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3.5 flex items-center justify-between text-xs">
                        <span className="font-bold text-emerald-500 flex items-center gap-1">
                          <i className="ri-fire-line" />
                          <span>Discount Applied: ₹{Number(formData.maxPriceAmount) - Number(formData.sellingPriceAmount)} Savings</span>
                        </span>
                        <span className="font-extrabold bg-emerald-500 text-white px-2.5 py-0.5 rounded-full">
                          {Math.round(((Number(formData.maxPriceAmount) - Number(formData.sellingPriceAmount)) / Number(formData.maxPriceAmount)) * 100)}% OFF
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 2: INVENTORY ── */}
                {activeTab === "inventory" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border-theme pb-2">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <i className="ri-inbox-archive-line text-accent" />
                        <span>Stock & Inventory Settings</span>
                      </h3>

                      <label className="flex items-center space-x-2 cursor-pointer">
                        <input
                          type="checkbox"
                          name="manageStock"
                          checked={formData.manageStock}
                          onChange={handleChange}
                          className="accent-accent w-4 h-4 cursor-pointer"
                        />
                        <span className="text-xs text-foreground font-bold">Enable Stock Management</span>
                      </label>
                    </div>

                    {formData.manageStock ? (
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <FormField label="Stock Quantity" loading={fetchingEditProduct}>
                          <input
                            type="number"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            className={inputClass}
                            min={0}
                          />
                        </FormField>

                        <FormField label="Low Stock Threshold" loading={fetchingEditProduct}>
                          <input
                            type="number"
                            name="lowStockThreshold"
                            value={formData.lowStockThreshold}
                            onChange={handleChange}
                            className={inputClass}
                            min={0}
                          />
                        </FormField>

                        <FormField label="Stock Status" loading={fetchingEditProduct}>
                          <select
                            name="stockStatus"
                            value={formData.stockStatus}
                            onChange={handleChange}
                            className={selectClass}
                          >
                            <option value="instock">In stock</option>
                            <option value="outofstock">Out of stock</option>
                            <option value="onbackorder">On backorder</option>
                          </select>
                        </FormField>
                      </div>
                    ) : (
                      <p className="text-xs text-foreground/50 italic">
                        Stock tracking is disabled. Item will show as continuously in stock.
                      </p>
                    )}
                  </div>
                )}

                {/* ── TAB 3: SHIPPING ── */}
                {activeTab === "shipping" && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-foreground border-b border-border-theme pb-2 flex items-center gap-2">
                      <i className="ri-truck-line text-accent" />
                      <span>Shipping Weight & Dimensions</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField label="Product Weight">
                        <div className="flex gap-2">
                          <input
                            type="number"
                            name="weight"
                            value={formData.weight}
                            onChange={handleChange}
                            placeholder="350"
                            className={inputClass}
                            min={0}
                          />
                          <select name="weightUnit" value={formData.weightUnit} onChange={handleChange} className={`${selectClass} max-w-[90px]`}>
                            <option value="g">g</option>
                            <option value="kg">kg</option>
                          </select>
                        </div>
                      </FormField>

                      <FormField label="Dimension Unit">
                        <select name="dimensionUnit" value={formData.dimensionUnit} onChange={handleChange} className={selectClass}>
                          <option value="cm">cm</option>
                          <option value="in">in</option>
                        </select>
                      </FormField>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <FormField label={`Length (${formData.dimensionUnit})`}>
                        <input type="number" name="length" value={formData.length} onChange={handleChange} placeholder="30" className={inputClass} min={0} />
                      </FormField>
                      <FormField label={`Width (${formData.dimensionUnit})`}>
                        <input type="number" name="width" value={formData.width} onChange={handleChange} placeholder="20" className={inputClass} min={0} />
                      </FormField>
                      <FormField label={`Height (${formData.dimensionUnit})`}>
                        <input type="number" name="height" value={formData.height} onChange={handleChange} placeholder="10" className={inputClass} min={0} />
                      </FormField>
                    </div>
                  </div>
                )}

                {/* ── TAB 4: ATTRIBUTES ── */}
                {activeTab === "attributes" && (
                  <div className="space-y-6">
                    <div className="flex items-center justify-between border-b border-border-theme pb-2">
                      <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                        <i className="ri-layout-grid-line text-accent" />
                        <span>Product Attributes (Source of Truth)</span>
                      </h3>
                    </div>

                    {/* Add Attribute Row */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-background border border-border-theme p-3 rounded-xl">
                      <input
                        type="text"
                        placeholder="Attribute Name (e.g. Color, Size)"
                        value={mainAttrName}
                        onChange={(e) => setMainAttrName(e.target.value)}
                        className={inputClass}
                      />
                      <input
                        type="text"
                        placeholder="Options (e.g. Red, Blue, Green)"
                        value={mainAttrValues}
                        onChange={(e) => setMainAttrValues(e.target.value)}
                        className={inputClass}
                      />
                      <button
                        type="button"
                        onClick={handleAddMainAttribute}
                        className="px-4 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <i className="ri-add-line" />
                        <span>Add Attribute</span>
                      </button>
                    </div>

                    {/* Attribute Tags */}
                    {mainAttributes.length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {mainAttributes.map((attr, idx) => (
                          <div
                            key={idx}
                            className="bg-background border border-border-theme rounded-xl px-3 py-2 flex items-center space-x-2 text-xs"
                          >
                            <span className="font-bold text-accent">{attr.name || attr.key}:</span>
                            <span className="text-foreground/80">{(attr.options || attr.values || []).join(", ")}</span>
                            <button
                              type="button"
                              onClick={() => removeMainAttribute(idx)}
                              className="text-red-400 hover:text-red-600 font-bold ml-1 cursor-pointer"
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 5: VARIATIONS ── */}
                {activeTab === "variations" && (
                  <div className="space-y-6">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border-theme pb-3 gap-3">
                      <div>
                        <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                          <i className="ri-git-branch-line text-accent" />
                          <span>Product Variations ({variantsList.length})</span>
                        </h3>
                        <p className="text-[11px] text-foreground/60">
                          Variations are generated based on defined Main Product Attributes.
                        </p>
                      </div>

                      {/* Explicit Button: Generate Variations */}
                      <button
                        type="button"
                        onClick={handleGenerateVariationsClick}
                        className="px-4 py-2 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow hover:opacity-90 transition cursor-pointer flex items-center gap-1.5"
                      >
                        <i className="ri-flashlight-line" />
                        <span>Generate All Variations</span>
                      </button>
                    </div>

                    {/* ONLY SHOW PRICING & INVENTORY STRATEGIES IF VARIANTS ARE GENERATED */}
                    {variantsList.length > 0 && (
                      <div className="space-y-4 bg-background border border-border-theme p-4 rounded-xl">
                        <label className="text-xs font-bold text-accent uppercase tracking-wider block">
                          ⚡ Variation Strategies
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <FormField label="Pricing Strategy">
                              <select
                                value={pricingStrategy}
                                onChange={(e) => setPricingStrategy(e.target.value)}
                                className={selectClass}
                              >
                                <option value="same_product">Same for Entire Product</option>
                                <option value="same_attribute">Same by Attribute</option>
                                <option value="different_variant">Different for Every Variant</option>
                              </select>
                            </FormField>
                            {pricingStrategy === "same_attribute" && mainAttributes.length > 0 && (
                              <FormField label="Select Target Attribute for Price">
                                <select
                                  value={pricingSelectedAttr || mainAttributes[0]?.name || mainAttributes[0]?.key || ""}
                                  onChange={(e) => setPricingSelectedAttr(e.target.value)}
                                  className={selectClass}
                                >
                                  {mainAttributes.map((attr, aIdx) => {
                                    const keyName = attr.name || attr.key;
                                    return (
                                      <option key={aIdx} value={keyName}>
                                        Group price by {keyName}
                                      </option>
                                    );
                                  })}
                                </select>
                              </FormField>
                            )}
                          </div>

                          <div className="space-y-2">
                            <FormField label="Inventory Strategy">
                              <select
                                value={inventoryStrategy}
                                onChange={(e) => setInventoryStrategy(e.target.value)}
                                className={selectClass}
                              >
                                <option value="shared_product">Shared across Entire Product</option>
                                <option value="shared_attribute">Shared by Attribute</option>
                                <option value="different_variant">Different for Every Variant</option>
                              </select>
                            </FormField>
                            {inventoryStrategy === "shared_attribute" && mainAttributes.length > 0 && (
                              <FormField label="Select Target Attribute for Stock">
                                <select
                                  value={inventorySelectedAttr || mainAttributes[0]?.name || mainAttributes[0]?.key || ""}
                                  onChange={(e) => setInventorySelectedAttr(e.target.value)}
                                  className={selectClass}
                                >
                                  {mainAttributes.map((attr, aIdx) => {
                                    const keyName = attr.name || attr.key;
                                    return (
                                      <option key={aIdx} value={keyName}>
                                        Group stock by {keyName}
                                      </option>
                                    );
                                  })}
                                </select>
                              </FormField>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Variations List */}
                    {variantsList.length === 0 ? (
                      <div className="p-8 text-center bg-background border border-dashed border-border-theme rounded-2xl space-y-2">
                        <p className="text-xs font-bold text-foreground/60">No variations generated yet.</p>
                        <p className="text-[11px] text-foreground/40">
                          Add Attributes under the Attributes tab, then click "Generate All Variations".
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {variantsList.map((vItem, vIdx) => (
                          <VariantItemCard
                            key={vItem.id || vIdx}
                            variant={vItem}
                            vIdx={vIdx}
                            mainAttributes={mainAttributes}
                            variantsList={variantsList}
                            handleVariantChange={handleVariantChange}
                            handleVariantImagesChange={handleVariantImagesChange}
                            removeVariant={removeVariant}
                            manageStock={formData.manageStock}
                          />
                        ))}

                        {/* Add New Variant Button */}
                        {mainAttributes.length > 0 && (
                          <button
                            type="button"
                            onClick={addNewVariant}
                            className="w-full py-3 border-2 border-dashed border-accent/40 hover:border-accent rounded-2xl text-xs font-extrabold text-accent/70 hover:text-accent flex items-center justify-center gap-2 transition cursor-pointer"
                          >
                            <i className="ri-add-circle-line text-base" />
                            Add New Variant
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* ── TAB 6: DISCOUNTS ── */}
                {activeTab === "discounts" && (
                  <div className="space-y-6">
                    <h3 className="text-sm font-bold text-foreground border-b border-border-theme pb-2 flex items-center gap-2">
                      <i className="ri-percent-line text-accent" />
                      <span>Bulk Tier Discounts</span>
                    </h3>

                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-background border border-border-theme p-3 rounded-xl">
                      <FormField label="Min Qty">
                        <input
                          type="number"
                          value={bulkRuleMinQty}
                          onChange={(e) => setBulkRuleMinQty(e.target.value)}
                          placeholder="10"
                          className={inputClass}
                          min={2}
                        />
                      </FormField>
                      <FormField label="Discount Type">
                        <select value={bulkRuleDiscType} onChange={(e) => setBulkRuleDiscType(e.target.value)} className={selectClass}>
                          <option value="percentage">% Percentage</option>
                          <option value="fixed">₹ Flat Off</option>
                        </select>
                      </FormField>
                      <FormField label="Value">
                        <input
                          type="number"
                          value={bulkRuleDiscValue}
                          onChange={(e) => setBulkRuleDiscValue(e.target.value)}
                          placeholder="10"
                          className={inputClass}
                          min={0}
                        />
                      </FormField>
                      <div className="flex items-end">
                        <button
                          type="button"
                          onClick={handleAddBulkRule}
                          className="w-full px-3 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1"
                        >
                          <i className="ri-add-line" />
                          <span>+ Add Rule</span>
                        </button>
                      </div>
                    </div>

                    {/* Active Bulk Discount Tiers List */}
                    {bulkDiscountRules.length > 0 ? (
                      <div className="space-y-2 pt-2 border-t border-border-theme/40">
                        <label className="text-xs font-bold text-accent uppercase tracking-wider block">
                          ⚡ Active Bulk Discount Tiers ({bulkDiscountRules.length}):
                        </label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {bulkDiscountRules.map((rule, idx) => (
                            <div
                              key={idx}
                              className="bg-background border border-border-theme p-3 rounded-xl flex items-center justify-between shadow-sm"
                            >
                              <div className="space-x-2 text-xs">
                                <span className="font-extrabold text-accent">Buy {rule.minQty}+ items:</span>
                                <span className="font-bold text-foreground font-mono">
                                  {rule.discType === "percentage" ? `${rule.discValue}% OFF` : `₹${rule.discValue} OFF`}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => removeBulkRule(idx)}
                                className="text-red-400 hover:text-red-600 font-bold text-xs cursor-pointer p-1 transition"
                                title="Remove tier rule"
                              >
                                <i className="ri-delete-bin-line" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-foreground/40 italic">
                        No bulk discount rules added yet. Enter min quantity and discount value above, then click "+ Add Rule".
                      </p>
                    )}
                  </div>
                )}

                {/* ── TAB 7: SEO ── */}
                {activeTab === "seo" && (
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-foreground border-b border-border-theme pb-2 flex items-center gap-2">
                      <i className="ri-search-line text-accent" />
                      <span>Search Engine Optimization</span>
                    </h3>
                    <FormField label="Meta Title">
                      <input type="text" name="metaTitle" value={formData.metaTitle} onChange={handleChange} className={inputClass} />
                    </FormField>
                    <FormField label="Meta Description">
                      <textarea name="metaDescription" rows={3} value={formData.metaDescription} onChange={handleChange} className={`${inputClass} resize-y`} />
                    </FormField>
                  </div>
                )}

                {/* ── TAB 8: LIVE PREVIEW ── */}
                {activeTab === "preview" && (
                  <LiveProductPreview
                    formData={formData}
                    mainImages={mainImages}
                    mainAttributes={mainAttributes}
                    variantsList={variantsList}
                  />
                )}

                {/* ── TAB 9: HISTORY ── */}
                {activeTab === "history" && (
                  <ProductHistoryTimeline
                    historyLogs={historyLogs}
                    inventoryTimeline={inventoryTimeline}
                  />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT SIDEBAR COLUMN (25% width): WooCommerce Publish Box, Categories & Photo Cards */}
        <div className="w-full lg:w-80 space-y-6 shrink-0">
          {/* 1. PUBLISH WIDGET BOX (WooCommerce Publish Card) */}
          <div className="bg-surface border border-border-theme p-5 rounded-2xl space-y-4 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <i className="ri-send-plane-line text-accent" />
                <span>Publish</span>
              </h2>
              <span className="text-[10px] font-extrabold uppercase bg-accent/10 text-accent px-2 py-0.5 rounded-full border border-accent/20">
                {formData.status || "published"}
              </span>
            </div>

            <div className="space-y-3">
              <FormField label="Catalog Visibility / Status">
                <select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className={selectClass}
                >
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="trash">Trash</option>
                </select>
              </FormField>

              {formData.status === "scheduled" && (
                <FormField label="Publish Date & Time">
                  <input
                    type="datetime-local"
                    value={scheduledPublishDate}
                    onChange={(e) => setScheduledPublishDate(e.target.value)}
                    className={inputClass}
                  />
                </FormField>
              )}

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={(e) => handleSubmit(e, "draft")}
                  className="text-xs font-bold text-foreground/70 hover:text-foreground underline cursor-pointer"
                >
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("preview")}
                  className="text-xs font-bold text-accent hover:underline cursor-pointer"
                >
                  Live Preview
                </button>
              </div>
            </div>

            <div className="pt-3 border-t border-border-theme flex items-center justify-between gap-2">
              {editId && (
                <button
                  type="button"
                  onClick={() => handleSubmit(null, "trash")}
                  className="text-red-400 hover:text-red-600 font-bold text-xs cursor-pointer flex items-center gap-1"
                >
                  <i className="ri-delete-bin-line" />
                  <span>Move to Trash</span>
                </button>
              )}
              <button
                type="submit"
                disabled={creating}
                className="w-full py-3 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow-md hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <i className="ri-check-line text-sm" />
                <span>{creating ? "Saving..." : editId ? "Update Product" : "Publish Product"}</span>
              </button>
            </div>
          </div>

          {/* 2. PRODUCT CATEGORIES BOX (WooCommerce Categories Card) */}
          <div className="bg-surface border border-border-theme p-5 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-theme pb-2.5">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-folder-3-line text-accent" />
                <span>Product Categories</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowCategoryModal(true)}
                className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
              >
                + Add Category
              </button>
            </div>

            <FormField error={formErrors.category} loading={fetchingEditProduct}>
              <select
                name="category"
                value={formData.category}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">Select Main Category</option>
                {parentCategories.map((cat) => (
                  <option key={cat._id} value={cat._id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </FormField>

            {/* Subcategories list */}
            {formData.category && availableSubcategories.length > 0 && (
              <div className="space-y-1.5 pt-2 border-t border-border-theme/40 max-h-40 overflow-y-auto scrollbar-thin">
                <label className="text-[11px] font-bold text-foreground/60 uppercase">Subcategories:</label>
                <div className="space-y-1">
                  {availableSubcategories.map((sub) => {
                    const isSelected = formData.subcategories?.includes(sub._id);
                    return (
                      <label key={sub._id} className="flex items-center space-x-2 text-xs font-medium cursor-pointer">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => toggleSubcategory(sub._id)}
                          className="accent-accent w-3.5 h-3.5 rounded cursor-pointer"
                        />
                        <span>{sub.name}</span>
                      </label>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* 3. PRODUCT BRAND BOX */}
          <div className="bg-surface border border-border-theme p-5 rounded-2xl space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-border-theme pb-2.5">
              <h2 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-price-tag-2-line text-accent" />
                <span>Product Brand</span>
              </h2>
              <button
                type="button"
                onClick={() => setShowBrandModal(true)}
                className="text-[11px] font-bold text-accent hover:underline cursor-pointer"
              >
                + Add Brand
              </button>
            </div>

            {fetchingEditProduct ? (
              <div className="w-full h-10 bg-foreground/15 rounded-xl animate-pulse border border-border-theme/40" />
            ) : (
              <select
                name="brand"
                value={formData.brand}
                onChange={handleChange}
                className={selectClass}
              >
                <option value="">Select Brand / Designer</option>
                {brands.map((b) => (
                  <option key={b._id} value={b._id}>
                    {b.name}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* 4. PRODUCT MAIN IMAGE BOX (WooCommerce Product Image Card) */}
          <div className="bg-surface border border-border-theme p-5 rounded-2xl space-y-3 shadow-sm">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border-theme pb-2.5 flex items-center gap-1.5">
              <i className="ri-image-line text-accent" />
              <span>Product Primary Image</span>
            </h2>
            {fetchingEditProduct ? (
              <div className="w-full h-44 bg-foreground/15 rounded-2xl animate-pulse border border-border-theme/40" />
            ) : (
              <ImageDropzone images={mainImages} setImages={setMainImages} maxImages={1} />
            )}
          </div>

          {/* 5. PRODUCT GALLERY BOX (WooCommerce Product Gallery Card) */}
          <div className="bg-surface border border-border-theme p-5 rounded-2xl space-y-3 shadow-sm">
            <h2 className="text-xs font-bold text-foreground uppercase tracking-wider border-b border-border-theme pb-2.5 flex items-center gap-1.5">
              <i className="ri-gallery-line text-accent" />
              <span>Product Photo Gallery</span>
            </h2>
            {fetchingEditProduct ? (
              <div className="w-full h-32 bg-foreground/15 rounded-2xl animate-pulse border border-border-theme/40" />
            ) : (
              <ImageDropzone images={galleryImages} setImages={setGalleryImages} maxImages={6} />
            )}
          </div>
        </div>
      </form>

      {/* Category Modal */}
      {showCategoryModal && (
        <Modal
          isOpen={showCategoryModal}
          onClose={() => {
            setShowCategoryModal(false);
            setEditingCatId(null);
            setNewCatName("");
          }}
          onSubmit={async (e) => {
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
                setShowCategoryModal(false);
              }
            }
          }}
          title={editingCatId ? "Edit Category" : isSubcategoryModal ? "Create Subcategory" : "Create Category"}
          confirmText={editingCatId ? "Update" : "Create"}
        >
          <div className="space-y-4">
            <FormField label="Category Name" required>
              <input
                type="text"
                value={newCatName}
                onChange={(e) => setNewCatName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </FormField>
          </div>
        </Modal>
      )}

      {/* Brand Modal */}
      {showBrandModal && (
        <Modal
          isOpen={showBrandModal}
          onClose={() => {
            setShowBrandModal(false);
            setEditingBrandId(null);
            setNewBrandName("");
          }}
          onSubmit={async (e) => {
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
          }}
          title={editingBrandId ? "Edit Brand" : "Create Brand"}
          confirmText={editingBrandId ? "Update" : "Create"}
        >
          <div className="space-y-4">
            <FormField label="Brand Name" required>
              <input
                type="text"
                value={newBrandName}
                onChange={(e) => setNewBrandName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </FormField>
          </div>
        </Modal>
      )}

      {/* Unit Modal */}
      {showUnitModal && (
        <Modal
          isOpen={showUnitModal}
          onClose={() => {
            setShowUnitModal(false);
            setEditingUnitId(null);
            setNewUnitName("");
            setNewUnitAbbr("");
          }}
          onSubmit={async (e) => {
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
          }}
          title={editingUnitId ? "Edit Unit" : "Create Unit"}
          confirmText={editingUnitId ? "Update" : "Create"}
        >
          <div className="space-y-4">
            <FormField label="Unit Name" required>
              <input
                type="text"
                value={newUnitName}
                onChange={(e) => setNewUnitName(e.target.value)}
                className={inputClass}
                autoFocus
              />
            </FormField>
            <FormField label="Abbreviation" required>
              <input
                type="text"
                value={newUnitAbbr}
                onChange={(e) => setNewUnitAbbr(e.target.value)}
                className={inputClass}
              />
            </FormField>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default CreateProduct;
