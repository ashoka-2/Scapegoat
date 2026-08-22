import React from "react";

/**
 * AIAssistantSkeleton Component
 * Full-page high-fidelity skeleton for the ScapeGoat AI Stylist Studio
 */
const AIAssistantSkeleton = () => {
  return (
    <div className="flex h-screen w-full bg-background overflow-hidden font-sans select-none">
      {/* ── Left Sidebar Skeleton (Desktop) ── */}
      <div className="hidden md:flex flex-col w-72 h-full bg-surface border-r border-border-theme p-4 space-y-4 shrink-0">
        {/* Brand & New Chat Button */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-accent/20 animate-pulse" />
            <div className="h-4 w-28 bg-border-theme/60 rounded-lg animate-pulse" />
          </div>
          <div className="w-8 h-8 rounded-xl bg-border-theme/40 animate-pulse" />
        </div>

        {/* New Chat Button Skeleton */}
        <div className="h-10 w-full rounded-2xl bg-accent/15 border border-accent/20 animate-pulse" />

        {/* Search Bar Skeleton */}
        <div className="h-9 w-full rounded-xl bg-background border border-border-theme/60 animate-pulse" />

        {/* Session Thread Items */}
        <div className="flex-1 space-y-2.5 pt-2">
          <div className="h-3 w-20 bg-border-theme/40 rounded animate-pulse" />
          {[1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="p-3 rounded-2xl bg-background/60 border border-border-theme/40 space-y-1.5 animate-pulse"
            >
              <div className="h-3.5 bg-border-theme/60 rounded-md w-4/5" />
              <div className="h-2.5 bg-border-theme/30 rounded w-1/2" />
            </div>
          ))}
        </div>

        {/* Quota Footer Skeleton */}
        <div className="p-3 rounded-2xl bg-background border border-border-theme/60 space-y-2 animate-pulse">
          <div className="flex items-center justify-between">
            <div className="h-3 w-16 bg-border-theme/60 rounded" />
            <div className="h-3 w-12 bg-accent/30 rounded" />
          </div>
          <div className="h-1.5 w-full bg-border-theme/40 rounded-full" />
        </div>
      </div>

      {/* ── Main Chat Area Skeleton ── */}
      <div className="flex-1 flex flex-col justify-between h-full min-w-0 bg-background">
        {/* Top Navbar Skeleton */}
        <header className="px-4 sm:px-6 py-3.5 border-b border-border-theme/60 bg-surface/60 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-background border border-border-theme animate-pulse" />
            <div className="h-4 w-24 bg-border-theme/60 rounded-md animate-pulse" />
          </div>
          <div className="flex items-center gap-2.5">
            <div className="h-7 w-32 rounded-full bg-background border border-border-theme animate-pulse hidden sm:block" />
            <div className="h-8 w-24 rounded-xl bg-accent/20 animate-pulse" />
          </div>
        </header>

        {/* Center Stream Content Skeleton */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 max-w-4xl mx-auto w-full space-y-6">
          {/* Welcome Header */}
          <div className="py-8 flex flex-col items-center text-center space-y-4">
            <div className="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/20 animate-pulse flex items-center justify-center">
              <i className="ri-sparkling-fill text-accent text-2xl animate-spin" style={{ animationDuration: "4s" }} />
            </div>
            <div className="space-y-2 flex flex-col items-center">
              <div className="h-3 w-36 bg-accent/30 rounded-full animate-pulse" />
              <div className="h-7 w-64 sm:w-96 bg-border-theme/60 rounded-xl animate-pulse" />
              <div className="h-3.5 w-48 sm:w-80 bg-border-theme/30 rounded-lg animate-pulse" />
            </div>

            {/* Quick Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl pt-4">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="p-4 rounded-3xl bg-surface/60 border border-border-theme/80 space-y-2 animate-pulse text-left"
                >
                  <div className="w-8 h-8 rounded-2xl bg-accent/15" />
                  <div className="h-3.5 w-3/4 bg-border-theme/60 rounded-md" />
                  <div className="h-2.5 w-full bg-border-theme/30 rounded" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom Input Box Skeleton */}
        <div className="p-4 sm:p-6 bg-surface/60 border-t border-border-theme/60 max-w-4xl mx-auto w-full shrink-0">
          <div className="h-14 w-full rounded-3xl bg-background border border-border-theme/80 flex items-center px-4 justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 rounded-xl bg-border-theme/40" />
              <div className="h-3.5 w-40 sm:w-64 bg-border-theme/40 rounded-lg" />
            </div>
            <div className="w-9 h-9 rounded-2xl bg-accent/30" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssistantSkeleton;
