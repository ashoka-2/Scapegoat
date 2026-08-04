import React from "react";

/**
 * ProductCardSkeleton Component
 * Matches exact dimensions, rounded corners, padding, and layout of ProductCard.jsx
 */
const ProductCardSkeleton = () => {
  return (
    <div className="relative bg-surface dark:bg-[#121212] border border-border-theme/30 rounded-[2.2rem] w-full max-w-[240px] mx-auto shadow-sm p-2.5 animate-pulse select-none flex-shrink-0">
      {/* Image Skeleton with aspect-[4/5] */}
      <div className="relative w-full aspect-[4/5] rounded-[1.6rem] bg-foreground/10 overflow-hidden">
        <div className="absolute top-3 left-3 right-3 flex justify-between items-center z-10">
          <div className="w-16 h-4 rounded-full bg-foreground/15" />
          <div className="w-7 h-7 rounded-full bg-foreground/15" />
        </div>
      </div>

      {/* Details Skeleton */}
      <div className="px-2 pt-3 pb-1 space-y-3">
        <div className="space-y-1.5">
          <div className="h-3.5 w-3/4 rounded-md bg-foreground/15" />
          <div className="h-2.5 w-1/2 rounded-md bg-accent/20" />
        </div>

        <div className="w-full h-9 rounded-full bg-foreground/10 border border-border-theme/40 flex items-center justify-center">
          <div className="w-24 h-2 rounded-full bg-foreground/15" />
        </div>
      </div>
    </div>
  );
};

export default ProductCardSkeleton;
