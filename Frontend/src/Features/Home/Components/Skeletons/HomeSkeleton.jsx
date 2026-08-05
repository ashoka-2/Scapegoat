import React from "react";
import HeroSkeleton from "./HeroSkeleton";
import ProductCarouselSkeleton from "../../../Products/Components/Skeletons/ProductCarouselSkeleton";

/**
 * HomeSkeleton Component
 * Full initial loading state for Home page (Hero + Product Carousels)
 */
const HomeSkeleton = () => {
  return (
    <div className="w-full min-h-screen bg-background space-y-8">
      {/* Responsive Hero Section Skeleton */}
      <HeroSkeleton />

      {/* Products Section Skeleton */}
      <section className="w-full py-8 px-4 max-w-[1350px] mx-auto space-y-12">
        {/* Section Divider Skeleton */}
        <div className="flex items-center gap-4 mb-10 animate-pulse">
          <div className="w-8 h-[2px] bg-accent/40" />
          <div className="w-36 h-3 bg-foreground/15 rounded-md" />
          <div className="flex-1 h-[1px] bg-border-theme/30" />
        </div>

        <ProductCarouselSkeleton count={5} />
        <ProductCarouselSkeleton count={5} />
      </section>
    </div>
  );
};

export default HomeSkeleton;
