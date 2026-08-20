import React from "react";
import ProductCardSkeleton from "../../../Products/Components/Skeletons/ProductCardSkeleton";

/**
 * WishlistSkeleton Component
 * Located in Features/Wishlist/Components/Skeletons/
 */
const WishlistSkeleton = ({ count = 8 }) => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-20 md:pt-24 pb-20 px-2 sm:px-4 md:px-10 animate-pulse select-none max-w-[1400px] mx-auto">
      <div className="space-y-6 md:space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-2 mb-6 md:mb-10 border-b border-border-theme/40 pb-4 md:pb-6 px-1">
          <div className="w-24 h-2.5 bg-accent/20 rounded-md" />
          <div className="w-44 md:w-56 h-8 md:h-10 bg-foreground/15 rounded-2xl" />
          <div className="w-60 md:w-72 h-3 bg-foreground/10 rounded-md" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2.5 sm:gap-4 md:gap-6">
          {Array.from({ length: count }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistSkeleton;
