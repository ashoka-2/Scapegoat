import React from "react";

/**
 * PriceAndQuantity — price display (with strikethrough MRP) + quantity stepper.
 */
export default function PriceAndQuantity({
  currentPrice,
  originalPrice,
  currentStock,
  quantity,
  setQuantity,
  isOutOfStock,
}) {
  return (
    <div className="space-y-3">
      <div className="bg-surface border border-border-theme p-4 rounded-2xl space-y-1 shadow-sm">
        <div className="flex items-baseline gap-3">
          <span className="text-3xl sm:text-4xl font-extrabold text-accent">
            ₹{currentPrice.toLocaleString()}
          </span>
          {originalPrice > currentPrice && (
            <span className="text-sm font-semibold text-foreground/40 line-through">
              ₹{originalPrice.toLocaleString()}
            </span>
          )}
        </div>
        <p className="text-[11px] text-foreground/50 font-medium">
          Inclusive of all taxes. Free shipping on orders over ₹999.
        </p>
      </div>

      <div className="space-y-3 pt-2 bg-surface p-4 rounded-2xl border border-border-theme">
        <span className="text-xs font-bold text-foreground uppercase tracking-wider">Quantity:</span>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-background border border-border-theme rounded-xl overflow-hidden px-1">
            <button
              type="button"
              onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
              disabled={quantity <= 1 || isOutOfStock}
              className="px-3 py-2.5 text-foreground/70 hover:text-foreground hover:bg-surface font-extrabold text-sm transition disabled:opacity-30 cursor-pointer"
            >
              -
            </button>
            <input
              type="number"
              min={1}
              max={currentStock || 999}
              value={quantity}
              disabled={isOutOfStock}
              onChange={(e) => {
                const val = parseInt(e.target.value, 10);
                if (!isNaN(val) && val >= 1) {
                  setQuantity(Math.min(currentStock || 999, val));
                }
              }}
              className="w-12 text-center bg-transparent font-extrabold text-sm text-foreground outline-none focus:text-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
            />
            <button
              type="button"
              onClick={() => setQuantity((prev) => Math.min(currentStock, prev + 1))}
              disabled={quantity >= currentStock || isOutOfStock}
              className="px-4 py-2.5 text-foreground/70 hover:text-foreground hover:bg-surface font-extrabold text-sm transition disabled:opacity-30 cursor-pointer"
            >
              +
            </button>
          </div>

          {currentStock > 0 && currentStock <= 5 && (
            <span className="text-xs font-extrabold text-amber-400 animate-pulse flex items-center gap-1">
              <i className="ri-flashlight-fill text-amber-400" />
              <span>Only {currentStock} left in stock - order soon!</span>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
