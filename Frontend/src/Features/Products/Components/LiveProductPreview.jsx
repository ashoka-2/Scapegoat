import React, { useState } from "react";

/**
 * LiveProductPreview Component
 * Instant Live Product Page Preview for sellers (Shopify / Apple-level polish)
 */
const LiveProductPreview = ({ formData, mainImages, mainAttributes, variantsList }) => {
  const [selectedVariant, setSelectedVariant] = useState(0);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const imagesToDisplay =
    variantsList[selectedVariant]?.images?.length > 0
      ? variantsList[selectedVariant].images
      : mainImages.length > 0
      ? mainImages
      : [{ preview: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800" }];

  const currentVariantObj = variantsList[selectedVariant];
  const displayPrice = currentVariantObj?.priceAmount || formData.sellingPriceAmount || formData.maxPriceAmount || "0";
  const displayMrp = formData.maxPriceAmount || displayPrice;

  const isDiscounted = Number(displayMrp) > Number(displayPrice);
  const discountPercent = isDiscounted
    ? Math.round(((Number(displayMrp) - Number(displayPrice)) / Number(displayMrp)) * 100)
    : 0;

  return (
    <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 shadow-xl space-y-8 max-w-5xl mx-auto">
      <div className="flex items-center justify-between border-b border-border-theme/60 pb-4">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-black uppercase tracking-widest text-accent bg-accent/10 px-3 py-1 rounded-full border border-accent/20">
            👁️ Instant Live Storefront Preview
          </span>
        </div>
        <span className="text-xs text-foreground/50 font-mono">
          Status: <strong className="text-emerald-500 uppercase">{formData.status || "published"}</strong>
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Photo Gallery Column */}
        <div className="space-y-4">
          <div className="relative rounded-2xl overflow-hidden border border-border-theme/60 bg-background aspect-square shadow-inner">
            <img
              src={imagesToDisplay[activeImageIndex]?.preview || imagesToDisplay[activeImageIndex]?.url || imagesToDisplay[0]?.preview}
              alt="Live Preview"
              className="w-full h-full object-cover"
            />
            {isDiscounted && (
              <span className="absolute top-3 right-3 bg-red-500 text-white font-extrabold text-xs px-3 py-1 rounded-full shadow">
                -{discountPercent}% OFF
              </span>
            )}
          </div>

          {imagesToDisplay.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto pb-1">
              {imagesToDisplay.map((img, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-xl overflow-hidden border-2 transition cursor-pointer flex-shrink-0 ${
                    activeImageIndex === idx ? "border-accent ring-2 ring-accent/30" : "border-border-theme opacity-70"
                  }`}
                >
                  <img src={img.preview || img.url} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Details Column */}
        <div className="space-y-6">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-accent block mb-1">
              {formData.brandName || "SCAPEGOAT Collection"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">
              {formData.title || "Untitled Product"}
            </h1>
            {formData.shortDescription && (
              <p className="text-xs sm:text-sm text-foreground/70 mt-2 font-medium">
                {formData.shortDescription}
              </p>
            )}
          </div>

          {/* Pricing Box */}
          <div className="flex items-baseline space-x-3 bg-background border border-border-theme p-4 rounded-2xl">
            <span className="text-3xl font-black text-foreground">₹{Number(displayPrice).toLocaleString("en-IN")}</span>
            {isDiscounted && (
              <span className="text-sm font-semibold line-through text-foreground/40">
                ₹{Number(displayMrp).toLocaleString("en-IN")}
              </span>
            )}
            <span className="text-xs text-emerald-500 font-bold ml-auto">Inclusive of all taxes</span>
          </div>

          {/* Attributes / Variants Selector */}
          {mainAttributes.length > 0 && (
            <div className="space-y-4 border-t border-border-theme/60 pt-4">
              {mainAttributes.map((attr, idx) => (
                <div key={idx} className="space-y-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                    {attr.name || attr.key}:
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {(attr.options || attr.values || []).map((opt, oIdx) => (
                      <span
                        key={oIdx}
                        className="px-3 py-1.5 rounded-xl border border-border-theme bg-surface text-xs font-bold text-foreground"
                      >
                        {opt}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Variant Selector dropdown */}
          {variantsList.length > 0 && (
            <div className="space-y-2 border-t border-border-theme/60 pt-4">
              <label className="text-xs font-bold uppercase tracking-wider text-foreground/70 block">
                Select Variant Combination ({variantsList.length} Available):
              </label>
              <select
                value={selectedVariant}
                onChange={(e) => {
                  setSelectedVariant(Number(e.target.value));
                  setActiveImageIndex(0);
                }}
                className="w-full bg-background border border-border-theme rounded-xl px-4 py-3 text-sm font-bold text-foreground outline-none focus:border-accent cursor-pointer"
              >
                {variantsList.map((v, idx) => (
                  <option key={v.id || idx} value={idx}>
                    {v.name || `Variant ${idx + 1}`} — ₹{v.priceAmount || displayPrice}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Stock Availability */}
          <div className="border-t border-border-theme/60 pt-4 flex items-center justify-between text-xs font-bold">
            <span>Stock Status:</span>
            {formData.manageStock ? (
              Number(formData.stock) > 0 ? (
                <span className="text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  In Stock ({formData.stock} units)
                </span>
              ) : (
                <span className="text-red-500 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                  Out of Stock
                </span>
              )
            ) : (
              <span className="text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                In Stock (Always Available)
              </span>
            )}
          </div>

          {/* Description */}
          {formData.description && (
            <div className="border-t border-border-theme/60 pt-4 space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-foreground/70">
                Description & Story
              </h3>
              <div
                dangerouslySetInnerHTML={{
                  __html: String(formData.description)
                    .replace(/<font([^>]*)\scolor=["']?(#ffffff|#000000|#fff|#000|white|black|#131313|#0a0a0a|#18181b|#e5e2e1)["']?([^>]*)>/gi, '<font$1$3>')
                    .replace(/color:\s*(#ffffff|#000000|#fff|#000|white|black|rgb\(255,\s*255,\s*255\)|rgb\(0,\s*0,\s*0\)|#131313|#0a0a0a|#18181b|#e5e2e1);?/gi, "color: inherit;")
                    .replace(/background-color:\s*(#ffffff|#000000|#fff|#000|white|black|rgb\(255,\s*255,\s*255\)|rgb\(0,\s*0,\s*0\));?/gi, "")
                }}
                className="text-xs leading-relaxed rich-description-render max-w-none"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LiveProductPreview;
