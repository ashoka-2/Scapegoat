import React from "react";

const AdminDashboardSkeleton = () => {
  return (
    <div className="space-y-8 animate-pulse">
      {/* Top Header Shimmer */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-6">
        <div className="space-y-2">
          <div className="h-7 bg-foreground/15 rounded-xl w-48" />
          <div className="h-4 bg-foreground/10 rounded-lg w-64" />
        </div>
        <div className="h-9 bg-accent/20 rounded-xl w-32" />
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-background/60 border border-border-theme p-5 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-3.5 bg-foreground/15 rounded w-20" />
              <div className="w-8 h-8 rounded-xl bg-accent/20" />
            </div>
            <div className="h-8 bg-foreground/20 rounded-xl w-28" />
            <div className="h-3 bg-foreground/10 rounded w-32" />
          </div>
        ))}
      </div>

      {/* Analytics Chart Skeleton */}
      <div className="bg-background/60 border border-border-theme p-6 rounded-2xl space-y-4">
        <div className="h-5 bg-foreground/15 rounded w-40" />
        <div className="h-48 bg-foreground/10 rounded-xl w-full" />
      </div>

      {/* Recent Activity Table */}
      <div className="bg-background/60 border border-border-theme p-6 rounded-2xl space-y-4">
        <div className="h-5 bg-foreground/15 rounded w-36" />
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-12 bg-foreground/10 rounded-xl w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSkeleton;
