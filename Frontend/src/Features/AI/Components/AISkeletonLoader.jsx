import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const STATUS_MESSAGES = [
  "✨ Analyzing fashion aesthetics & color palette...",
  "🔍 Matching luxury pieces from ScapeGoat catalog...",
  "👗 Curating coordinated head-to-toe bundle...",
  "🎨 Rendering AI virtual try-on lookbook...",
  "💎 Finalizing stylist recommendation & fit notes...",
];

/**
 * Dynamic Cycling Status Header during streaming
 */
export const AIStreamingStatus = ({ isVisualIntent = false }) => {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIndex((prev) => (prev + 1) % STATUS_MESSAGES.length);
    }, 2200);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2.5 py-1 text-xs font-semibold text-accent">
      <div className="relative flex items-center justify-center">
        <span className="w-2.5 h-2.5 rounded-full bg-accent animate-ping opacity-60 absolute" />
        <span className="w-2 h-2 rounded-full bg-accent" />
      </div>
      <motion.span
        key={msgIndex}
        initial={{ opacity: 0, y: 3 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -3 }}
        transition={{ duration: 0.3 }}
        className="font-medium text-foreground/80"
      >
        {isVisualIntent ? "🎨 Generating AI Virtual Try-On Render..." : STATUS_MESSAGES[msgIndex]}
      </motion.span>
    </div>
  );
};

/**
 * Image-Sized Skeleton for Virtual Try-On Rendering
 */
export const AIVisualSkeleton = () => {
  return (
    <div className="relative w-full max-w-sm rounded-3xl overflow-hidden border border-accent/30 bg-surface/60 p-4 space-y-3 shadow-xl">
      {/* Top Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="text-[11px] font-black uppercase tracking-wider text-accent">
            Rendering Virtual Lookbook
          </span>
        </div>
        <span className="text-[10px] font-mono text-foreground/40 animate-pulse">
          FLUX.1 High-Fashion
        </span>
      </div>

      {/* Image-Sized Shimmer Box (4:5 aspect ratio) */}
      <div className="relative aspect-[4/5] w-full rounded-2xl bg-gradient-to-br from-background via-surface to-background overflow-hidden border border-border-theme flex flex-col items-center justify-center p-6 text-center space-y-3">
        {/* Animated Light Sweep Bar */}
        <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.8s_infinite] bg-gradient-to-r from-transparent via-accent/15 to-transparent" />

        {/* Center Sparkle Icon */}
        <div className="w-16 h-16 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-3xl shadow-inner relative">
          <i className="ri-sparkling-2-fill animate-spin text-2xl" style={{ animationDuration: "6s" }} />
          <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-emerald-400 animate-ping opacity-75" />
        </div>

        <div className="space-y-1 relative z-10">
          <p className="text-xs font-black uppercase tracking-wide text-foreground">
            Synthesizing Outfit on Likeness
          </p>
          <p className="text-[11px] text-foreground/50 max-w-[200px] leading-tight">
            Applying fabric textures, lighting, and fit alignment...
          </p>
        </div>

        {/* Pulsing Progress Line */}
        <div className="w-3/4 h-1.5 bg-background rounded-full overflow-hidden border border-border-theme mt-2">
          <div className="h-full bg-accent rounded-full animate-[pulse_1.2s_infinite] w-full" />
        </div>
      </div>
    </div>
  );
};

/**
 * Message Content Skeleton Loader
 */
export const AIMessageSkeleton = ({ hasVisual = false }) => {
  return (
    <div className="space-y-3 w-full">
      <AIStreamingStatus isVisualIntent={hasVisual} />

      {hasVisual && <AIVisualSkeleton />}

      <div className="space-y-2 max-w-md pt-1">
        <div className="h-3.5 bg-border-theme/40 rounded-full w-5/6 animate-pulse" />
        <div className="h-3.5 bg-border-theme/40 rounded-full w-4/6 animate-pulse" />
        <div className="h-3.5 bg-border-theme/40 rounded-full w-3/6 animate-pulse" />
      </div>
    </div>
  );
};

export default AIMessageSkeleton;
