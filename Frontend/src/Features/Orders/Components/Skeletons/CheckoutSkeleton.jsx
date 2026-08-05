import React from "react";

const CheckoutSkeleton = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto space-y-8 animate-pulse">
      <div className="text-center space-y-2 max-w-md mx-auto">
        <div className="h-10 bg-foreground/15 rounded-2xl w-3/4 mx-auto" />
        <div className="h-4 bg-foreground/10 rounded-xl w-1/2 mx-auto" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-7 space-y-6">
          <div className="bg-surface border border-border-theme p-8 rounded-3xl space-y-4">
            <div className="h-6 bg-foreground/15 rounded-xl w-1/3" />
            <div className="h-12 bg-foreground/10 rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <div className="h-12 bg-foreground/10 rounded-xl" />
              <div className="h-12 bg-foreground/10 rounded-xl" />
            </div>
          </div>
          <div className="bg-surface border border-border-theme p-8 rounded-3xl space-y-4">
            <div className="h-6 bg-foreground/15 rounded-xl w-1/3" />
            <div className="grid grid-cols-2 gap-3">
              <div className="h-16 bg-foreground/10 rounded-2xl" />
              <div className="h-16 bg-foreground/10 rounded-2xl" />
            </div>
          </div>
        </div>

        <div className="lg:col-span-5">
          <div className="bg-surface border border-border-theme p-8 rounded-3xl space-y-6">
            <div className="h-6 bg-foreground/15 rounded-xl w-1/2" />
            <div className="space-y-3">
              <div className="h-16 bg-foreground/10 rounded-2xl" />
              <div className="h-16 bg-foreground/10 rounded-2xl" />
            </div>
            <div className="h-12 bg-accent/30 rounded-2xl" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSkeleton;
