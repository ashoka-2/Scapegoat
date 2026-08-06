import React from "react";

const AdminTableSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse">
      {/* Search and Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div className="h-10 bg-foreground/10 rounded-xl w-full sm:w-72" />
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-10 bg-foreground/10 rounded-xl w-28" />
          <div className="h-10 bg-foreground/10 rounded-xl w-28" />
        </div>
      </div>

      {/* Table Shimmer */}
      <div className="bg-background/50 border border-border-theme rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border-theme bg-surface flex justify-between">
          <div className="h-4 bg-foreground/20 rounded w-24" />
          <div className="h-4 bg-foreground/20 rounded w-32" />
          <div className="h-4 bg-foreground/20 rounded w-20" />
        </div>
        <div className="divide-y divide-border-theme/40">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 w-1/3">
                <div className="w-10 h-10 rounded-full bg-foreground/15 shrink-0" />
                <div className="space-y-1.5 w-full">
                  <div className="h-4 bg-foreground/15 rounded w-3/4" />
                  <div className="h-3 bg-foreground/10 rounded w-1/2" />
                </div>
              </div>
              <div className="h-4 bg-foreground/10 rounded w-24" />
              <div className="h-7 bg-accent/20 rounded-lg w-20" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminTableSkeleton;
