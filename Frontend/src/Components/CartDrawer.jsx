import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "../Features/Cart/Hooks/useCart";
import { getCartItemImage } from "../Features/Cart/State/cart.slice";
import { useUserActivity } from "../Features/Products/Hooks/useUserActivity";

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

  const { fbtProducts, fetchFrequentlyBoughtTogether } = useUserActivity();

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (userId && (!cart || !cart.items)) {
      handleGetCart();
    }
  }, [userId]);

  const items = cart?.items || [];
  const firstId = items[0]?.product?._id || (typeof items[0]?.product === "string" ? items[0].product : null);

  useEffect(() => {
    if (isDrawerOpen && firstId) {
      fetchFrequentlyBoughtTogether(firstId);
    }
  }, [isDrawerOpen, firstId]);

const isColorAttrKey = (key) => /^colou?r$/i.test(String(key || "").trim());

const formatSelectedAttributesTag = (item) => {
  const selectedAttrs = typeof item.selectedAttributes?.forEach === "function"
    ? Object.fromEntries(item.selectedAttributes)
    : (item.selectedAttributes || {});

  if (!selectedAttrs || Object.keys(selectedAttrs).length === 0) return null;

  const vals = Object.values(selectedAttrs).filter(Boolean);
  if (vals.length === 0) return null;

  return vals.join(" | ");
};

const getItemVariantImage = (item) => {
  const prod = item.product || {};
  const selectedAttrs = typeof item.selectedAttributes?.forEach === "function"
    ? Object.fromEntries(item.selectedAttributes)
    : (item.selectedAttributes || {});

  if (prod.variants && prod.variants.length > 0 && selectedAttrs) {
    const colorKey = Object.keys(selectedAttrs).find(isColorAttrKey);
    const colorValue = colorKey ? selectedAttrs[colorKey] : null;

    if (colorValue) {
      const matchedVar = prod.variants.find((v) => {
        const vName = (v.name || "").toLowerCase();
        if (vName.includes(String(colorValue).toLowerCase())) return true;

        const vAttrs = typeof v.attributes?.forEach === "function"
          ? Object.fromEntries(v.attributes)
          : (v.attributes?._doc || v.attributes || {});

        const vColorKey = Object.keys(vAttrs).find(isColorAttrKey);
        if (vColorKey && String(vAttrs[vColorKey]).trim().toLowerCase() === String(colorValue).trim().toLowerCase()) {
          return true;
        }

        if (Array.isArray(v.dynamicAttributes)) {
          return v.dynamicAttributes.some((da) => {
            const k = da.key || da.name || "";
            if (isColorAttrKey(k)) {
              const vals = (da.values || da.options || [da.value]).map((x) => String(x).toLowerCase());
              return vals.includes(String(colorValue).toLowerCase());
            }
            return false;
          });
        }
        return false;
      });

      if (matchedVar && matchedVar.images && matchedVar.images.length > 0) {
        const vImg = matchedVar.images[0]?.url || matchedVar.images[0];
        if (vImg) return vImg;
      }
    }
  }

  if (item.variant && item.variant.images && item.variant.images.length > 0) {
    const vImg = item.variant.images[0]?.url || item.variant.images[0];
    if (vImg) return vImg;
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
                  const price = item.variant?.price?.amount || item.variant?.priceAmount || prod.sellingPrice?.amount || prod.maxPrice?.amount || 0;
                  const img = getCartItemImage(item);
                  const itemStock = item.variant?.stock ?? prod.stock ?? 999;
                  const isOutOfStock = prod.stockStatus === "outofstock" || (prod.manageStock && itemStock <= 0);
                  const exceedsStock = prod.manageStock && item.quantity > itemStock;

                  return (
                    <div
                      key={item._id || idx}
                      className={`flex gap-4 p-4 rounded-2xl transition group border ${
                        isOutOfStock
                          ? "bg-red-500/5 border-red-500/40"
                          : exceedsStock
                          ? "bg-amber-500/5 border-amber-500/40"
                          : "bg-background border-border-theme hover:border-accent/40"
                      }`}
                    >
                      {/* Image Thumbnail */}
                      <div
                        onClick={() => {
                          if (prod._id || prod.slug) {
                            navigate(`/product/${prod.slug || prod._id}`);
                            handleSetDrawerOpen(false);
                          }
                        }}
                        className="w-16 h-20 bg-surface rounded-xl overflow-hidden shrink-0 cursor-pointer border border-border-theme relative"
                      >
                        <img src={img} alt={prod.title} className={`w-full h-full object-cover group-hover:scale-105 transition duration-300 ${isOutOfStock ? "grayscale opacity-60" : ""}`} />
                        {isOutOfStock && (
                          <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-0.5 text-center">
                            <span className="text-[8px] font-black text-white uppercase tracking-tighter leading-none">Out of Stock</span>
                          </div>
                        )}
                      </div>

                      {/* Item Details */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between py-0.5">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
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
                            {isOutOfStock ? (
                              <span className="text-[9px] font-extrabold text-red-400 bg-red-500/10 border border-red-500/30 px-1.5 py-0.5 rounded">
                                ⚠️ Sold Out
                              </span>
                            ) : exceedsStock ? (
                              <span className="text-[9px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-1.5 py-0.5 rounded">
                                ⚠️ Only {itemStock} left
                              </span>
                            ) : null}
                          </div>

                          <p className="text-[11px] font-mono font-bold text-accent mt-0.5">
                            ₹{Number(price).toLocaleString("en-IN")}
                          </p>

                          {/* Selected Attributes Tag Display (e.g. White | UK6) */}
                          {formatSelectedAttributesTag(item) && (
                            <p className="text-[10px] font-bold text-foreground/70 tracking-wide mt-1 bg-surface border border-border-theme/70 px-1.5 py-0.5 rounded-md inline-block w-fit">
                              {formatSelectedAttributesTag(item)}
                            </p>
                          )}
                        </div>

                        {/* Quantity Controls & Remove */}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-center bg-surface border border-border-theme rounded-xl overflow-hidden px-1">
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item._id, Math.max(1, item.quantity - 1))}
                              disabled={item.quantity <= 1 || isOutOfStock}
                              className="px-2.5 py-1 text-foreground/70 hover:text-foreground hover:bg-background font-extrabold text-xs transition disabled:opacity-30 cursor-pointer"
                            >
                              -
                            </button>
                            <input
                              type="number"
                              min={1}
                              max={itemStock}
                              value={item.quantity}
                              disabled={isOutOfStock}
                              onChange={(e) => {
                                const val = parseInt(e.target.value, 10);
                                if (!isNaN(val) && val >= 1) {
                                  handleUpdateQuantity(item._id, Math.min(itemStock, val));
                                }
                              }}
                              className="w-10 text-center bg-transparent text-xs font-extrabold text-foreground font-mono outline-none focus:text-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                            />
                            <button
                              type="button"
                              onClick={() => handleUpdateQuantity(item._id, Math.min(itemStock, item.quantity + 1))}
                              disabled={item.quantity >= itemStock || isOutOfStock}
                              className="px-2.5 py-1 text-foreground/70 hover:text-foreground hover:bg-background font-extrabold text-xs transition disabled:opacity-30 cursor-pointer"
                            >
                              +
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

              {/* Frequently Bought Together Slider inside Drawer */}
              {items.length > 0 && fbtProducts && fbtProducts.length > 0 && (
                <div className="pt-4 border-t border-border-theme/40">
                  <div className="flex items-center justify-between mb-2.5">
                    <span className="text-[10px] font-black uppercase tracking-widest text-accent">
                      Frequently Bought Together
                    </span>
                  </div>
                  <div className="flex gap-2.5 overflow-x-auto scrollbar-hide pb-2">
                    {fbtProducts.slice(0, 5).map((fbt) => {
                      const price = fbt.sellingPrice?.amount || fbt.maxPrice?.amount || 0;
                      const img = fbt.images?.[0]?.url || (typeof fbt.images?.[0] === "string" ? fbt.images[0] : null);
                      return (
                        <div
                          key={fbt._id}
                          onClick={() => {
                            navigate(`/product/${fbt.slug || fbt._id}`);
                            handleSetDrawerOpen(false);
                          }}
                          className="flex-shrink-0 w-28 bg-background border border-border-theme p-2 rounded-xl text-center cursor-pointer hover:border-accent/50 transition group"
                        >
                          <div className="w-full h-16 rounded-lg bg-surface overflow-hidden mb-1.5">
                            <img src={img} alt={fbt.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          </div>
                          <p className="text-[10px] font-bold text-foreground truncate">{fbt.title}</p>
                          <p className="text-[10px] font-mono font-extrabold text-accent">₹{Number(price).toLocaleString("en-IN")}</p>
                        </div>
                      );
                    })}
                  </div>
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

                {(() => {
                  const hasOutOfStock = items.some((item) => {
                    const prod = item.product || {};
                    const itemStock = item.variant?.stock ?? prod.stock ?? 0;
                    return prod.stockStatus === "outofstock" || (prod.manageStock && itemStock <= 0) || (prod.manageStock && item.quantity > itemStock);
                  });

                  return (
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
                        disabled={hasOutOfStock}
                        onClick={() => {
                          handleSetDrawerOpen(false);
                          navigate("/cart");
                        }}
                        className={`py-3 rounded-xl font-extrabold text-xs shadow transition flex items-center justify-center gap-1 ${
                          hasOutOfStock
                            ? "bg-foreground/10 text-foreground/40 border border-border-theme cursor-not-allowed"
                            : "bg-accent text-accent-content hover:opacity-90 cursor-pointer"
                        }`}
                      >
                        <span>{hasOutOfStock ? "Unavailable" : "Checkout"}</span>
                        <i className="ri-arrow-right-line" />
                      </button>
                    </div>
                  );
                })()}
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
