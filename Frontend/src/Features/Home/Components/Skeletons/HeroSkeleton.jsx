import React from "react";

/**
 * HeroSkeleton Component
 * Responsive skeleton matching Hero.jsx layout, colors & typography
 */
const HeroSkeleton = () => {
  return (
    <div className="w-full pb-16 flex flex-col items-center pt-4 animate-pulse">
      {/* 1. Header Typography Skeleton */}
      <div className="w-full max-w-[1350px] flex justify-between items-center lg:items-end px-4 sm:px-8 relative mb-8 lg:mb-2">
        {/* Left Side: Own the EDGE */}
        <div className="flex flex-col gap-2 transform lg:rotate-[-2deg]">
          <div className="w-20 sm:w-28 h-6 bg-foreground/15 rounded-md" />
          <div className="w-48 sm:w-80 lg:w-96 h-16 sm:h-24 bg-foreground/20 rounded-2xl" />
        </div>

        {/* Right Side: Keep the VIBE */}
        <div className="flex flex-col gap-2 transform lg:rotate-[-2deg] mt-6 lg:mt-0 items-end">
          <div className="w-20 sm:w-28 h-6 bg-foreground/15 rounded-md" />
          <div className="w-48 sm:w-80 lg:w-96 h-16 sm:h-24 bg-foreground/20 rounded-2xl" />
        </div>
      </div>

      {/* 2. Master Hero Container Box Skeleton */}
      <div className="relative w-full max-w-[1300px] mx-auto min-h-[500px] lg:min-h-[550px] flex flex-col items-center justify-end px-2 sm:px-6 w-[98%]">
        <div className="w-full h-auto lg:h-[500px] bg-surface-brand/40 rounded-[40px] lg:rounded-[64px] relative flex flex-col lg:flex-row border border-border-theme/40 overflow-hidden p-6 sm:p-12">
          {/* Left Column Skeleton */}
          <div className="w-full lg:w-[35%] flex flex-col justify-center space-y-4">
            <div className="w-28 h-5 bg-white/20 rounded-full" />
            <div className="w-48 sm:w-64 h-10 bg-white/25 rounded-xl" />
            <div className="w-36 h-4 bg-white/15 rounded-md" />
            <div className="w-36 h-12 bg-white/30 rounded-full mt-4" />
          </div>

          {/* Center Model Silhouette Skeleton Placeholder */}
          <div className="w-full lg:w-[30%] flex items-end justify-center my-8 lg:my-0">
            <div className="w-48 sm:w-64 h-72 sm:h-96 bg-white/15 rounded-t-full rounded-b-2xl border border-white/20" />
          </div>

          {/* Right Column Skeleton */}
          <div className="w-full lg:w-[35%] flex flex-col justify-center items-start lg:items-end space-y-4">
            <div className="w-32 h-5 bg-white/20 rounded-full" />
            <div className="w-56 h-16 bg-white/15 rounded-2xl" />
            <div className="w-40 h-8 bg-white/20 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSkeleton;
