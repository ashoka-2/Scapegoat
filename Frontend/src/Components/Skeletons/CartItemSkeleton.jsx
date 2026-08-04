import React from "react";

/**
 * CartItemSkeleton Component
 * Placeholder skeleton for cart items in CartPage and CartDrawer
 */
const CartItemSkeleton = ({ count = 3 }) => {
  return (
    <div className="space-y-4 animate-pulse">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center justify-between gap-4 p-4 rounded-2xl bg-surface border border-border-theme/40"
        >
          <div className="flex items-center gap-3 flex-1">
            <div className="w-16 h-16 rounded-xl bg-foreground/10 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="w-3/4 h-3.5 bg-foreground/15 rounded-md" />
              <div className="w-1/2 h-2.5 bg-accent/20 rounded-md" />
            </div>
          </div>
          <div className="w-20 h-7 rounded-xl bg-foreground/10 shrink-0" />
        </div>
      ))}
    </div>
  );
};

export default CartItemSkeleton;
