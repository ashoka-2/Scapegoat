import React from "react";

const AdminSettingsSkeleton = () => {
  return (
    <div className="space-y-6 font-sans animate-pulse">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div className="space-y-1">
          <div className="h-3 bg-accent/25 rounded-md w-28" />
          <div className="h-7 bg-foreground/20 rounded-xl w-52" />
        </div>
      </div>

      {/* Tabs Navigation Bar Shimmer */}
      <div className="flex gap-2 border-b border-border-theme/40 pb-3 overflow-x-auto scrollbar-hide">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="h-9 bg-surface border border-border-theme rounded-xl w-32 shrink-0" />
        ))}
      </div>

      {/* Settings Form Body Shimmer */}
      <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-xs">
        <div className="flex items-center justify-between border-b border-border-theme/60 pb-4">
          <div className="space-y-1.5">
            <div className="h-5 bg-foreground/20 rounded-md w-56" />
            <div className="h-3 bg-foreground/10 rounded-md w-40" />
          </div>
          <div className="h-9 bg-accent/20 border border-accent/30 rounded-xl w-32" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div className="space-y-2">
            <div className="h-3 bg-foreground/15 rounded w-24" />
            <div className="h-10 bg-background border border-border-theme rounded-xl w-full" />
          </div>
          <div className="space-y-2">
            <div className="h-3 bg-foreground/15 rounded w-24" />
            <div className="h-10 bg-background border border-border-theme rounded-xl w-full" />
          </div>
        </div>

        <div className="space-y-2">
          <div className="h-3 bg-foreground/15 rounded w-32" />
          <div className="h-10 bg-background border border-border-theme rounded-xl w-full" />
        </div>

        {/* Map Container Shimmer */}
        <div className="space-y-2">
          <div className="h-3 bg-foreground/15 rounded w-48" />
          <div className="w-full h-72 bg-background border-2 border-accent/20 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export default AdminSettingsSkeleton;
