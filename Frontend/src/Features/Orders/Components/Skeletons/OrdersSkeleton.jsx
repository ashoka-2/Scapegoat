import React from "react";

const OrdersSkeleton = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto space-y-8 animate-pulse">
      <div className="text-center space-y-2 max-w-md mx-auto">
        <div className="h-10 bg-foreground/15 rounded-2xl w-3/4 mx-auto" />
        <div className="h-4 bg-foreground/10 rounded-xl w-1/2 mx-auto" />
      </div>

      <div className="space-y-6">
        {[1, 2, 3].map((idx) => (
          <div key={idx} className="bg-surface border border-border-theme p-6 rounded-3xl space-y-4">
            <div className="flex justify-between items-center border-b border-border-theme pb-4">
              <div className="h-4 bg-foreground/15 rounded w-1/3" />
              <div className="h-6 bg-accent/20 rounded-full w-20" />
            </div>
            <div className="flex items-center gap-3">
              <div className="w-12 h-14 bg-foreground/10 rounded-xl" />
              <div className="h-8 bg-foreground/10 rounded-xl w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default OrdersSkeleton;
