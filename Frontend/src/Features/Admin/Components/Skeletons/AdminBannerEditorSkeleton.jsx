import React from "react";

const AdminBannerEditorSkeleton = () => {
  return (
    <div className="space-y-6 animate-pulse pb-20">
      {/* Header Bar Skeleton */}
      <div className="flex items-center justify-between bg-surface-variant/20 border border-border-theme/20 rounded-3xl p-6">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-2xl bg-surface-variant/40" />
          <div className="space-y-2">
            <div className="h-6 w-48 bg-surface-variant/40 rounded-xl" />
            <div className="h-3 w-64 bg-surface-variant/20 rounded-lg" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="h-10 w-28 bg-surface-variant/30 rounded-2xl" />
          <div className="h-10 w-36 bg-surface-variant/50 rounded-2xl" />
        </div>
      </div>

      {/* Main Studio Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Studio Canvas Skeleton (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          <div className="bg-surface-variant/15 border border-border-theme/20 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-border-theme/10">
              <div className="h-5 w-40 bg-surface-variant/30 rounded-lg" />
              <div className="h-8 w-48 bg-surface-variant/30 rounded-2xl" />
            </div>
            <div className="w-full aspect-[16/8] bg-surface-variant/30 rounded-2xl" />
          </div>

          <div className="bg-surface-variant/15 border border-border-theme/20 rounded-3xl p-6 space-y-3">
            <div className="h-5 w-48 bg-surface-variant/30 rounded-lg" />
            <div className="h-20 w-full bg-surface-variant/20 rounded-2xl" />
          </div>
        </div>

        {/* Right Settings Panel Skeleton (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-surface-variant/15 border border-border-theme/20 rounded-3xl p-6 space-y-3">
            <div className="h-5 w-40 bg-surface-variant/30 rounded-lg" />
            <div className="h-12 w-full bg-surface-variant/20 rounded-xl" />
            <div className="h-12 w-full bg-surface-variant/20 rounded-xl" />
          </div>

          <div className="bg-surface-variant/15 border border-border-theme/20 rounded-3xl p-6 space-y-3">
            <div className="h-5 w-36 bg-surface-variant/30 rounded-lg" />
            <div className="grid grid-cols-2 gap-2">
              <div className="h-14 bg-surface-variant/20 rounded-2xl" />
              <div className="h-14 bg-surface-variant/20 rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminBannerEditorSkeleton;
