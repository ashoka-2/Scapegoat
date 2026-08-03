import React, { useState, useRef, useEffect } from "react";
import FormField from "./FormField";
import ImageDropzone from "./ImageDropzone";
import { generateEAN13Barcode } from "../../../utils/barcodeUtils";
import { isColorAttribute } from "../../../utils/attributeUtils";

const inputClass =
  "w-full bg-background border border-border-theme focus:border-accent rounded-xl px-4 py-2.5 text-xs text-foreground outline-none transition-all duration-300 focus:ring-4 focus:ring-accent/10 placeholder:text-foreground/25 font-medium";

const selectClass =
  "w-full bg-background border border-border-theme hover:border-accent/40 focus:border-accent rounded-xl px-3.5 py-2.5 text-xs font-bold text-foreground outline-none cursor-pointer transition-all duration-200 focus:ring-4 focus:ring-accent/10";

const VariantItemCard = ({
  variant,
  vIdx,
  mainAttributes = [],
  variantsList = [],
  handleVariantChange,
  handleVariantImagesChange,
  removeVariant,
  manageStock = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const bodyRef = useRef(null);

  // Raw attributes map
  const rawAttrs =
    typeof variant.attributes?.forEach === "function"
      ? Object.fromEntries(variant.attributes)
      : variant.attributes instanceof Map
      ? Object.fromEntries(variant.attributes)
      : variant.attributes?._doc || variant.attributes || {};

  const attrEntries = Object.entries(rawAttrs);

  const attrSummary =
    attrEntries.length > 0
      ? attrEntries.map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`).join(" • ")
      : variant.name || `Variation #${vIdx + 1}`;

  // Other variants for duplicate detection
  const otherVariants = variantsList.filter((v) => v.id !== variant.id);
  const usedCombosByOthers = otherVariants.map((v) => {
    const r =
      typeof v.attributes?.forEach === "function"
        ? Object.fromEntries(v.attributes)
        : v.attributes || {};
    return Object.entries(r)
      .sort()
      .map(([k, val]) => `${k.toLowerCase()}=${String(val).toLowerCase()}`)
      .join("|");
  });

  const isOptionDuplicate = (attrKey, optValue) => {
    const hypothetical = { ...rawAttrs, [attrKey]: optValue };
    const hypKey = Object.entries(hypothetical)
      .sort()
      .map(([k, val]) => `${k.toLowerCase()}=${String(val).toLowerCase()}`)
      .join("|");
    return usedCombosByOthers.includes(hypKey);
  };

  // Color badge helper
  const getColorBadge = (name, value) => {
    if (!isColorAttribute(name)) return null;
    const colorMap = {
      white: "#ffffff", black: "#1a1a1a", red: "#ef4444", blue: "#3b82f6",
      green: "#22c55e", yellow: "#eab308", orange: "#f97316", purple: "#a855f7",
      pink: "#ec4899", grey: "#6b7280", gray: "#6b7280", brown: "#92400e",
      navy: "#1e3a5f", beige: "#d4b896", gold: "#d97706", silver: "#9ca3af",
    };
    const hex = colorMap[String(value).trim().toLowerCase()];
    return hex ? (
      <span
        className="inline-block w-3 h-3 rounded-full border border-border-theme/80 shrink-0 shadow-sm"
        style={{ backgroundColor: hex }}
      />
    ) : null;
  };

  return (
    <div
      className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
        isOpen
          ? "border-accent/60 shadow-xl shadow-accent/5 bg-surface"
          : "border-border-theme bg-surface/60 hover:border-accent/40"
      }`}
    >
      {/* ── Collapsed Header (Header Bar) ── */}
      <div
        className="flex items-center gap-3 px-4 py-3.5 cursor-pointer select-none"
        onClick={() => setIsOpen((o) => !o)}
      >
        {/* Variant index badge */}
        <span className="font-mono font-extrabold text-[11px] text-accent bg-accent/10 border border-accent/20 px-2.5 py-1 rounded-xl shrink-0">
          #{vIdx + 1}
        </span>

        {/* Static attribute badges summary (NO DROPDOWNS HERE TO PREVENT DUPLICATION) */}
        <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
          {mainAttributes.length > 0 ? (
            mainAttributes.map((attr) => {
              const key = attr.name || attr.key;
              const val = rawAttrs[key] || "";
              if (!val) return null;
              return (
                <span
                  key={key}
                  className="inline-flex items-center gap-1.5 bg-background/80 border border-border-theme px-3 py-1 rounded-xl text-xs font-bold text-foreground"
                >
                  <span className="text-accent font-semibold">{key}:</span>
                  {getColorBadge(key, val)}
                  <span>{val}</span>
                </span>
              );
            })
          ) : (
            <span className="text-xs font-bold text-foreground/80 truncate">{attrSummary}</span>
          )}
        </div>

        {/* Price & stock preview */}
        {!isOpen && (
          <div className="hidden sm:flex items-center gap-3 shrink-0 text-xs text-foreground/70">
            {variant.priceAmount && (
              <span className="font-extrabold text-accent">₹{Number(variant.priceAmount).toLocaleString()}</span>
            )}
            {manageStock && variant.stock !== undefined && (
              <span className="font-bold bg-background/60 border border-border-theme/60 px-2 py-0.5 rounded-lg text-[11px]">
                Stock: {variant.stock}
              </span>
            )}
            {(variant.images?.length || 0) > 0 && (
              <span className="flex items-center gap-1 text-[11px] font-bold text-foreground/60">
                <i className="ri-image-line text-accent" />
                {variant.images.length}
              </span>
            )}
          </div>
        )}

        {/* Action icons */}
        <div className="flex items-center gap-2 shrink-0" onClick={(e) => e.stopPropagation()}>
          <button
            type="button"
            onClick={() => removeVariant(variant.id)}
            className="text-red-400 hover:text-red-500 text-xs bg-red-500/10 hover:bg-red-500/20 p-2 rounded-xl border border-red-500/20 cursor-pointer transition"
            title="Delete variation"
          >
            <i className="ri-delete-bin-line" />
          </button>
          <button
            type="button"
            onClick={() => setIsOpen((o) => !o)}
            className="text-foreground/60 hover:text-accent text-xs p-2 rounded-xl border border-border-theme hover:border-accent/40 cursor-pointer transition bg-background"
          >
            <i className={`ri-arrow-${isOpen ? "up" : "down"}-s-line text-sm`} />
          </button>
        </div>
      </div>

      {/* ── Expandable Body (Single Set of Beautiful Attribute Selectors) ── */}
      <div
        style={{
          maxHeight: isOpen ? `${bodyRef.current?.scrollHeight || 1200}px` : "0px",
          transition: "max-height 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease",
          opacity: isOpen ? 1 : 0,
          overflow: "hidden",
        }}
      >
        <div ref={bodyRef} className="px-5 pb-6 space-y-5 border-t border-border-theme/40 pt-5">
          {/* SINGLE Set of Beautifully Styled Attribute Selectors */}
          {mainAttributes.length > 0 && (
            <div className="space-y-3">
              <label className="text-xs font-extrabold text-accent uppercase tracking-wider flex items-center gap-1.5">
                <i className="ri-list-settings-line" />
                <span>Variation Attribute Options</span>
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {mainAttributes.map((attr) => {
                  const attrKey = attr.name || attr.key;
                  const options = attr.options || attr.values || [];
                  const currentValue = rawAttrs[attrKey] || options[0] || "";

                  return (
                    <FormField key={attrKey} label={attrKey}>
                      <div className="relative">
                        <select
                          value={currentValue}
                          onChange={(e) => {
                            const newAttrs = { ...rawAttrs, [attrKey]: e.target.value };
                            const baseName = (variant.name || "").split(" - ")[0] || variant.name;
                            const newSummary = Object.values(newAttrs).join(" / ");
                            handleVariantChange(variant.id, "attributes", newAttrs);
                            handleVariantChange(variant.id, "name", `${baseName} - ${newSummary}`);
                          }}
                          className={selectClass}
                        >
                          {options.map((opt) => {
                            const isDup = isOptionDuplicate(attrKey, opt);
                            return (
                              <option
                                key={opt}
                                value={opt}
                                disabled={isDup && opt !== currentValue}
                                className="bg-surface text-foreground font-medium py-1"
                              >
                                {opt} {isDup && opt !== currentValue ? " (already exists)" : ""}
                              </option>
                            );
                          })}
                        </select>
                      </div>
                    </FormField>
                  );
                })}
              </div>
            </div>
          )}

          {/* Pricing, Inventory, SKU, Barcode */}
          <div className={`grid grid-cols-1 sm:grid-cols-2 ${manageStock ? "md:grid-cols-4" : "md:grid-cols-3"} gap-4 pt-2 border-t border-border-theme/30`}>
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

            <FormField label="SKU">
              <input
                type="text"
                value={variant.sku || ""}
                onChange={(e) => handleVariantChange(variant.id, "sku", e.target.value)}
                placeholder="SKU-001"
                className={inputClass}
              />
            </FormField>

            <FormField label="Barcode">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={variant.barcode || ""}
                  onChange={(e) => handleVariantChange(variant.id, "barcode", e.target.value)}
                  placeholder="EAN-13"
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() => handleVariantChange(variant.id, "barcode", generateEAN13Barcode())}
                  title="Generate EAN-13 Barcode"
                  className="px-3 py-2 bg-accent/10 border border-accent/30 text-accent font-bold rounded-xl text-xs hover:bg-accent hover:text-accent-content transition cursor-pointer shrink-0"
                >
                  <i className="ri-flashlight-line" />
                </button>
              </div>
            </FormField>
          </div>

          {/* Variant Image Gallery */}
          <div className="space-y-2 pt-2 border-t border-border-theme/30">
            <label className="text-xs font-extrabold text-foreground/90 flex items-center gap-1.5">
              <i className="ri-image-line text-accent" />
              <span>Variant Photos — {attrSummary}</span>
            </label>
            <ImageDropzone
              images={variant.images || []}
              onImagesChange={(newImgs) => handleVariantImagesChange(variant.id, newImgs)}
              maxImages={7}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VariantItemCard;
