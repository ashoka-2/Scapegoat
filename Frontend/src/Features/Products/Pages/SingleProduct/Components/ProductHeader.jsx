import React from "react";

/**
 * ProductHeader — brand chip, live stock badge, title and short description.
 */
export default function ProductHeader({ product, isOutOfStock, currentStock }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        {product.brand && (
          <span className="px-3 py-1 rounded-lg bg-surface border border-border-theme text-foreground/80 font-bold text-xs">
            {product.brand.name}
          </span>
        )}
        {isOutOfStock ? (
          <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-red-400"></span>
            Out of Stock
          </span>
        ) : currentStock <= 5 ? (
          <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
            Only {currentStock} left!
          </span>
        ) : (
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
            In Stock ({currentStock} available)
          </span>
        )}
      </div>

      <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
        {product.title}
      </h1>

      {product.shortDescription && (
        <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed font-medium">
          {product.shortDescription}
        </p>
      )}
    </div>
  );
}
