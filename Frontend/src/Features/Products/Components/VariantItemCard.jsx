import React from "react";
import FormField from "./FormField";
import ImageDropzone from "./ImageDropzone";
import { generateEAN13Barcode } from "../../../utils/barcodeUtils";

const inputClass =
  "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-all duration-300 focus:ring-4 focus:ring-accent/10 placeholder:text-foreground/25 font-medium";

/**
 * VariantItemCard Component (WooCommerce Style)
 * Displays attribute dropdown selectors, variant specific images, price, stock, SKU, and barcode.
 */
const VariantItemCard = ({
  variant,
  vIdx,
  mainAttributes = [],
  handleVariantChange,
  handleVariantImagesChange,
  removeVariant,
  manageStock = true,
}) => {
  // Get attributes map (e.g. { Color: "Red", Size: "M" })
  const rawAttrs =
    typeof variant.attributes?.forEach === "function"
      ? Object.fromEntries(variant.attributes)
      : variant.attributes instanceof Map
      ? Object.fromEntries(variant.attributes)
      : variant.attributes._doc || variant.attributes || {};

  const attrSummary = Object.entries(rawAttrs)
    .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
    .join(" • ") || variant.name || `Variation #${vIdx + 1}`;

  const handleAutoGenerateBarcode = () => {
    const code = generateEAN13Barcode();
    handleVariantChange(variant.id, "barcode", code);
  };

  return (
    <div className="bg-surface border border-border-theme rounded-2xl p-5 space-y-5 relative shadow-sm transition-all hover:border-accent/40">
      {/* Header Bar (WooCommerce style #126 Variation header) */}
      <div className="flex items-center justify-between border-b border-border-theme pb-3">
        <div className="flex items-center space-x-2">
          <span className="font-mono font-extrabold text-xs text-accent">#{vIdx + 126}</span>
          <span className="font-bold text-sm text-foreground">{attrSummary}</span>
        </div>
        <button
          type="button"
          onClick={() => removeVariant(variant.id)}
          className="text-red-400 hover:text-red-600 font-bold text-xs bg-red-500/10 px-3 py-1.5 rounded-xl border border-red-500/20 cursor-pointer transition flex items-center gap-1"
        >
          <i className="ri-delete-bin-line" />
          <span>Remove Variation</span>
        </button>
      </div>

      {/* WooCommerce Style Attribute Selectors */}
      {mainAttributes.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 bg-background border border-border-theme p-3 rounded-xl">
          {mainAttributes.map((attr) => {
            const attrKey = attr.name || attr.key;
            const options = attr.options || attr.values || [];
            const currentValue = rawAttrs[attrKey] || options[0] || "";

            return (
              <FormField key={attrKey} label={attrKey}>
                <select
                  value={currentValue}
                  onChange={(e) => {
                    const newAttrs = { ...rawAttrs, [attrKey]: e.target.value };
                    handleVariantChange(variant.id, "attributes", newAttrs);
                  }}
                  className="w-full bg-surface border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-foreground outline-none cursor-pointer focus:border-accent"
                >
                  {options.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </FormField>
            );
          })}
        </div>
      )}

      {/* Editable Fields: Price, Stock, SKU, Barcode */}
      <div className={`grid grid-cols-1 sm:grid-cols-2 ${manageStock ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4`}>
        <FormField label="Price (₹)" required>
          <input
            type="number"
            value={variant.priceAmount || ""}
            onChange={(e) => handleVariantChange(variant.id, "priceAmount", e.target.value)}
            placeholder="1999"
            className={inputClass}
            min={0}
          />
        </FormField>

        {manageStock && (
          <FormField label="Stock Quantity">
            <input
              type="number"
              value={variant.stock !== undefined ? variant.stock : 10}
              onChange={(e) => handleVariantChange(variant.id, "stock", e.target.value)}
              placeholder="10"
              className={inputClass}
              min={0}
            />
          </FormField>
        )}

        <FormField label="SKU Code">
          <input
            type="text"
            value={variant.sku || ""}
            onChange={(e) => handleVariantChange(variant.id, "sku", e.target.value)}
            placeholder="SKU-001"
            className={inputClass}
          />
        </FormField>

        <FormField label="Barcode (EAN-13)">
          <div className="flex gap-2">
            <input
              type="text"
              value={variant.barcode || ""}
              onChange={(e) => handleVariantChange(variant.id, "barcode", e.target.value)}
              placeholder="8901234567890"
              className={inputClass}
            />
            <button
              type="button"
              onClick={handleAutoGenerateBarcode}
              title="Auto Generate EAN-13 Barcode"
              className="px-3 py-2 bg-accent/10 border border-accent/30 text-accent font-bold rounded-xl text-xs whitespace-nowrap hover:bg-accent hover:text-accent-content transition cursor-pointer flex items-center gap-1"
            >
              <i className="ri-flashlight-line" />
            </button>
          </div>
        </FormField>
      </div>

      {/* Variation Gallery Images & Videos Upload (WooCommerce Style) */}
      <div className="space-y-2 pt-2 border-t border-border-theme/40">
        <label className="text-xs font-bold text-foreground/80 flex items-center gap-1.5">
          <i className="ri-image-line text-accent" />
          <span>Variation Gallery Images ({attrSummary})</span>
        </label>
        <ImageDropzone
          images={variant.images || []}
          onImagesChange={(newImgs) => handleVariantImagesChange(variant.id, newImgs)}
          maxImages={7}
        />
      </div>
    </div>
  );
};

export default VariantItemCard;
