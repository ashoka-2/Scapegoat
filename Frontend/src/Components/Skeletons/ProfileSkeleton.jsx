import React from "react";

const ProfileSkeleton = () => {
  return (
    <div className="min-h-screen bg-background text-foreground py-8 px-4 sm:px-6 lg:px-8 font-sans animate-pulse">
      <div className="max-w-4xl mx-auto space-y-6">

        {/* Header Card Skeleton */}
        <div className="bg-surface border border-border-theme/80 rounded-2xl p-6 sm:p-8 flex flex-col sm:flex-row items-center justify-between gap-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-center sm:items-start text-center sm:text-left gap-5 w-full">
            {/* Avatar Circle */}
            <div className="w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-border-theme/60 shrink-0" />

            {/* User Details */}
            <div className="space-y-3 w-full sm:w-auto flex-1">
              <div className="flex items-center justify-center sm:justify-start gap-3">
                <div className="h-6 w-40 bg-border-theme/70 rounded-md" />
                <div className="h-5 w-24 bg-accent/20 rounded-md" />
              </div>
              <div className="h-3.5 w-48 bg-border-theme/40 rounded-md mx-auto sm:mx-0" />
              <div className="flex items-center gap-3 pt-1 justify-center sm:justify-start">
                <div className="h-3 w-16 bg-border-theme/40 rounded" />
                <div className="h-3 w-16 bg-border-theme/40 rounded" />
                <div className="h-3 w-16 bg-border-theme/40 rounded" />
              </div>
            </div>
          </div>

          <div className="h-9 w-24 bg-border-theme/50 rounded-xl shrink-0" />
        </div>

        {/* Tab Bar Skeleton */}
        <div className="flex items-center gap-1.5 bg-surface border border-border-theme/80 p-1.5 rounded-2xl overflow-x-auto">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex-1 min-w-[120px] h-9 bg-border-theme/40 rounded-xl" />
          ))}
        </div>

        {/* Form Body Skeleton */}
        <div className="bg-surface border border-border-theme/80 rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-theme/50 pb-4">
            <div className="space-y-2">
              <div className="h-5 w-36 bg-border-theme/70 rounded-md" />
              <div className="h-3 w-64 bg-border-theme/40 rounded-md" />
            </div>
            <div className="h-9 w-32 bg-accent/20 rounded-xl" />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <div className="h-3 w-24 bg-border-theme/50 rounded" />
              <div className="h-11 w-full bg-border-theme/30 rounded-xl" />
            </div>
            <div className="space-y-2">
              <div className="h-3 w-24 bg-border-theme/50 rounded" />
              <div className="h-11 w-full bg-border-theme/30 rounded-xl" />
            </div>
            <div className="sm:col-span-2 space-y-2">
              <div className="h-3 w-28 bg-border-theme/50 rounded" />
              <div className="h-11 w-full bg-border-theme/30 rounded-xl" />
            </div>
          </div>

          <div className="pt-6 border-t border-border-theme/50 space-y-4">
            <div className="h-4 w-44 bg-border-theme/60 rounded-md" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2 h-11 bg-border-theme/30 rounded-xl" />
              <div className="h-11 bg-border-theme/30 rounded-xl" />
              <div className="h-11 bg-border-theme/30 rounded-xl" />
              <div className="h-11 bg-border-theme/30 rounded-xl" />
              <div className="h-11 bg-border-theme/30 rounded-xl" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default ProfileSkeleton;
