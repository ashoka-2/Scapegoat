import React from "react";

const AdminProductDetailSkeleton = () => {
  return (
    <div className="space-y-6 font-sans animate-pulse">
      {/* Page Navigation & Title Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div className="space-y-1">
          <div className="h-3 bg-accent/25 rounded-md w-28" />
          <div className="h-7 bg-foreground/20 rounded-xl w-60" />
        </div>
        <div className="h-9 bg-foreground/10 rounded-xl w-24" />
      </div>

      {/* Grid Layout: Image Gallery + Detail Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Image Thumbnail */}
        <div className="bg-surface border border-border-theme p-5 rounded-3xl space-y-4 shadow-xs">
          <div className="w-full h-80 bg-foreground/10 rounded-2xl" />
          <div className="flex justify-between items-center">
            <div className="h-4 bg-foreground/15 rounded w-20" />
            <div className="h-6 bg-emerald-500/20 rounded-full w-24" />
          </div>
        </div>

        {/* Right Column: Key Details & Specs */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-surface border border-border-theme p-6 rounded-3xl space-y-4 shadow-xs">
            <div className="h-6 bg-foreground/20 rounded-md w-3/4" />
            <div className="h-4 bg-foreground/10 rounded-md w-1/2" />
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border-theme/40">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-background/50 rounded-xl space-y-1 border border-border-theme/40">
                  <div className="h-3 bg-foreground/10 rounded w-16" />
                  <div className="h-5 bg-foreground/20 rounded w-24" />
                </div>
              ))}
            </div>
          </div>

          <div className="bg-surface border border-border-theme p-6 rounded-3xl space-y-4 shadow-xs">
            <div className="h-5 bg-foreground/20 rounded-md w-40" />
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 bg-background/50 rounded-xl w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProductDetailSkeleton;
