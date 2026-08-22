import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";

const STATUS_MESSAGES = [
  "✨ Analyzing fashion aesthetics & color palette...",
  "🔍 Matching luxury pieces from ScapeGoat catalog...",
  "👗 Curating coordinated head-to-toe bundle...",
  "💎 Finalizing stylist recommendation & fit notes...",
];

/**
 * Dynamic Cycling Status Header during streaming
 */
export const AIStreamingStatus = () => {
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
        {STATUS_MESSAGES[msgIndex]}
      </motion.span>
    </div>
  );
};

/**
 * Message Content Skeleton Loader
 */
export const AIMessageSkeleton = () => {
  return (
    <div className="space-y-3 w-full">
      <AIStreamingStatus />

      <div className="space-y-2 max-w-md pt-1">
        <div className="h-3.5 bg-border-theme/40 rounded-full w-5/6 animate-pulse" />
        <div className="h-3.5 bg-border-theme/40 rounded-full w-4/6 animate-pulse" />
        <div className="h-3.5 bg-border-theme/40 rounded-full w-3/6 animate-pulse" />
      </div>
    </div>
  );
};

export default AIMessageSkeleton;
