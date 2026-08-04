import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../Hooks/useCart";

/**
 * CartPage Component (Full Width Shopping Cart)
 * Order item table/cards, bulk clear, summary card, coupon promo code, and checkout.
 */
const CartPage = () => {
  const navigate = useNavigate();
  const { user } = useSelector((state) => state.auth);
  const {
    cart,
    totalItems,
    subtotal,
    loading,
    handleGetCart,
    handleUpdateQuantity,
    handleRemoveFromCart,
    handleClearCart,
  } = useCart();

  useEffect(() => {
    if (user) {
      handleGetCart();
    }
  }, [user]);

  const items = cart?.items || [];
  const shippingFee = subtotal > 1000 ? 0 : 99;
  const grandTotal = subtotal + shippingFee;

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
    <div className="w-full space-y-6 selection:bg-accent selection:text-accent-content font-sans py-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <i className="ri-shopping-bag-3-fill text-accent" />
            <span>Shopping Cart</span>
          </h1>
          <p className="text-xs text-foreground/60 mt-1">
            Review your selected items, modify quantities, apply discount codes, and proceed to checkout.
          </p>
        </div>

        {items.length > 0 && (
          <button
            type="button"
            onClick={handleClearCart}
            className="text-xs font-bold text-red-400 hover:text-red-600 bg-red-500/10 px-3.5 py-2 rounded-xl border border-red-500/20 cursor-pointer transition flex items-center gap-1.5"
          >
            <i className="ri-delete-bin-line" />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {loading && !cart ? (
        <div className="py-16 text-center text-xs font-bold text-foreground/50 animate-pulse">
          Loading your shopping cart...
        </div>
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-surface border border-border-theme rounded-2xl p-8 space-y-4">
          <div className="w-20 h-20 rounded-full bg-accent/10 text-accent flex items-center justify-center text-4xl mx-auto">
            <i className="ri-shopping-cart-2-line" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-foreground">Your shopping cart is currently empty</h2>
            <p className="text-xs text-foreground/60">Discover thousands of amazing products listed across categories.</p>
          </div>
          <Link
            to="/shop"
            className="inline-block px-6 py-3 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow hover:opacity-90 transition"
          >
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column (2/3 width): Item List */}
          <div className="lg:col-span-2 space-y-4">
            {items.map((item, idx) => {
              const prod = item.product || {};
              const price = prod.sellingPrice?.amount || prod.maxPrice?.amount || 0;
              const img = getItemVariantImage(item);

              return (
                <div
                  key={item._id || idx}
                  className="bg-surface border border-border-theme p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm hover:border-accent/40 transition"
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div
                      onClick={() => navigate(`/product/${prod.slug || prod._id}`)}
                      className="w-20 h-24 bg-background rounded-xl overflow-hidden shrink-0 cursor-pointer border border-border-theme"
                    >
                      <img src={img} alt={prod.title} className="w-full h-full object-cover" />
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <h3
                        onClick={() => navigate(`/product/${prod.slug || prod._id}`)}
                        className="text-sm font-extrabold text-foreground truncate hover:text-accent cursor-pointer transition"
                      >
                        {prod.title || "Product Item"}
                      </h3>
                      <p className="text-xs text-foreground/50 font-medium">
                        Category: {prod.category?.name || "General"}
                      </p>
                      <p className="text-sm font-mono font-black text-accent">
                        ₹{Number(price).toLocaleString("en-IN")}
                      </p>

                      {/* Interactive Selected Attributes */}
                      {prod.attributes && Array.isArray(prod.attributes) && prod.attributes.length > 0 ? (
                        <div className="flex flex-wrap items-center gap-2 pt-1.5">
                          {prod.attributes.map((attr) => {
                            const attrName = attr.name || attr.key;
                            const options = attr.options || attr.values || [];
                            if (!attrName || options.length === 0) return null;
                            const currentSelectedMap = typeof item.selectedAttributes?.forEach === "function"
                              ? Object.fromEntries(item.selectedAttributes)
                              : (item.selectedAttributes || {});
                            const activeVal = currentSelectedMap[attrName] || options[0];

                            return (
                              <div key={attrName} className="flex items-center gap-1.5 text-xs bg-background border border-border-theme px-2.5 py-1 rounded-xl shadow-xs">
                                <span className="text-foreground/50 font-medium">{attrName}:</span>
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
                        <div className="flex flex-wrap items-center gap-1.5 pt-1">
                          {Object.entries(
                            typeof item.selectedAttributes.forEach === "function"
                              ? Object.fromEntries(item.selectedAttributes)
                              : item.selectedAttributes
                          ).map(([attrKey, attrVal]) => (
                            <span
                              key={attrKey}
                              className="text-[11px] font-bold text-foreground/80 bg-background border border-border-theme/80 px-2 py-0.5 rounded-lg flex items-center gap-1"
                            >
                              <span className="text-foreground/50">{attrKey}:</span>
                              <strong className="text-accent">{String(attrVal)}</strong>
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                  </div>

                  {/* Quantity & Controls */}
                  <div className="flex items-center justify-between sm:justify-end w-full sm:w-auto space-x-4 border-t sm:border-t-0 border-border-theme/40 pt-3 sm:pt-0">
                    <div className="flex items-center space-x-1 bg-background border border-border-theme rounded-xl px-2 py-1">
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item._id, Math.max(1, item.quantity - 1))}
                        className="text-foreground/60 hover:text-accent font-bold text-xs p-1 cursor-pointer"
                      >
                        <i className="ri-subtract-line" />
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={999}
                        value={item.quantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (!isNaN(val) && val >= 1) {
                            handleUpdateQuantity(item._id, val);
                          }
                        }}
                        className="w-10 text-center bg-transparent text-xs font-extrabold text-foreground font-mono outline-none focus:text-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                      <button
                        type="button"
                        onClick={() => handleUpdateQuantity(item._id, item.quantity + 1)}
                        className="text-foreground/60 hover:text-accent font-bold text-xs p-1 cursor-pointer"
                      >
                        <i className="ri-add-line" />
                      </button>
                    </div>

                    <div className="text-right">
                      <p className="text-xs font-mono font-extrabold text-foreground">
                        ₹{Number(price * item.quantity).toLocaleString("en-IN")}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveFromCart(item._id)}
                      className="text-red-400 hover:text-red-600 transition cursor-pointer p-1.5"
                      title="Delete item"
                    >
                      <i className="ri-delete-bin-line text-base" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column (1/3 width): Order Summary Card */}
          <div className="space-y-4">
            <div className="bg-surface border border-border-theme p-6 rounded-2xl space-y-4 shadow-sm">
              <h2 className="text-base font-black text-foreground border-b border-border-theme pb-3 flex items-center justify-between">
                <span>Order Summary</span>
                <span className="text-xs font-mono font-bold text-accent">{totalItems} Items</span>
              </h2>

              {/* Coupon Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/70 flex items-center gap-1">
                  <i className="ri-ticket-2-line text-accent" />
                  <span>Promo / Coupon Code</span>
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter code (e.g. WELCOME10)"
                    className="flex-1 bg-background border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                  />
                  <button
                    type="button"
                    onClick={() => alert("Promo code feature applied at final step.")}
                    className="px-4 py-2 rounded-xl bg-accent/10 border border-accent/30 text-accent font-bold text-xs hover:bg-accent hover:text-accent-content transition cursor-pointer"
                  >
                    Apply
                  </button>
                </div>
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-border-theme text-xs font-medium">
                <div className="flex items-center justify-between text-foreground/70">
                  <span>Items Subtotal</span>
                  <span className="font-mono font-bold text-foreground">₹{Number(subtotal).toLocaleString("en-IN")}</span>
                </div>

                <div className="flex items-center justify-between text-foreground/70">
                  <span>Shipping Charges</span>
                  <span className="font-mono font-bold text-foreground">
                    {shippingFee === 0 ? <span className="text-emerald-500 uppercase font-black text-[11px]">Free</span> : `₹${shippingFee}`}
                  </span>
                </div>

                {subtotal <= 1000 && (
                  <p className="text-[11px] text-amber-500 font-bold bg-amber-500/10 p-2 rounded-xl border border-amber-500/20">
                    💡 Add ₹{1000 - subtotal} more for FREE shipping!
                  </p>
                )}
              </div>

              {/* Grand Total */}
              <div className="pt-3 border-t border-border-theme flex items-center justify-between text-sm font-black">
                <span className="text-foreground">Grand Total:</span>
                <span className="font-mono text-lg text-accent">₹{Number(grandTotal).toLocaleString("en-IN")}</span>
              </div>

              <button
                type="button"
                onClick={() => alert("Checkout initiated!")}
                className="w-full py-3.5 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow-md hover:opacity-90 transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <span>Proceed to Checkout</span>
                <i className="ri-arrow-right-line text-sm" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CartPage;
