import React from "react";

const AdminCategoriesSkeleton = () => {
  return (
    <div className="space-y-6 font-sans animate-pulse">
      {/* Page Header & New Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div className="space-y-1">
          <div className="h-3 bg-accent/25 rounded-md w-28" />
          <div className="h-7 bg-foreground/20 rounded-xl w-48" />
        </div>
        <div className="h-10 bg-accent/20 border border-accent/30 rounded-xl w-36" />
      </div>

      {/* Grid of Category Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border-theme p-5 rounded-2xl space-y-4 shadow-xs"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-xl bg-accent/20" />
              <div className="h-5 bg-foreground/10 rounded-full w-20" />
            </div>
            <div className="space-y-1.5">
              <div className="h-5 bg-foreground/20 rounded-md w-3/4" />
              <div className="h-3 bg-foreground/10 rounded-md w-1/2 font-mono" />
            </div>
            <div className="flex items-center justify-between pt-3 border-t border-border-theme/40">
              <div className="w-8 h-8 bg-foreground/10 rounded-lg" />
              <div className="w-8 h-8 bg-red-500/15 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminCategoriesSkeleton;
