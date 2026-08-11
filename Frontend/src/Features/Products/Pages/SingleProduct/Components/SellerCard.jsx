import React from "react";

/**
 * SellerCard — seller trust badge (avatar, name, verified chip).
 */
export default function SellerCard({ seller }) {
  if (!seller) return null;

  return (
    <div className="bg-surface border border-border-theme p-4 rounded-2xl flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 text-accent font-extrabold flex items-center justify-center text-sm">
          {seller.fullname?.charAt(0) || "S"}
        </div>
        <div>
          <p className="text-xs font-extrabold text-foreground">
            Sold by {seller.fullname || "Verified Seller"}
          </p>
          <p className="text-[10px] text-foreground/50">Verified Merchant • 98% Positive Feedback</p>
        </div>
      </div>
      <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-extrabold">
        Verified Seller
      </span>
    </div>
  );
}
