import React from "react";
import ProductCardSkeleton from "./ProductCardSkeleton";

/**
 * ProductCarouselSkeleton Component
 * Horizontal row of ProductCardSkeleton cards matching ProductCarousel.jsx
 */
const ProductCarouselSkeleton = ({ count = 5 }) => {
  return (
    <div className="w-full mb-14 animate-pulse">
      {/* Section Header Skeleton */}
      <div className="flex items-end justify-between mb-6 px-1">
        <div className="flex flex-col gap-1.5">
          <div className="w-24 h-2.5 bg-accent/20 rounded-md" />
          <div className="w-48 h-7 bg-foreground/15 rounded-lg" />
          <div className="w-64 h-3 bg-foreground/10 rounded-md" />
        </div>
      </div>

      {/* Horizontal Cards Row */}
      <div className="flex gap-3 sm:gap-4 overflow-x-auto scrollbar-hide pb-4 pt-1 px-1">
        {Array.from({ length: count }).map((_, idx) => (
          <div key={idx} className="flex-shrink-0 w-[150px] min-[380px]:w-[165px] min-[480px]:w-[180px] sm:w-[210px] md:w-[230px]">
            <ProductCardSkeleton />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCarouselSkeleton;
