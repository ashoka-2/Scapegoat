import React from "react";

const AdminDashboardSkeleton = () => {
  return (
    <div className="space-y-8 font-sans animate-pulse">
      {/* Page Header Shimmer */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border-theme pb-6">
        <div className="space-y-1.5">
          <div className="h-3 bg-accent/25 rounded-md w-28" />
          <div className="h-7 bg-foreground/20 rounded-xl w-52 sm:w-64" />
        </div>

        <div className="flex items-center gap-3">
          <div className="h-9 bg-emerald-500/15 border border-emerald-500/20 rounded-xl w-40" />
          <div className="h-9 bg-accent/20 border border-accent/30 rounded-xl w-24" />
        </div>
      </div>

      {/* 2. 4 Primary Stat Cards Shimmer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-surface/80 border border-border-theme p-6 rounded-3xl space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <div className="h-3.5 bg-foreground/15 rounded-md w-24" />
              <div className="w-10 h-10 rounded-2xl bg-accent/20 border border-accent/30" />
            </div>
            <div className="h-9 bg-foreground/20 rounded-xl w-32" />
            <div className="flex items-center justify-between pt-2 border-t border-border-theme/40">
              <div className="h-3 bg-foreground/10 rounded w-16" />
              <div className="h-3 bg-emerald-500/20 rounded w-14" />
            </div>
          </div>
        ))}
      </div>

      {/* 3. Multi-Metric Revenue & Performance Analytics Section Shimmer */}
      <div className="bg-surface/80 border border-border-theme p-6 sm:p-8 rounded-3xl space-y-6 shadow-sm">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-border-theme/60 pb-5">
          <div className="space-y-1.5">
            <div className="h-5 bg-accent/20 rounded-md w-72" />
            <div className="h-3 bg-foreground/10 rounded-md w-60" />
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="h-9 bg-foreground/10 rounded-xl w-44" />
            <div className="h-9 bg-foreground/10 rounded-xl w-28" />
            <div className="h-9 bg-foreground/10 rounded-xl w-28" />
          </div>
        </div>

        {/* Metric Selector Pills Shimmer */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-8 bg-foreground/10 rounded-xl w-32 shrink-0" />
          ))}
        </div>

        {/* Metric Summary Cards Shimmer */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-background/40 p-4 rounded-2xl border border-border-theme/40">
          <div className="space-y-1">
            <div className="h-3 bg-foreground/15 rounded w-28" />
            <div className="h-6 bg-accent/20 rounded w-24" />
          </div>
          <div className="space-y-1">
            <div className="h-3 bg-foreground/15 rounded w-28" />
            <div className="h-6 bg-foreground/20 rounded w-20" />
          </div>
          <div className="space-y-1 col-span-2 sm:col-span-1">
            <div className="h-3 bg-foreground/15 rounded w-28" />
            <div className="h-6 bg-foreground/20 rounded w-24" />
          </div>
        </div>

        {/* Chart Bars Shimmer */}
        <div className="h-60 bg-background/50 border border-border-theme/40 rounded-2xl p-6 flex items-end justify-between gap-3">
          {[35, 65, 45, 85, 50, 95, 70, 40, 80, 60].map((h, idx) => (
            <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
              <div
                className="w-full bg-accent/25 rounded-t-xl transition-all"
                style={{ height: `${h}%` }}
              />
              <div className="h-3 bg-foreground/10 rounded w-10" />
            </div>
          ))}
        </div>
      </div>

      {/* 4. Best Performing Products Grid Shimmer */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="h-5 bg-foreground/20 rounded-md w-48" />
          <div className="h-3 bg-foreground/10 rounded-md w-24" />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-surface/80 border border-border-theme p-4 rounded-3xl space-y-3 shadow-sm"
            >
              <div className="w-full h-36 bg-foreground/10 rounded-2xl" />
              <div className="h-4 bg-foreground/20 rounded-md w-3/4" />
              <div className="h-3 bg-foreground/10 rounded-md w-1/2" />
              <div className="flex items-center justify-between pt-2">
                <div className="h-5 bg-emerald-500/20 rounded-lg w-20" />
                <div className="h-5 bg-amber-500/20 rounded-lg w-16" />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 5. Inventory & Activity Dual Column Shimmer */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-surface/80 border border-border-theme p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="h-5 bg-foreground/20 rounded-md w-40" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-background/50 rounded-2xl w-full" />
            ))}
          </div>
        </div>

        <div className="bg-surface/80 border border-border-theme p-6 rounded-3xl space-y-4 shadow-sm">
          <div className="h-5 bg-foreground/20 rounded-md w-36" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 bg-background/50 rounded-2xl w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardSkeleton;
