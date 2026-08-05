import React from "react";

const ContactSkeleton = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 md:px-12 max-w-7xl mx-auto space-y-12 animate-pulse">
      <div className="text-center space-y-4 max-w-md mx-auto">
        <div className="h-10 bg-foreground/15 rounded-2xl w-3/4 mx-auto" />
        <div className="h-1 bg-accent/40 rounded-full w-20 mx-auto" />
        <div className="h-4 bg-foreground/10 rounded-xl w-5/6 mx-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-16">
        {/* Form Skeleton */}
        <div className="bg-surface border border-border-theme p-8 rounded-3xl space-y-6">
          <div className="h-6 bg-foreground/15 rounded-xl w-1/3" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="h-12 bg-foreground/10 rounded-xl" />
            <div className="h-12 bg-foreground/10 rounded-xl" />
          </div>
          <div className="h-12 bg-foreground/10 rounded-xl" />
          <div className="h-36 bg-foreground/10 rounded-xl" />
          <div className="h-12 bg-accent/30 rounded-xl" />
        </div>

        {/* Info & Map Skeleton */}
        <div className="space-y-8 flex flex-col justify-between">
          <div className="space-y-6">
            <div className="h-6 bg-foreground/15 rounded-xl w-1/3" />
            <div className="space-y-4">
              <div className="h-10 bg-foreground/10 rounded-xl w-3/4" />
              <div className="h-10 bg-foreground/10 rounded-xl w-1/2" />
              <div className="h-10 bg-foreground/10 rounded-xl w-2/3" />
            </div>
          </div>
          <div className="w-full h-64 rounded-3xl bg-foreground/10 border border-border-theme" />
        </div>
      </div>
    </div>
  );
};

export default ContactSkeleton;
