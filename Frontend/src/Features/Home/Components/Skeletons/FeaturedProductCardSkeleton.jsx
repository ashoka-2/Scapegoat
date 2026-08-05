import React from "react";

/**
 * FeaturedProductCardSkeleton Component
 * Matches 1-to-1 the dimensions, rounded corners, height, badge, and slide-button of ProductCardItem in RightInfo.jsx
 */
const FeaturedProductCardSkeleton = () => {
  return (
    <div className="bg-surface dark:bg-[#1C1C1E] p-3 rounded-[2.5rem] w-[240px] shadow-md lg:shadow-2xl relative border border-white/10 animate-pulse flex-shrink-0 select-none">
      {/* 180px Height Image Skeleton */}
      <div className="w-full h-[180px] rounded-[1.7rem] bg-foreground/10 overflow-hidden mb-4 relative">
        {/* Badge Skeleton (SALE/NEW DROP) */}
        <div className="absolute top-3 left-3 w-12 h-4 rounded-lg bg-foreground/15" />
      </div>

      {/* Details Skeleton (Centered) */}
      <div className="px-2 pb-2 text-center space-y-2">
        {/* Title */}
        <div className="h-4 w-3/4 bg-foreground/20 rounded-md mx-auto" />
        {/* Subtitle */}
        <div className="h-3 w-1/2 bg-foreground/10 rounded-md mx-auto mb-4" />

        {/* Slide-to-Cart Button Skeleton */}
        <div className="relative border border-accent/30 rounded-full flex items-center w-full h-10 px-1 bg-surface-variant/20">
          <div className="w-8 h-8 rounded-full bg-accent/30 shrink-0" />
          <div className="w-24 h-3 bg-accent/20 rounded-full mx-auto" />
        </div>
      </div>
    </div>
  );
};

export default FeaturedProductCardSkeleton;
