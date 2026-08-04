import React from "react";

/**
 * SingleProductSkeleton Component
 * Full details layout skeleton matching SingleProduct.jsx
 */
const SingleProductSkeleton = () => {
  return (
    <div className="max-w-[1350px] mx-auto px-4 py-8 space-y-12 animate-pulse select-none">
      {/* Breadcrumb Skeleton */}
      <div className="w-48 h-4 bg-foreground/10 rounded-md" />

      {/* Main Grid Layout: Gallery (Left) & Product Details (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
        {/* Left Column: Image Gallery Skeleton */}
        <div className="lg:col-span-7 space-y-4">
          {/* Main Large Image */}
          <div className="w-full aspect-[4/5] sm:aspect-square rounded-3xl bg-foreground/10 border border-border-theme" />
          {/* Thumbnails Row */}
          <div className="flex gap-3 overflow-x-auto pb-2">
            {Array.from({ length: 4 }).map((_, idx) => (
              <div key={idx} className="w-20 h-20 rounded-2xl bg-foreground/10 border border-border-theme shrink-0" />
            ))}
          </div>
        </div>

        {/* Right Column: Title, Price, Attributes & Buttons */}
        <div className="lg:col-span-5 space-y-6">
          {/* Brand & Title */}
          <div className="space-y-3 border-b border-border-theme pb-6">
            <div className="w-28 h-3 bg-accent/20 rounded-md" />
            <div className="w-3/4 h-8 bg-foreground/15 rounded-xl" />
            <div className="w-32 h-6 bg-accent/30 rounded-lg" />
          </div>

          {/* Color/Size Attribute Selectors */}
          <div className="space-y-4 pt-2">
            <div className="w-20 h-3 bg-foreground/10 rounded-md" />
            <div className="flex gap-2">
              {Array.from({ length: 4 }).map((_, idx) => (
                <div key={idx} className="w-10 h-10 rounded-xl bg-foreground/10" />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3 pt-6 border-t border-border-theme">
            <div className="w-full h-14 rounded-2xl bg-accent/20" />
            <div className="w-full h-14 rounded-2xl bg-foreground/10" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default SingleProductSkeleton;
