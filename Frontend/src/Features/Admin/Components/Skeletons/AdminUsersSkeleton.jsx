import React from "react";

const AdminUsersSkeleton = () => {
  return (
    <div className="space-y-6 font-sans animate-pulse">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div className="space-y-1">
          <div className="h-3 bg-accent/25 rounded-md w-28" />
          <div className="h-7 bg-foreground/20 rounded-xl w-48" />
        </div>
        <div className="h-9 bg-foreground/10 rounded-xl w-40" />
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-surface border border-border-theme p-4 rounded-2xl shadow-xs">
        <div className="h-10 bg-background border border-border-theme rounded-xl w-full sm:w-80" />
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-10 bg-background border border-border-theme rounded-xl w-32" />
          <div className="h-10 bg-background border border-border-theme rounded-xl w-32" />
        </div>
      </div>

      {/* Users Table Skeleton */}
      <div className="bg-surface border border-border-theme rounded-2xl overflow-hidden shadow-xs">
        <div className="p-4 border-b border-border-theme bg-background/50 flex justify-between">
          <div className="h-4 bg-foreground/20 rounded w-28" />
          <div className="h-4 bg-foreground/20 rounded w-24" />
          <div className="h-4 bg-foreground/20 rounded w-20" />
          <div className="h-4 bg-foreground/20 rounded w-20" />
        </div>
        <div className="divide-y divide-border-theme/40">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-1/3 min-w-0">
                <div className="w-10 h-10 rounded-full bg-foreground/15 shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-4 bg-foreground/20 rounded w-3/4" />
                  <div className="h-3 bg-foreground/10 rounded w-1/2" />
                </div>
              </div>
              <div className="h-6 bg-purple-500/15 rounded-full w-20" />
              <div className="h-6 bg-emerald-500/15 rounded-full w-16" />
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-foreground/10 rounded-lg" />
                <div className="w-8 h-8 bg-foreground/10 rounded-lg" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminUsersSkeleton;
