import React from "react";
import SellerTableSkeleton from "./SellerTableSkeleton";

/**
 * SellerSkeleton Component
 * Responsive skeleton matching Seller Dashboard, Catalog & Metadata Manager
 */
const SellerSkeleton = () => {
  return (
    <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-pulse">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme/40 pb-6">
        <div className="space-y-2">
          <div className="w-28 h-3.5 bg-accent/20 rounded-md" />
          <div className="w-56 h-8 bg-foreground/20 rounded-xl" />
        </div>
        <div className="w-36 h-10 bg-accent/30 rounded-full" />
      </div>

      {/* KPI Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, idx) => (
          <div key={idx} className="bg-surface border border-border-theme/40 p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="w-20 h-3 bg-foreground/15 rounded-md" />
              <div className="w-8 h-8 rounded-full bg-accent/20" />
            </div>
            <div className="w-28 h-7 bg-foreground/20 rounded-lg" />
          </div>
        ))}
      </div>

      {/* Main Table Skeleton */}
      <SellerTableSkeleton rows={5} />
    </div>
  );
};

export default SellerSkeleton;
