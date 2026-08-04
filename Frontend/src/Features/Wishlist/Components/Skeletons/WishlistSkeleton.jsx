import React from "react";
import ProductCardSkeleton from "../../../Products/Components/Skeletons/ProductCardSkeleton";

/**
 * WishlistSkeleton Component
 * Located in Features/Wishlist/Components/Skeletons/
 */
const WishlistSkeleton = ({ count = 8 }) => {
  return (
    <div className="min-h-screen bg-background text-foreground pt-24 pb-20 px-4 md:px-10 animate-pulse select-none">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header Skeleton */}
        <div className="space-y-3 mb-10">
          <div className="w-28 h-3 bg-accent/20 rounded-md" />
          <div className="w-56 h-10 bg-foreground/15 rounded-2xl" />
          <div className="w-72 h-3.5 bg-foreground/10 rounded-md" />
        </div>

        {/* Grid Skeleton */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {Array.from({ length: count }).map((_, idx) => (
            <ProductCardSkeleton key={idx} />
          ))}
        </div>
      </div>
    </div>
  );
};

export default WishlistSkeleton;
