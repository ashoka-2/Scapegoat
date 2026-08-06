import React from "react";

const AdminUserDetailSkeleton = () => {
  return (
    <div className="space-y-6 font-sans animate-pulse">
      {/* Header & Back Button */}
      <div className="flex items-center justify-between border-b border-border-theme pb-4">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-foreground/10" />
          <div className="space-y-1">
            <div className="h-3 bg-accent/25 rounded-md w-28" />
            <div className="h-6 bg-foreground/20 rounded-xl w-48" />
          </div>
        </div>
        <div className="h-9 bg-foreground/10 rounded-xl w-24" />
      </div>

      {/* Profile Card & Stats Grid */}
      <div className="bg-surface border border-border-theme p-6 rounded-3xl space-y-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-foreground/15 border-2 border-accent/40" />
            <div className="space-y-2">
              <div className="h-6 bg-foreground/20 rounded-md w-48" />
              <div className="h-4 bg-foreground/10 rounded-md w-36" />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-9 bg-purple-500/20 rounded-xl w-28" />
            <div className="h-9 bg-red-500/20 rounded-xl w-24" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-border-theme/40">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 bg-background/50 rounded-2xl space-y-2 border border-border-theme/40">
              <div className="h-3 bg-foreground/10 rounded w-20" />
              <div className="h-6 bg-foreground/20 rounded w-28" />
            </div>
          ))}
        </div>
      </div>

      {/* Orders Table Skeleton */}
      <div className="bg-surface border border-border-theme p-6 rounded-3xl space-y-4 shadow-xs">
        <div className="h-5 bg-foreground/20 rounded-md w-44" />
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-14 bg-background/50 rounded-2xl w-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetailSkeleton;
