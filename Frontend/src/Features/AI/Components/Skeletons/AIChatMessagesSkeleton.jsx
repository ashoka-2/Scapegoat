import React from "react";

/**
 * Shimmering skeleton loader rendered inside the chat messages stream
 * when switching between threads or loading a chat session history.
 */
const AIChatMessagesSkeleton = () => {
  return (
    <div className="space-y-6 w-full animate-pulse py-2">
      {/* ── User Message Skeleton ── */}
      <div className="flex justify-end">
        <div className="max-w-[75%] rounded-3xl rounded-tr-md p-4 bg-accent/20 border border-accent/20 space-y-2">
          <div className="h-3.5 bg-accent/30 rounded-md w-48" />
          <div className="h-3 bg-accent/20 rounded-md w-32" />
        </div>
      </div>

      {/* ── Assistant Response Skeleton ── */}
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-8 h-8 rounded-2xl bg-accent/20 border border-accent/30 shrink-0" />

        {/* Message Bubble + Outfit Card Skeleton */}
        <div className="flex-1 max-w-[85%] space-y-4">
          <div className="p-5 rounded-3xl rounded-tl-md bg-surface border border-border-theme/70 space-y-2.5">
            <div className="flex items-center gap-2 mb-1">
              <div className="h-2.5 bg-foreground/20 rounded-md w-20" />
              <div className="h-2 bg-foreground/10 rounded-md w-12" />
            </div>
            <div className="h-3.5 bg-foreground/15 rounded-md w-full" />
            <div className="h-3.5 bg-foreground/15 rounded-md w-4/5" />
            <div className="h-3 bg-foreground/10 rounded-md w-3/5" />
          </div>

          {/* Outfit Bundle Card Placeholder Skeleton */}
          <div className="p-4 rounded-3xl bg-surface/80 border border-border-theme/60 space-y-3">
            <div className="flex items-center justify-between">
              <div className="h-4 bg-foreground/20 rounded-md w-40" />
              <div className="h-4 bg-accent/30 rounded-md w-20" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-1">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-background/80 rounded-2xl border border-border-theme/40" />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── User Message 2 Skeleton ── */}
      <div className="flex justify-end">
        <div className="max-w-[70%] rounded-3xl rounded-tr-md p-4 bg-accent/20 border border-accent/20 space-y-2">
          <div className="h-3.5 bg-accent/30 rounded-md w-56" />
        </div>
      </div>

      {/* ── Assistant Response 2 Skeleton ── */}
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-2xl bg-accent/20 border border-accent/30 shrink-0" />
        <div className="flex-1 max-w-[80%] p-4 rounded-3xl rounded-tl-md bg-surface border border-border-theme/70 space-y-2">
          <div className="h-3.5 bg-foreground/15 rounded-md w-full" />
          <div className="h-3 bg-foreground/10 rounded-md w-2/3" />
        </div>
      </div>
    </div>
  );
};

export default AIChatMessagesSkeleton;
