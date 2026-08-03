import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../Features/Cart/Hooks/useCart";

/**
 * CartDrawer Component (Snitch Style + Apple/Shopify Polish)
 * Slide-over drawer with backdrop blur, item list, quantity controls, and checkout footer.
 */
const CartDrawer = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const {
    cart,
    totalItems,
    subtotal,
    isDrawerOpen,
    loading,
    handleGetCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleSetDrawerOpen,
  } = useCart();

  useEffect(() => {
    if (isDrawerOpen && user) {
      handleGetCart();
    }
  }, [isDrawerOpen, user]);

  const items = cart?.items || [];

const getItemVariantImage = (item) => {
  const prod = item.product || {};
  const selectedAttrs = typeof item.selectedAttributes?.forEach === "function"
    ? Object.fromEntries(item.selectedAttributes)
    : (item.selectedAttributes || {});

  if (item.variant && item.variant.images && item.variant.images.length > 0) {
    const vImg = item.variant.images[0]?.url || item.variant.images[0];
    if (vImg) return vImg;
  }

  if (prod.variants && prod.variants.length > 0 && selectedAttrs && Object.keys(selectedAttrs).length > 0) {
    const matchedVar = prod.variants.find((v) => {
      const vAttrs = typeof v.attributes?.forEach === "function"
        ? Object.fromEntries(v.attributes)
        : (v.attributes?._doc || v.attributes || {});
      return Object.entries(selectedAttrs).every(([k, val]) => {
        if (!val) return true;
        const vVal = vAttrs[k];
        if (!vVal) return true;
        return String(vVal).trim().toLowerCase() === String(val).trim().toLowerCase();
      });
    });
    if (matchedVar && matchedVar.images && matchedVar.images.length > 0) {
      const vImg = matchedVar.images[0]?.url || matchedVar.images[0];
      if (vImg) return vImg;
    }
  }

  return prod.images?.[0]?.url || (typeof prod.images?.[0] === "string" ? prod.images[0] : null) || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200";
};

  return (
    <AnimatePresence>
      {isDrawerOpen && (
        <>
          {/* Backdrop Blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => handleSetDrawerOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[1100]"
          />

          {/* Drawer Slide-Over Panel */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-surface border-l border-border-theme z-[1200] flex flex-col justify-between shadow-2xl font-sans"
          >
            {/* Drawer Header */}
            <div className="p-5 border-b border-border-theme flex items-center justify-between bg-background/50">
              <div className="flex items-center space-x-2.5">
                <i className="ri-shopping-bag-3-fill text-2xl text-accent" />
                <h2 className="text-lg font-black text-foreground tracking-tight">Your Shopping Bag</h2>
                <span className="text-xs font-mono font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-full border border-accent/20">
                  {totalItems} {totalItems === 1 ? "item" : "items"}
                </span>
              </div>
              <button
                type="button"
                onClick={() => handleSetDrawerOpen(false)}
                className="w-9 h-9 rounded-full bg-surface border border-border-theme hover:bg-accent hover:text-accent-content transition flex items-center justify-center text-foreground/60 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 scrollbar-thin">
              {loading && !cart ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                </div>
              ) : items.length > 0 ? (
                items.map((item, idx) => {
                  const prod = item.product || {};
                  const price = prod.sellingPrice?.amount || prod.maxPrice?.amount || 0;
                  const img = getItemVariantImage(item);

                  return (
                    <div
                      key={item._id || idx}
                      className="flex gap-4 p-4 bg-background border border-border-theme rounded-2xl hover:border-accent/40 transition group"
                    >
                      {/* Image Thumbnail */}
                      <div
                        onClick={() => {
                          if (prod._id || prod.slug) {
                            navigate(`/product/${prod.slug || prod._id}`);
                            handleSetDrawerOpen(false);
                          }
                        }}
                        className="w-16 h-20 bg-surface rounded-xl overflow-hidden shrink-0 cursor-pointer border border-border-theme"
                      >
                        <img src={img} alt={prod.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <h3
                            onClick={() => {
                              if (prod._id || prod.slug) {
                                navigate(`/product/${prod.slug || prod._id}`);
                                handleSetDrawerOpen(false);
                              }
                            }}
                            className="text-xs font-bold text-foreground truncate hover:text-accent cursor-pointer transition"
                          >
                            {prod.title || "Product Item"}
                          </h3>
                          <p className="text-[11px] font-mono font-bold text-accent mt-0.5">
                            ₹{Number(price).toLocaleString("en-IN")}
                          </p>

                          {/* Interactive Selected Attributes */}
                          {prod.attributes && Array.isArray(prod.attributes) && prod.attributes.length > 0 ? (
                            <div className="flex flex-wrap items-center gap-1.5 pt-1">
                              {prod.attributes.map((attr) => {
                                const attrName = attr.name || attr.key;
                                const options = attr.options || attr.values || [];
                                if (!attrName || options.length === 0) return null;
                                const currentSelectedMap = typeof item.selectedAttributes?.forEach === "function"
                                  ? Object.fromEntries(item.selectedAttributes)
                                  : (item.selectedAttributes || {});
                                const activeVal = currentSelectedMap[attrName] || options[0];

                                return (
                                  <div key={attrName} className="flex items-center gap-1 text-[10px] bg-surface border border-border-theme/70 px-1.5 py-0.5 rounded-md">
                                    <span className="text-foreground/50">{attrName}:</span>
                                    <select
                                      value={activeVal}
                                      onChange={(e) => {
                                        const newSelected = { ...currentSelectedMap, [attrName]: e.target.value };
                                        handleUpdateQuantity(item._id, item.quantity, newSelected);
                                      }}
                                      className="bg-transparent font-extrabold text-accent focus:outline-none cursor-pointer"
                                    >
                                      {options.map((opt) => (
                                        <option key={opt} value={opt} className="bg-surface text-foreground font-bold">
                                          {opt}
                                        </option>
                                      ))}
                                    </select>
                                  </div>
                                );
                              })}
                            </div>
                          ) : item.selectedAttributes ? (
                            <div className="flex flex-wrap gap-1 mt-1">
                              {Object.entries(
                                typeof item.selectedAttributes.forEach === "function"
                                  ? Object.fromEntries(item.selectedAttributes)
                                  : item.selectedAttributes
                              ).map(([attrKey, attrVal]) => (
                                <span
                                  key={attrKey}
                                  className="text-[10px] font-bold text-foreground/70 bg-background border border-border-theme/60 px-1.5 py-0.5 rounded-md"
                                >
                                  {attrKey}: <strong className="text-accent">{String(attrVal)}</strong>
                                </span>
                              ))}
                            </div>
                          ) : null}
                        </div>

                        {/* Quantity Controls & Remove */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center space-x-2 bg-surface border border-border-theme rounded-xl px-2 py-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item._id, Math.max(1, item.quantity - 1))}
                              className="text-foreground/60 hover:text-accent font-bold text-xs px-1 cursor-pointer"
                            >
                              <i className="ri-subtract-line" />
                            </button>
                            <span className="text-xs font-bold text-foreground font-mono px-1">
                              {item.quantity}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                              className="text-foreground/60 hover:text-accent font-bold text-xs px-1 cursor-pointer"
                            >
                              <i className="ri-add-line" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleRemoveFromCart(item._id)}
                            className="text-red-400 hover:text-red-600 transition cursor-pointer p-1"
                            title="Remove from bag"
                          >
                            <i className="ri-delete-bin-line text-sm" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-4">
                  <div className="w-16 h-16 rounded-full bg-accent/10 text-accent flex items-center justify-center text-3xl">
                    <i className="ri-shopping-bag-line" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Your shopping bag is empty</h3>
                    <p className="text-xs text-foreground/50 mt-1">Explore our products and find something you love.</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      handleSetDrawerOpen(false);
                      navigate("/shop");
                    }}
                    className="px-5 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs shadow hover:opacity-90 transition cursor-pointer"
                  >
                    Explore Shop
                  </button>
                </div>
              )}
            </div>

            {/* Footer Summary & Checkout Button */}
            {items.length > 0 && (
              <div className="p-5 border-t border-border-theme bg-background/50 space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-foreground/70 uppercase tracking-wider">Subtotal:</span>
                  <span className="text-base font-extrabold text-foreground font-mono">
                    ₹{Number(subtotal).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => {
                      handleSetDrawerOpen(false);
                      navigate("/cart");
                    }}
                    className="py-3 rounded-xl bg-surface border border-border-theme text-foreground font-bold text-xs hover:bg-background transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <i className="ri-shopping-cart-2-line" />
                    <span>View Cart</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      handleSetDrawerOpen(false);
                      navigate("/cart");
                    }}
                    className="py-3 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1"
                  >
                    <span>Checkout</span>
                    <i className="ri-arrow-right-line" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
