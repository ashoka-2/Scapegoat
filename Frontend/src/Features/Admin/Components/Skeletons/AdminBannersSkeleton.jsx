import React from "react";

const AdminBannersSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-8 w-56 bg-surface-variant/40 rounded-xl" />
          <div className="h-4 w-80 bg-surface-variant/20 rounded-lg" />
        </div>
        <div className="h-10 w-36 bg-surface-variant/40 rounded-2xl" />
      </div>

      {/* Tabs & Search Bar Skeleton */}
      <div className="flex items-center gap-3">
        <div className="h-10 w-72 bg-surface-variant/30 rounded-2xl" />
        <div className="h-10 w-36 bg-surface-variant/30 rounded-xl" />
        <div className="h-10 flex-1 bg-surface-variant/20 rounded-xl" />
      </div>

      {/* Banner Cards Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div
            key={i}
            className="rounded-2xl border border-border-theme/20 bg-surface-variant/10 overflow-hidden space-y-3 p-4"
          >
            <div className="w-full aspect-[16/8] bg-surface-variant/30 rounded-xl" />
            <div className="h-5 w-3/4 bg-surface-variant/40 rounded-lg" />
            <div className="h-4 w-1/2 bg-surface-variant/20 rounded-lg" />
            <div className="flex items-center justify-between pt-2 border-t border-border-theme/10">
              <div className="h-6 w-20 bg-surface-variant/30 rounded-full" />
              <div className="h-6 w-12 bg-surface-variant/30 rounded-full" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminBannersSkeleton;
