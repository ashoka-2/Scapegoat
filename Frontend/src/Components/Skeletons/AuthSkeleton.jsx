import React from "react";

/**
 * AuthSkeleton Component
 * Responsive skeleton matching Login.jsx and Register.jsx layout
 */
const AuthSkeleton = () => {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col lg:flex-row animate-pulse">
      {/* Left Editorial Section Skeleton */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-surface border-r border-border-theme p-16 flex-col justify-between">
        <div className="w-24 h-6 bg-accent/20 rounded-md" />
        <div className="mt-auto space-y-4">
          <div className="w-72 h-14 bg-foreground/20 rounded-2xl" />
          <div className="w-96 h-4 bg-foreground/10 rounded-md" />
        </div>
      </div>

      {/* Right Form Section Skeleton */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 lg:p-16 min-h-screen">
        <div className="w-full max-w-md space-y-8">
          <div className="space-y-3">
            <div className="w-32 h-4 bg-accent/20 rounded-md" />
            <div className="w-64 h-10 bg-foreground/20 rounded-xl" />
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <div className="w-36 h-3 bg-foreground/15 rounded-md" />
              <div className="w-full h-12 bg-surface border border-border-theme/50 rounded-xl" />
            </div>

            <div className="space-y-2">
              <div className="w-24 h-3 bg-foreground/15 rounded-md" />
              <div className="w-full h-12 bg-surface border border-border-theme/50 rounded-xl" />
            </div>

            <div className="w-full h-12 bg-accent/40 rounded-full" />
            <div className="w-full h-12 bg-surface border border-border-theme/50 rounded-full" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthSkeleton;
