import React, { useState } from "react";
import FormField from "./FormField";
import ImageDropzone from "./ImageDropzone";

const inputClass =
  "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-3 text-foreground outline-none transition-all duration-300 focus:ring-4 focus:ring-accent/10 placeholder:text-foreground/25";

const VARIANT_FIELDS = [
  { label: "Variant Title", field: "name", type: "text", placeholder: "Variant Name" },
  { label: "Price (₹)", field: "priceAmount", type: "number", placeholder: "1999" },
  { label: "Stock Quantity", field: "stock", type: "number", placeholder: "10" },
  { label: "SKU Code", field: "sku", type: "text", placeholder: "SKU-001" },
];

/**
 * VariantItemCard Component
 * Extracted standalone component to obey React Rules of Hooks
 */
const VariantItemCard = ({
  variant,
  vIdx,
  handleVariantChange,
  handleAddVariantAttribute,
  removeVariantAttribute,
  handleVariantImagesChange,
  removeVariant,
}) => {
  const [newKey, setNewKey] = useState("");
  const [newVal, setNewVal] = useState("");

  const onAddAttr = (e) => {
    e.preventDefault();
    if (!newKey.trim() || !newVal.trim()) return;
    handleAddVariantAttribute(variant.id, newKey, newVal);
    setNewKey("");
    setNewVal("");
  };

  // Combine attributes from dynamicAttributes AND raw attributes object/map
  const getCombinedAttributes = () => {
    const list = [];
    const setKeys = new Set();

    // 1. From dynamicAttributes array
    if (Array.isArray(variant.dynamicAttributes)) {
      variant.dynamicAttributes.forEach((da, idx) => {
        const k = da.key || da.name;
        if (!k) return;
        const vals = da.values || da.options || (da.value ? [da.value] : []);
        list.push({ key: k, value: vals.join(", "), index: idx });
        setKeys.add(k.toLowerCase());
      });
    }

    // 2. From raw attributes object/map
    if (variant.attributes) {
      const raw =
        typeof variant.attributes.forEach === "function"
          ? Object.fromEntries(variant.attributes)
          : variant.attributes instanceof Map
          ? Object.fromEntries(variant.attributes)
          : variant.attributes._doc || variant.attributes;

      if (raw && typeof raw === "object") {
        Object.entries(raw).forEach(([k, v]) => {
          if (k && v && !setKeys.has(k.toLowerCase())) {
            const valStr = Array.isArray(v) ? v.join(", ") : String(v);
            list.push({ key: k, value: valStr, index: list.length });
            setKeys.add(k.toLowerCase());
          }
        });
      }
    }

    return list;
  };

  const combinedAttrsList = getCombinedAttributes();

  const attrSummary = combinedAttrsList
    .map((attr) => `${attr.key}: ${attr.value}`)
    .join(" • ");

  const headerTitle = attrSummary
    ? `Variant #${vIdx + 1}: ${attrSummary}`
    : `Variant #${vIdx + 1}: ${variant.name || "Default Variant"}`;

  return (
    <div className="bg-background border border-border-theme rounded-2xl p-6 space-y-6 relative shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border-theme pb-3">
        <span className="font-bold text-sm text-accent">{headerTitle}</span>
        <button
          type="button"
          onClick={() => removeVariant(variant.id)}
          className="text-red-400 hover:text-red-600 font-bold text-xs bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20 cursor-pointer"
        >
          Delete Variant
        </button>
      </div>

      {/* Main Input Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {VARIANT_FIELDS.map(({ label, field, type, placeholder }) => (
          <FormField key={field} label={label}>
            <input
              type={type}
              value={variant[field] || ""}
              onChange={(e) => handleVariantChange(variant.id, field, e.target.value)}
              placeholder={placeholder}
              className={inputClass}
            />
          </FormField>
        ))}
      </div>

      {/* Dynamic Key-Value Attributes */}
      <div className="space-y-3 pt-2">
        <label className="text-xs font-bold text-foreground">
          Dynamic Attributes for this Variant:
        </label>

        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Attribute Key (e.g. Color, Storage)"
            value={newKey}
            onChange={(e) => setNewKey(e.target.value)}
            className="flex-1 bg-surface border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground outline-none"
          />
          <input
            type="text"
            placeholder="Value (e.g. Navy Blue, 256GB)"
            value={newVal}
            onChange={(e) => setNewVal(e.target.value)}
            className="flex-1 bg-surface border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground outline-none"
          />
          <button
            type="button"
            onClick={onAddAttr}
            className="px-4 py-2 bg-accent/10 text-accent font-bold rounded-xl text-xs border border-accent/20 hover:bg-accent hover:text-accent-content transition cursor-pointer"
          >
            + Add Attribute
          </button>
        </div>

        {combinedAttrsList.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {combinedAttrsList.map((attr, aIdx) => (
              <span
                key={aIdx}
                className="bg-accent/10 border border-accent/30 text-accent text-xs font-bold px-3 py-1 rounded-xl flex items-center gap-2"
              >
                <span>
                  {attr.key}: {attr.value}
                </span>
                <button
                  type="button"
                  onClick={() => removeVariantAttribute(variant.id, attr.index, attr.key)}
                  className="text-red-400 hover:text-red-600 font-extrabold cursor-pointer text-xs"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Variant Images Upload */}
      <div className="space-y-2 pt-2 border-t border-border-theme/40">
        <label className="text-xs font-bold text-foreground/80 block">
          Variant Photos Gallery (Upload photo gallery for this variant):
        </label>
        <ImageDropzone
          images={variant.images || []}
          onImagesChange={(newImgs) => handleVariantImagesChange(variant.id, newImgs)}
          maxImages={7}
          enableFilters={true}
        />
      </div>
    </div>
  );
};

export default VariantItemCard;
