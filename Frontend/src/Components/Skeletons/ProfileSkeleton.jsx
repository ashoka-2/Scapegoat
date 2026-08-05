import React from "react";

/**
 * ProfileSkeleton Component
 * Responsive skeleton matching Profile.jsx layout
 */
const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 sm:px-6 lg:px-8 animate-pulse">
      <div className="max-w-4xl mx-auto space-y-8">
        {/* Header Card Skeleton */}
        <div className="bg-surface border border-border-theme/80 rounded-3xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-xl">
          <div className="flex items-center space-x-5">
            <div className="w-20 h-20 rounded-full bg-foreground/15 border-4 border-accent/20 shrink-0" />
            <div className="space-y-2">
              <div className="w-48 h-6 bg-foreground/20 rounded-lg" />
              <div className="w-24 h-4 bg-accent/20 rounded-full" />
              <div className="w-36 h-3 bg-foreground/10 rounded-md" />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="w-28 h-10 bg-accent/20 rounded-xl" />
            <div className="w-24 h-10 bg-foreground/10 rounded-xl" />
            <div className="w-24 h-10 bg-red-500/20 rounded-xl" />
          </div>
        </div>

        {/* Form Card Skeleton */}
        <div className="bg-surface border border-border-theme/80 rounded-3xl p-6 sm:p-8 space-y-6">
          <div className="w-40 h-6 bg-foreground/20 rounded-lg pb-2 border-b border-border-theme/40" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="w-24 h-3 bg-foreground/15 rounded-md" />
              <div className="w-full h-11 bg-background border border-border-theme/50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="w-24 h-3 bg-foreground/15 rounded-md" />
              <div className="w-full h-11 bg-background border border-border-theme/50 rounded-xl" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <div className="w-32 h-3 bg-foreground/15 rounded-md" />
              <div className="w-full h-11 bg-background border border-border-theme/50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="w-20 h-3 bg-foreground/15 rounded-md" />
              <div className="w-full h-11 bg-background border border-border-theme/50 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="w-20 h-3 bg-foreground/15 rounded-md" />
              <div className="w-full h-11 bg-background border border-border-theme/50 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileSkeleton;
