import React from "react";
import { motion } from "framer-motion";

/**
 * BuyBox — Add to Cart (with animated success state), Buy Now + Wishlist.
 */
export default function BuyBox({
  isOutOfStock,
  isAddingToCart,
  handleAddToCart,
  handleBuyNow,
  isWishlisted,
  handleToggleWishlist,
}) {
  return (
    <div className="flex flex-col sm:flex-row gap-3 pt-4">
      <motion.button
        type="button"
        onClick={handleAddToCart}
        disabled={isOutOfStock}
        whileHover={!isOutOfStock && !isAddingToCart ? { scale: 1.02 } : {}}
        whileTap={!isOutOfStock && !isAddingToCart ? { scale: 0.98 } : {}}
        className={`relative flex-1 py-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-lg transition overflow-hidden cursor-pointer flex items-center justify-center ${
          isOutOfStock
            ? "bg-foreground/20 text-foreground/40 border border-border-theme cursor-not-allowed shadow-none"
            : isAddingToCart
            ? "bg-emerald-500 text-white shadow-emerald-500/25"
            : "bg-accent text-accent-content shadow-accent/25 hover:opacity-95"
        }`}
      >
        {isAddingToCart ? (
          <div className="flex items-center gap-2.5 z-10">
            <div className="relative w-6 h-6 flex items-center justify-center">
              <motion.i
                initial={{ scale: 1 }}
                animate={{ scale: [1, 1.3, 0.9, 1.1, 1], rotate: [0, -10, 10, -5, 0] }}
                transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                className="ri-shopping-bag-3-fill text-lg text-white"
              />
              <motion.div
                initial={{ y: -26, x: -10, opacity: 0, scale: 0.7, rotate: -20 }}
                animate={{
                  y: [-26, -8, 2],
                  x: [-10, -3, 0],
                  opacity: [0, 1, 0],
                  scale: [0.7, 1, 0.4],
                  rotate: [-20, 0, 15],
                }}
                transition={{ duration: 0.45, ease: "easeIn" }}
                className="absolute text-xs"
              >
                👟
              </motion.div>
            </div>
            <motion.span
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className="font-black text-xs tracking-wider text-white"
            >
              ✓ Added to Bag!
            </motion.span>
          </div>
        ) : (
          <div className="flex items-center gap-2 z-10">
            <i className="ri-shopping-bag-line text-base" />
            <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
          </div>
        )}
      </motion.button>

      <button
        type="button"
        onClick={handleBuyNow}
        disabled={isOutOfStock}
        className="flex-1 py-4 rounded-2xl bg-foreground text-background font-extrabold text-xs uppercase tracking-wider shadow-lg hover:opacity-90 transition transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
      >
        <i className="ri-flashlight-line text-sm" />
        <span>Buy Now</span>
      </button>

      {/* Wishlist Button */}
      <button
        type="button"
        onClick={handleToggleWishlist}
        className={`py-4 px-4 sm:w-14 h-14 rounded-2xl flex items-center justify-center border transition shadow-md hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
          isWishlisted
            ? "bg-red-500/15 border-red-500/40 text-red-500"
            : "bg-surface border-border-theme hover:border-accent/40 text-foreground/70"
        }`}
        title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
      >
        <i className={isWishlisted ? "ri-heart-fill text-xl text-red-500" : "ri-heart-line text-xl"} />
        <span className="sm:hidden text-xs font-bold uppercase tracking-wider ml-2">
          {isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
        </span>
      </button>
    </div>
  );
}
