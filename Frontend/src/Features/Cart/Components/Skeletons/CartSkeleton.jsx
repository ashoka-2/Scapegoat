import React from "react";
import CartItemSkeleton from "./CartItemSkeleton";

/**
 * CartSkeleton Component
 * Responsive skeleton matching CartPage.jsx layout
 */
const CartSkeleton = () => {
  return (
    <div className="w-full max-w-[1350px] mx-auto px-4 md:px-8 py-8 space-y-8 animate-pulse">
      {/* Title Header */}
      <div className="space-y-2 border-b border-border-theme/40 pb-6">
        <div className="w-24 h-3 bg-accent/20 rounded-md" />
        <div className="w-48 h-8 bg-foreground/20 rounded-xl" />
      </div>

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Cart Items List */}
        <div className="flex-1 space-y-4">
          <CartItemSkeleton />
          <CartItemSkeleton />
          <CartItemSkeleton />
        </div>

        {/* Summary Card */}
        <div className="w-full lg:w-96 h-96 bg-surface border border-border-theme/50 rounded-3xl p-6 space-y-6 shrink-0">
          <div className="w-36 h-6 bg-foreground/20 rounded-lg" />
          <div className="space-y-3">
            <div className="flex justify-between">
              <div className="w-20 h-4 bg-foreground/10 rounded-md" />
              <div className="w-16 h-4 bg-foreground/15 rounded-md" />
            </div>
            <div className="flex justify-between">
              <div className="w-20 h-4 bg-foreground/10 rounded-md" />
              <div className="w-16 h-4 bg-foreground/15 rounded-md" />
            </div>
          </div>
          <div className="w-full h-12 bg-accent/30 rounded-full mt-6" />
        </div>
      </div>
    </div>
  );
};

export default CartSkeleton;
