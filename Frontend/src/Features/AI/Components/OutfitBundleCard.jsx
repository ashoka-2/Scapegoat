import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

/**
 * Tier Icons and Styling Badges for Head-to-Toe Outfit Layers
 */
const TIER_META = {
  "Headwear & Eyewear": { icon: "ri-glasses-fill", color: "text-purple-400 bg-purple-500/10 border-purple-500/20" },
  Topwear: { icon: "ri-t-shirt-fill", color: "text-accent bg-accent/10 border-accent/20" },
  Bottomwear: { icon: "ri-pant-fill", color: "text-blue-400 bg-blue-500/10 border-blue-500/20" },
  Footwear: { icon: "ri-footprint-fill", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20" },
  Accessories: { icon: "ri-sparkling-fill", color: "text-amber-400 bg-amber-500/10 border-amber-500/20" },
};

const OutfitBundleCard = ({ bundle, onAddToCart, onAddToWishlist, onTryOn }) => {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  if (!bundle || !bundle.items?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border-theme rounded-3xl p-5 space-y-4 shadow-lg hover:border-accent/40 transition-all group overflow-hidden"
    >
      {/* ── Bundle Header ── */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/20 text-accent">
              Complete Look
            </span>
            <span className="text-[10px] text-foreground/40 font-mono">
              {bundle.items.length} Coordinated Pieces
            </span>
          </div>
          <h3 className="text-base font-black uppercase tracking-tight text-foreground mt-1">
            {bundle.title}
          </h3>
          <p className="text-xs text-foreground/60">{bundle.description}</p>
        </div>

        {/* Pricing & Savings Badge */}
        <div className="text-right">
          <div className="text-lg font-black font-mono text-foreground">
            ₹{bundle.totalPrice?.toLocaleString()}
          </div>
          {bundle.savings > 0 && (
            <span className="text-[10px] font-bold text-emerald-500 font-mono bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
              Bundle Savings: ₹{bundle.savings}
            </span>
          )}
        </div>
      </div>

      {/* ── Visual Try-On Render Banner (if generated) ── */}
      {bundle.visualImage && (
        <div className="relative rounded-2xl overflow-hidden border border-accent/30 group/visual">
          <img
            src={bundle.visualImage}
            alt="Virtual Try-On Render"
            className="w-full h-48 sm:h-56 object-cover cursor-pointer group-hover/visual:scale-105 transition duration-500"
            onClick={() => setImageModalOpen(true)}
          />
          <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-background/80 backdrop-blur-md border border-border-theme text-[10px] font-black uppercase tracking-wider text-accent flex items-center gap-1.5 shadow-md">
            <i className="ri-sparkling-fill" />
            <span>AI Virtual Try-On</span>
          </div>
        </div>
      )}

      {/* ── Multi-Tier Head-to-Toe Layer Breakdown ── */}
      <div className="space-y-2.5 pt-1">
        {bundle.items.map((item, idx) => {
          const tierMeta = TIER_META[item.tier] || {
            icon: "ri-price-tag-3-line",
            color: "text-accent bg-accent/10 border-accent/20",
          };

          return (
            <div
              key={idx}
              className="flex items-center justify-between gap-3 p-2.5 rounded-2xl bg-background/60 border border-border-theme/60 hover:border-border-theme transition"
            >
              {/* Left: Thumbnail & Tier Badge */}
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative w-12 h-14 rounded-xl overflow-hidden bg-surface border border-border-theme shrink-0">
                  {item.image ? (
                    <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-foreground/20 text-xs">
                      <i className="ri-image-line" />
                    </div>
                  )}
                </div>

                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md border flex items-center gap-1 ${tierMeta.color}`}
                    >
                      <i className={tierMeta.icon} />
                      <span>{item.tier}</span>
                    </span>
                    {item.selectedAttributes?.Size && (
                      <span className="text-[9px] font-mono font-bold bg-surface px-1.5 py-0.2 rounded border border-border-theme text-foreground/60">
                        Size: {item.selectedAttributes.Size}
                      </span>
                    )}
                  </div>
                  <Link
                    to={`/product/${item.product}`}
                    className="text-xs font-bold text-foreground hover:text-accent truncate block transition"
                    title={item.title}
                  >
                    {item.title}
                  </Link>
                </div>
              </div>

              {/* Right: Item Price & Link */}
              <div className="text-right shrink-0">
                <span className="text-xs font-mono font-black text-foreground">
                  ₹{item.price?.toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* ── 1-Click Action Buttons ── */}
      <div className="flex items-center gap-2 pt-2 border-t border-border-theme/40">
        <button
          type="button"
          onClick={() => onAddToCart(bundle)}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-accent text-accent-content text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-accent/20 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
        >
          <i className="ri-shopping-bag-3-fill text-sm" />
          <span>Add Full Outfit to Bag</span>
        </button>

        {onTryOn && (
          <button
            type="button"
            onClick={() => onTryOn(bundle)}
            className="py-2.5 px-3.5 rounded-2xl bg-surface border border-accent/40 text-accent hover:bg-accent/10 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
            title="Try this outfit on your face/body"
          >
            <i className="ri-sparkling-2-line text-sm" />
            <span className="hidden sm:inline">Try On</span>
          </button>
        )}

        <button
          type="button"
          onClick={() => onAddToWishlist(bundle)}
          className="py-2.5 px-3.5 rounded-2xl bg-surface border border-border-theme hover:border-accent text-foreground hover:text-accent text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
          title="Save entire outfit to wishlist"
        >
          <i className="ri-heart-3-line text-sm" />
          <span className="hidden sm:inline">Save</span>
        </button>
      </div>

      {/* Fullscreen Zoom Modal for Try-on Image */}
      {imageModalOpen && bundle.visualImage && (
        <div
          className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          onClick={() => setImageModalOpen(false)}
        >
          <div className="relative max-w-xl w-full max-h-[90vh] rounded-3xl overflow-hidden shadow-2xl border border-white/20">
            <img src={bundle.visualImage} alt="Try On Large" className="w-full h-auto object-contain max-h-[85vh]" />
            <button
              onClick={() => setImageModalOpen(false)}
              className="absolute top-4 right-4 w-10 h-10 rounded-full bg-black/60 text-white flex items-center justify-center text-lg hover:bg-black transition cursor-pointer"
            >
              <i className="ri-close-line" />
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default OutfitBundleCard;
