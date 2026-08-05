import React from "react";

const OrderDetailsSkeleton = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="h-4 bg-foreground/10 rounded w-28" />

      <div className="bg-surface border border-border-theme p-8 rounded-3xl space-y-8">
        <div className="flex justify-between items-center border-b border-border-theme pb-6">
          <div className="space-y-2 w-1/2">
            <div className="h-4 bg-accent/30 rounded w-1/3" />
            <div className="h-8 bg-foreground/15 rounded-xl w-3/4" />
          </div>
          <div className="h-8 bg-accent/20 rounded-full w-24" />
        </div>

        <div className="space-y-4">
          <div className="h-6 bg-foreground/15 rounded-xl w-1/3" />
          <div className="h-20 bg-foreground/10 rounded-2xl" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-theme">
          <div className="h-32 bg-foreground/10 rounded-2xl" />
          <div className="h-32 bg-foreground/10 rounded-2xl" />
        </div>
      </div>
    </div>
  );
};

export default OrderDetailsSkeleton;
