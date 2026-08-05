import React from "react";

const LegalSkeleton = () => {
  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto space-y-8 animate-pulse">
      <div className="text-center space-y-3 max-w-sm mx-auto">
        <div className="h-4 bg-accent/30 rounded-full w-1/3 mx-auto" />
        <div className="h-10 bg-foreground/15 rounded-2xl w-3/4 mx-auto" />
      </div>

      <div className="bg-surface border border-border-theme rounded-3xl p-8 space-y-4">
        <div className="h-4 bg-foreground/15 rounded w-full" />
        <div className="h-4 bg-foreground/10 rounded w-5/6" />
        <div className="h-4 bg-foreground/10 rounded w-4/5" />
        <div className="h-4 bg-foreground/10 rounded w-3/4" />
        <div className="h-4 bg-foreground/10 rounded w-2/3" />
      </div>
    </div>
  );
};

export default LegalSkeleton;
