import React from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

const SetupBundleCard = ({ bundle, onAddToCart, onAddToWishlist }) => {
  if (!bundle || !bundle.items?.length) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-surface border border-border-theme rounded-3xl p-5 space-y-4 shadow-lg hover:border-blue-500/40 transition-all group overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400">
              Hardware Setup Bundle
            </span>
            <span className="text-[10px] text-foreground/40 font-mono">
              {bundle.items.length} Compatible Items
            </span>
          </div>
          <h3 className="text-base font-black uppercase tracking-tight text-foreground mt-1">
            {bundle.title}
          </h3>
          <p className="text-xs text-foreground/60">{bundle.description}</p>
        </div>

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

      {/* Component Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
        {bundle.items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-2.5 rounded-2xl bg-background/60 border border-border-theme/60 hover:border-border-theme transition"
          >
            <div className="w-10 h-12 rounded-xl overflow-hidden bg-surface border border-border-theme shrink-0">
              {item.image ? (
                <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground/20 text-xs">
                  <i className="ri-computer-line" />
                </div>
              )}
            </div>

            <div className="min-w-0 flex-1 space-y-0.5">
              <span className="text-[9px] font-black uppercase tracking-wider text-blue-400 block">
                {item.tier}
              </span>
              <Link
                to={`/product/${item.product}`}
                className="text-xs font-bold text-foreground hover:text-blue-400 truncate block transition"
              >
                {item.title}
              </Link>
              <span className="text-xs font-mono font-black text-foreground block">
                ₹{item.price?.toLocaleString()}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* 1-Click Action Buttons */}
      <div className="flex items-center gap-2 pt-2 border-t border-border-theme/40">
        <button
          type="button"
          onClick={() => onAddToCart(bundle)}
          className="flex-1 py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 hover:scale-[1.02] active:scale-95 transition cursor-pointer"
        >
          <i className="ri-shopping-bag-3-fill text-sm" />
          <span>Add Complete Setup to Bag</span>
        </button>

        <button
          type="button"
          onClick={() => onAddToWishlist(bundle)}
          className="py-2.5 px-4 rounded-2xl bg-surface border border-border-theme hover:border-blue-500 text-foreground hover:text-blue-400 text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
        >
          <i className="ri-heart-3-line text-sm" />
          <span className="hidden sm:inline">Save Setup</span>
        </button>
      </div>
    </motion.div>
  );
};

export default SetupBundleCard;
