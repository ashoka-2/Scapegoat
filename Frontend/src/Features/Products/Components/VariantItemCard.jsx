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

  return (
    <div className="bg-background border border-border-theme rounded-2xl p-6 space-y-6 relative shadow-sm">
      {/* Header Bar */}
      <div className="flex items-center justify-between border-b border-border-theme pb-3">
        <span className="font-bold text-sm text-accent">
          Variant #{vIdx + 1}: {variant.name || `Variant ${vIdx + 1}`}
        </span>
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

        {variant.dynamicAttributes && variant.dynamicAttributes.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {variant.dynamicAttributes.map((da, daIdx) => {
              const vals = da.values || da.options || (da.value ? [da.value] : []);
              return (
                <span
                  key={daIdx}
                  className="bg-surface border border-border-theme rounded-xl px-3.5 py-1.5 text-xs text-foreground flex items-center space-x-2 shadow-sm"
                >
                  <span>
                    <strong className="text-accent">{da.key || da.name}:</strong>{" "}
                    {vals.join(", ")}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeVariantAttribute(variant.id, daIdx)}
                    className="text-red-400 hover:text-red-600 font-bold ml-1 cursor-pointer"
                    title="Remove Attribute"
                  >
                    ✕
                  </button>
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* Dedicated Photos Gallery */}
      <div className="pt-3 border-t border-border-theme">
        <p className="text-xs font-bold text-foreground/80 mb-2">
          Variant Photos Gallery (Upload photo gallery for this variant):
        </p>
        <ImageDropzone
          images={variant.images || []}
          setImages={(updater) => handleVariantImagesChange(variant.id, updater)}
          maxImages={7}
        />
      </div>
    </div>
  );
};

export default VariantItemCard;
