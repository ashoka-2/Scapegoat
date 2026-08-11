import React from "react";
import {
  getActiveAttrVal,
  getColorHex,
  isColorAttribute,
  matchOptionInVariant,
} from "../helpers";

/**
 * AttributeSelector — the color swatches + size/other pill chips, plus the
 * "Selected:" summary pill. Out-of-stock options render disabled/greyed.
 */
export default function AttributeSelector({
  sortedAttributes,
  selectedAttributes,
  selectedVariant,
  product,
  isOptionAvailable,
  onSelectOption,
}) {
  if (!sortedAttributes || sortedAttributes.length === 0) return null;

  return (
    <div className="space-y-5 pt-2 border-t border-border-theme">
      {/* Selected variant summary pill */}
      {selectedVariant && Object.keys(selectedAttributes || {}).length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Selected:</span>
          {Object.entries(selectedAttributes).map(([k, v]) => (
            <span
              key={k}
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent text-[11px] font-extrabold"
            >
              <span className="text-accent/60 font-normal">{k}:</span>
              {v}
            </span>
          ))}
          {selectedVariant?.price?.amount && (
            <span className="ml-auto text-xs font-extrabold text-accent">
              ₹{Number(selectedVariant.price.amount).toLocaleString()}
            </span>
          )}
        </div>
      )}

      {sortedAttributes.map((attr, idx) => {
        const attrName = attr.name || attr.key;
        const options = attr.options || attr.values || [];
        const foundVal = getActiveAttrVal(selectedAttributes, attrName);
        const activeVal = foundVal || (options.length > 0 ? options[0] : "");
        const isColorAttr = isColorAttribute(attrName);

        if (isColorAttr) {
          return (
            <div key={idx} className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">{attrName}</span>
                <span className="text-xs font-extrabold text-foreground">{activeVal}</span>
              </div>

              {/* Color swatches with variant images */}
              <div className="flex flex-wrap gap-3">
                {options.map((opt, oIdx) => {
                  const isSelected =
                    String(activeVal).trim().toLowerCase() === String(opt).trim().toLowerCase();
                  const available = isOptionAvailable(attrName, opt);

                  // Find variant specific image for this color (or fallback to main cover image)
                  const matchedVarForOpt = product.variants?.find((v) => {
                    return matchOptionInVariant(v, attrName, opt) && v.images?.length > 0;
                  });

                  const optImg =
                    matchedVarForOpt?.images?.[0]?.url ||
                    product.variants?.find((v) => matchOptionInVariant(v, attrName, opt))?.images?.[0]?.url ||
                    product.images?.[0]?.url ||
                    (typeof product.images?.[0] === "string" ? product.images[0] : null);
                  const hexColor = getColorHex(opt);

                  return (
                    <button
                      key={oIdx}
                      type="button"
                      onClick={() => {
                        if (!available) return;
                        onSelectOption(attrName, opt);
                      }}
                      disabled={!available}
                      className={`group relative flex flex-col items-center p-1.5 rounded-2xl border-2 transition-all duration-200 ${
                        isSelected
                          ? "border-accent ring-4 ring-accent/20 bg-accent/5 scale-105 shadow-md cursor-pointer"
                          : available
                          ? "border-border-theme hover:border-accent/50 bg-background cursor-pointer"
                          : "border-border-theme/30 bg-surface/30 opacity-30 cursor-not-allowed grayscale"
                      }`}
                    >
                      <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-surface border border-border-theme/50 relative flex items-center justify-center">
                        {optImg ? (
                          <img src={optImg} alt={opt} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                        ) : hexColor ? (
                          <div className="w-8 h-8 rounded-full border border-border-theme/80" style={{ backgroundColor: hexColor }} />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center font-bold text-xs text-foreground/60">{opt}</div>
                        )}
                        {isSelected && (
                          <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
                            <i className="ri-check-line text-accent text-base font-black" />
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] font-extrabold mt-1 uppercase ${isSelected ? "text-accent" : "text-foreground/60"}`}>
                        {opt}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        }

        // Size / Other attributes — pill buttons
        return (
          <div key={idx} className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">{attrName}</span>
              <span className="text-xs font-extrabold text-foreground">{activeVal}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              {options.map((opt, oIdx) => {
                const isSelected =
                  String(activeVal).trim().toLowerCase() === String(opt).trim().toLowerCase();
                const available = isOptionAvailable(attrName, opt);

                return (
                  <button
                    key={oIdx}
                    type="button"
                    onClick={() => {
                      if (!available) return;
                      onSelectOption(attrName, opt);
                    }}
                    disabled={!available}
                    className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all duration-200 ${
                      isSelected
                        ? "bg-accent text-accent-content border-accent shadow-md ring-4 ring-accent/20 cursor-pointer"
                        : available
                        ? "bg-background text-foreground/80 border-border-theme hover:border-accent/50 hover:bg-accent/5 cursor-pointer"
                        : "bg-surface/30 text-foreground/20 border-border-theme/30 opacity-30 cursor-not-allowed line-through"
                    }`}
                  >
                    {opt}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
