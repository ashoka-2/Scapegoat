import React from "react";

const AdminInboxSkeleton = () => {
  return (
    <div className="space-y-6 font-sans animate-pulse">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div className="space-y-1">
          <div className="h-3 bg-accent/25 rounded-md w-28" />
          <div className="h-7 bg-foreground/20 rounded-xl w-52" />
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <div className="h-10 bg-surface border border-border-theme rounded-xl w-36" />
          <div className="h-10 bg-surface border border-border-theme rounded-xl w-36" />
        </div>
      </div>

      {/* Message Items Shimmer */}
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="bg-surface border border-border-theme/60 rounded-2xl p-4 sm:p-5 space-y-3 shadow-xs"
          >
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="w-10 h-10 rounded-xl bg-blue-500/15 shrink-0" />
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <div className="h-4 bg-foreground/20 rounded w-36" />
                    <div className="h-4 bg-red-500/20 rounded w-14" />
                  </div>
                  <div className="h-3 bg-foreground/10 rounded w-48" />
                </div>
              </div>

              <div className="flex gap-2 self-end sm:self-auto">
                <div className="w-8 h-8 bg-foreground/10 rounded-lg" />
                <div className="w-8 h-8 bg-red-500/15 rounded-lg" />
                <div className="w-8 h-8 bg-foreground/10 rounded-lg" />
              </div>
            </div>

            <div className="h-3 bg-foreground/15 rounded w-1/3" />
            <div className="h-3 bg-foreground/10 rounded w-24 ml-auto" />
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminInboxSkeleton;
