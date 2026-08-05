import React from "react";

const AboutSkeleton = () => {
  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 sm:px-6 md:px-12 py-12 text-center max-w-5xl mx-auto space-y-10 animate-pulse">
      <div className="h-12 bg-foreground/15 rounded-2xl w-1/2" />
      <div className="w-20 h-1 bg-accent/40 rounded-full" />
      <div className="h-10 bg-foreground/10 rounded-2xl w-3/4" />

      <div className="w-full h-64 bg-surface p-8 rounded-3xl border border-border-theme space-y-4">
        <div className="h-4 bg-foreground/15 rounded-lg w-full" />
        <div className="h-4 bg-foreground/10 rounded-lg w-5/6" />
        <div className="h-4 bg-foreground/10 rounded-lg w-4/5" />
        <div className="h-4 bg-foreground/10 rounded-lg w-2/3" />
      </div>
    </div>
  );
};

export default AboutSkeleton;
