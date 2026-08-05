import React from "react";
import ProductCardSkeleton from "./ProductCardSkeleton";

/**
 * ShopSkeleton Component
 * Responsive skeleton matching Shop.jsx layout (Filter header + Sidebar + Grid)
 */
const ShopSkeleton = () => {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-6 space-y-8 animate-pulse">
      {/* Top Filter & Search Header Skeleton */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border-theme/40 pb-6">
        <div className="space-y-2 w-full sm:w-auto">
          <div className="w-28 h-3.5 bg-accent/20 rounded-md" />
          <div className="w-48 h-8 bg-foreground/20 rounded-xl" />
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-64 h-10 bg-surface border border-border-theme/50 rounded-full" />
          <div className="w-28 h-10 bg-surface border border-border-theme/50 rounded-full" />
        </div>
      </div>

      {/* Main Content Layout (Sidebar + Grid) */}
      <div className="flex gap-8">
        {/* Left Filter Sidebar Skeleton (Desktop) */}
        <div className="hidden lg:block w-64 shrink-0 space-y-6">
          <div className="h-6 w-32 bg-foreground/20 rounded-lg" />
          <div className="space-y-3">
            <div className="h-4 w-full bg-foreground/10 rounded-md" />
            <div className="h-4 w-5/6 bg-foreground/10 rounded-md" />
            <div className="h-4 w-4/6 bg-foreground/10 rounded-md" />
          </div>
          <div className="h-40 bg-surface border border-border-theme/40 rounded-2xl" />
        </div>

        {/* Product Grid Skeleton */}
        <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {Array.from({ length: 8 }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default ShopSkeleton;
