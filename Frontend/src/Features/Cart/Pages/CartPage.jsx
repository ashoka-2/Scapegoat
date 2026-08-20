import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../Hooks/useCart";
import { addToast } from "../../../utils/toast.slice";
import { getCartItemImage } from "../State/cart.slice";
import { useUserActivity } from "../../Products/Hooks/useUserActivity";
import ProductCarousel from "../../Products/Components/ProductCarousel";
import CartItemSkeleton from "../Components/Skeletons/CartItemSkeleton";
import BannerCarousel from "../../Home/Components/BannerCarousel";
import { DeleteBtn } from "../../../Shared/Buttons";
import customAxios from "../../../utils/axios";

/**
 * CartPage Component (Full Width Shopping Cart)
 * Order item table/cards, bulk clear, summary card, coupon promo code, and checkout.
 */
const CartPage = () => {
  const dispatch = useDispatch();
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

  const {
    recentlyViewed,
    fbtProducts,
    fetchRecentlyViewed,
    fetchFrequentlyBoughtTogether,
  } = useUserActivity();

  const userId = user?._id || user?.id;

  useEffect(() => {
    if (userId) {
      if (!cart || !cart.items) {
        handleGetCart();
      }
      fetchRecentlyViewed(10);
    }
  }, [userId]);

  const items = cart?.items || [];
  const firstProdId =
    items[0]?.product?._id ||
    (typeof items[0]?.product === "string" ? items[0].product : null);

  useEffect(() => {
    if (firstProdId) {
      fetchFrequentlyBoughtTogether(firstProdId);
    }
  }, [firstProdId]);
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await customAxios.post("/api/coupons/validate", {
        code: couponCodeInput.trim(),
        cartItems: items,
        totalAmount: subtotal,
      });
      if (data?.success) {
        setAppliedCoupon(data);
        dispatch(addToast({ message: `🎉 ${data.message}`, type: "success" }));
      }
    } catch (err) {
      dispatch(
        addToast({
          message: err.response?.data?.message || err.message || "Invalid coupon code.",
          type: "error",
        })
      );
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponCodeInput("");
    dispatch(addToast({ message: "Coupon removed.", type: "info" }));
  };

  const discountAmount = appliedCoupon?.discountAmount || 0;
  const shippingFee = subtotal > 1000 ? 0 : 99;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingFee);

  const isColorAttrKey = (key) => /^colou?r$/i.test(String(key || "").trim());

  const formatSelectedAttributesTag = (item) => {
    const selectedAttrs =
      typeof item.selectedAttributes?.forEach === "function"
        ? Object.fromEntries(item.selectedAttributes)
        : item.selectedAttributes || {};

    if (!selectedAttrs || Object.keys(selectedAttrs).length === 0) return null;

    const vals = Object.values(selectedAttrs).filter(Boolean);
    if (vals.length === 0) return null;

    return vals.join(" | ");
  };

  const getItemVariantImage = (item) => {
    const prod = item.product || {};
    const selectedAttrs =
      typeof item.selectedAttributes?.forEach === "function"
        ? Object.fromEntries(item.selectedAttributes)
        : item.selectedAttributes || {};

    if (prod.variants && prod.variants.length > 0 && selectedAttrs) {
      const colorKey = Object.keys(selectedAttrs).find(isColorAttrKey);
      const colorValue = colorKey ? selectedAttrs[colorKey] : null;

      if (colorValue) {
        const matchedVar = prod.variants.find((v) => {
          const vName = (v.name || "").toLowerCase();
          if (vName.includes(String(colorValue).toLowerCase())) return true;

          const vAttrs =
            typeof v.attributes?.forEach === "function"
              ? Object.fromEntries(v.attributes)
              : v.attributes?._doc || v.attributes || {};

          const vColorKey = Object.keys(vAttrs).find(isColorAttrKey);
          if (
            vColorKey &&
            String(vAttrs[vColorKey]).trim().toLowerCase() ===
              String(colorValue).trim().toLowerCase()
          ) {
            return true;
          }

          if (Array.isArray(v.dynamicAttributes)) {
            return v.dynamicAttributes.some((da) => {
              const k = da.key || da.name || "";
              if (isColorAttrKey(k)) {
                const vals = (da.values || da.options || [da.value]).map((x) =>
                  String(x).toLowerCase(),
                );
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

    return (
      prod.images?.[0]?.url ||
      (typeof prod.images?.[0] === "string" ? prod.images[0] : null) ||
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200"
    );
  };

  return (
    <div className="w-full space-y-6 selection:bg-accent selection:text-accent-content font-sans py-4">
      {/* Inline Cart Banner */}
      <BannerCarousel page="cart" placement="inline" />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight flex items-center gap-2">
            <i className="ri-shopping-bag-3-fill text-accent" />
            <span>Shopping Cart</span>
          </h1>
          <p className="text-xs text-foreground/60 mt-1">
            Review your selected items, modify quantities, apply discount codes,
            and proceed to checkout.
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
        <CartItemSkeleton count={3} />
      ) : items.length === 0 ? (
        <div className="py-16 text-center bg-surface border border-border-theme rounded-2xl p-8 space-y-4">
          <div className="w-20 h-20 rounded-full bg-accent/10 text-accent flex items-center justify-center text-4xl mx-auto">
            <i className="ri-shopping-cart-2-line" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-extrabold text-foreground">
              Your shopping cart is currently empty
            </h2>
            <p className="text-xs text-foreground/60">
              Discover thousands of amazing products listed across categories.
            </p>
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
            {/* Out of Stock Alert Banner */}
            {items.some((item) => {
              const prod = item.product || {};
              const itemStock = item.variant?.stock ?? prod.stock ?? 0;
              return (
                prod.stockStatus === "outofstock" ||
                (prod.manageStock && itemStock <= 0) ||
                (prod.manageStock && item.quantity > itemStock)
              );
            }) && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-2xl text-xs font-bold flex items-center gap-2">
                <i className="ri-error-warning-line text-lg shrink-0 text-red-500" />
                <span>
                  Some items in your shopping bag are out of stock or exceed
                  available quantity. Please remove or update out-of-stock items
                  before checkout.
                </span>
              </div>
            )}

            {items.map((item, idx) => {
              const prod = item.product || {};
              const price =
                item.variant?.price?.amount ||
                item.variant?.priceAmount ||
                prod.sellingPrice?.amount ||
                prod.maxPrice?.amount ||
                0;
              const img = getCartItemImage(item);
              const itemStock = item.variant?.stock ?? prod.stock ?? 999;

              const isOutOfStock =
                prod.stockStatus === "outofstock" ||
                (prod.manageStock && itemStock <= 0);
              const exceedsStock =
                prod.manageStock && item.quantity > itemStock;

              return (
                <div
                  key={item._id || idx}
                  className={`p-4 sm:p-5 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm transition overflow-hidden border ${
                    isOutOfStock
                      ? "bg-red-500/5 border-red-500/40"
                      : exceedsStock
                        ? "bg-amber-500/5 border-amber-500/40"
                        : "bg-surface border-border-theme hover:border-accent/40"
                  }`}
                >
                  <div className="flex items-center space-x-4 flex-1 min-w-0">
                    <div
                      onClick={() =>
                        navigate(`/product/${prod.slug || prod._id}`)
                      }
                      className="w-16 h-20 bg-background rounded-xl overflow-hidden shrink-0 cursor-pointer border border-border-theme relative"
                    >
                      <img
                        src={img}
                        alt={prod.title}
                        className={`w-full h-full object-cover ${isOutOfStock ? "grayscale opacity-60" : ""}`}
                      />
                      {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center p-0.5 text-center">
                          <span className="text-[8px] font-black text-white uppercase tracking-tighter leading-none">
                            Out of Stock
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-1 flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3
                          onClick={() =>
                            navigate(`/product/${prod.slug || prod._id}`)
                          }
                          className="text-sm font-extrabold text-foreground truncate hover:text-accent cursor-pointer transition"
                        >
                          {prod.title || "Product Item"}
                        </h3>
                        {isOutOfStock ? (
                          <span className="text-[10px] font-extrabold text-red-400 bg-red-500/10 border border-red-500/30 px-2 py-0.5 rounded-md">
                            ⚠️ Sold Out
                          </span>
                        ) : exceedsStock ? (
                          <span className="text-[10px] font-extrabold text-amber-400 bg-amber-500/10 border border-amber-500/30 px-2 py-0.5 rounded-md">
                            ⚠️ Only {itemStock} available
                          </span>
                        ) : null}
                      </div>

                      <p className="text-xs text-foreground/50 font-medium">
                        Category: {prod.category?.name || "General"}
                      </p>
                      <p className="text-sm font-mono font-black text-accent">
                        ₹{Number(price).toLocaleString("en-IN")}
                      </p>

                      {/* Selected Attributes Tag Display (e.g. White | UK6) */}
                      {formatSelectedAttributesTag(item) && (
                        <p className="text-[11px] font-bold text-foreground/70 tracking-wide mt-1 bg-background border border-border-theme/70 px-2 py-0.5 rounded-md inline-block w-fit">
                          {formatSelectedAttributesTag(item)}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity & Controls */}
                  <div className="flex sm:flex-col items-center justify-between sm:justify-end w-full sm:w-auto space-x-4 border-t sm:border-t-0 border-border-theme/40 pt-3 sm:pt-0 gap-2">
                    <div className="flex items-center bg-background border border-border-theme rounded-xl overflow-hidden px-1">
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(
                            item._id,
                            Math.max(1, item.quantity - 1),
                          )
                        }
                        disabled={item.quantity <= 1 || isOutOfStock}
                        className="px-2.5 py-1 text-foreground/70 hover:text-foreground hover:bg-surface font-extrabold text-xs transition disabled:opacity-30 cursor-pointer"
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
                            handleUpdateQuantity(
                              item._id,
                              Math.min(itemStock, val),
                            );
                          }
                        }}
                        className="w-10 text-center bg-transparent text-xs font-extrabold text-foreground font-mono outline-none focus:text-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none disabled:opacity-50"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          handleUpdateQuantity(
                            item._id,
                            Math.min(itemStock, item.quantity + 1),
                          )
                        }
                        disabled={item.quantity >= itemStock || isOutOfStock}
                        className="px-2.5 py-1 text-foreground/70 hover:text-foreground hover:bg-surface font-extrabold text-xs transition disabled:opacity-30 cursor-pointer"
                      >
                        +
                      </button>
                    </div>

                    <div className="flex items-center justify-between gap-2">
                      <div className="text-right">
                        <p className="text-xs font-mono font-extrabold text-foreground">
                          ₹
                          {Number(price * item.quantity).toLocaleString(
                            "en-IN",
                          )}
                        </p>
                      </div>
                      <DeleteBtn
                        onClick={() => handleRemoveFromCart(item._id)}
                      />
                    </div>
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
                <span className="text-xs font-mono font-bold text-accent">
                  {totalItems} Items
                </span>
              </h2>

              {/* Coupon Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold text-foreground/70 flex items-center justify-between">
                  <span className="flex items-center gap-1">
                    <i className="ri-ticket-2-line text-accent" />
                    <span>Promo / Coupon Code</span>
                  </span>
                  {appliedCoupon && (
                    <span className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md uppercase">
                      Applied
                    </span>
                  )}
                </label>

                {appliedCoupon ? (
                  <div className="flex items-center justify-between p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-xs">
                    <div className="flex items-center gap-2 min-w-0">
                      <i className="ri-checkbox-circle-fill text-emerald-500 text-base shrink-0" />
                      <div className="min-w-0">
                        <span className="font-mono font-black text-emerald-500 tracking-wider">
                          {appliedCoupon.code}
                        </span>
                        <p className="text-[10px] text-foreground/60 truncate">
                          {appliedCoupon.message}
                        </p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleRemoveCoupon}
                      className="text-xs text-red-400 hover:text-red-300 font-bold px-2 py-1 cursor-pointer transition shrink-0"
                    >
                      Remove
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <input
                      type="text"
                      value={couponCodeInput}
                      onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                      placeholder="e.g. SCAPE20, MEGASALE"
                      className="flex-1 bg-background border border-border-theme rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground outline-none focus:border-accent uppercase tracking-wider"
                    />
                    <button
                      type="submit"
                      disabled={couponLoading || !couponCodeInput.trim()}
                      className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 active:scale-95 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                    >
                      {couponLoading ? (
                        <i className="ri-loader-4-line animate-spin" />
                      ) : (
                        "Apply"
                      )}
                    </button>
                  </form>
                )}
              </div>

              {/* Price Calculation Breakdown */}
              <div className="space-y-2.5 pt-3 border-t border-border-theme text-xs font-medium">
                <div className="flex items-center justify-between text-foreground/70">
                  <span>Items Subtotal</span>
                  <span className="font-mono font-bold text-foreground">
                    ₹{Number(subtotal).toLocaleString("en-IN")}
                  </span>
                </div>

                {appliedCoupon && discountAmount > 0 && (
                  <div className="flex items-center justify-between text-emerald-500 font-bold">
                    <span className="flex items-center gap-1">
                      <i className="ri-discount-percent-fill" />
                      <span>Coupon Discount ({appliedCoupon.code})</span>
                    </span>
                    <span className="font-mono font-bold">
                      -₹{Number(discountAmount).toLocaleString("en-IN")}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between text-foreground/70">
                  <span>Shipping Charges</span>
                  <span className="font-mono font-bold text-foreground">
                    {shippingFee === 0 ? (
                      <span className="text-emerald-500 uppercase font-black text-[11px]">
                        Free
                      </span>
                    ) : (
                      `₹${shippingFee}`
                    )}
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
                <span className="font-mono text-lg text-accent">
                  ₹{Number(grandTotal).toLocaleString("en-IN")}
                </span>
              </div>

              {(() => {
                const hasOutOfStock = items.some((item) => {
                  const prod = item.product || {};
                  const itemStock = item.variant?.stock ?? prod.stock ?? 0;
                  return (
                    prod.stockStatus === "outofstock" ||
                    (prod.manageStock && itemStock <= 0) ||
                    (prod.manageStock && item.quantity > itemStock)
                  );
                });

                return (
                  <button
                    type="button"
                    disabled={hasOutOfStock}
                    onClick={() => navigate("/checkout")}
                    className={`w-full py-3.5 rounded-xl font-extrabold text-xs shadow-md transition flex items-center justify-center gap-1.5 ${
                      hasOutOfStock
                        ? "bg-foreground/10 text-foreground/40 border border-border-theme cursor-not-allowed"
                        : "bg-accent text-accent-content hover:opacity-90 cursor-pointer"
                    }`}
                  >
                    <span>
                      {hasOutOfStock
                        ? "Unavailable Items in Bag"
                        : "Proceed to Checkout"}
                    </span>
                    <i className="ri-arrow-right-line text-sm" />
                  </button>
                );
              })()}
            </div>

            {/* Sidebar Banner Widget */}
            <BannerCarousel page="cart" placement="sidebar" />
          </div>
        </div>
      )}

      {/* Frequently Bought Together Slider */}
      {fbtProducts && fbtProducts.length > 0 && (
        <div className="pt-6 border-t border-border-theme/40">
          <ProductCarousel
            badge="Co-Purchased"
            title="Frequently Bought Together"
            subtitle="Products commonly purchased by shoppers who bought items in your cart."
            products={fbtProducts}
            onViewAll={() => navigate("/shop")}
          />
        </div>
      )}

      {/* Recently Visited Slider */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <div className="pt-4 border-t border-border-theme/40">
          <ProductCarousel
            badge="Jump Back In"
            title="Recently Visited"
            subtitle="Items you were checking out earlier."
            products={recentlyViewed}
            onViewAll={() => navigate("/shop?filter=recently-viewed")}
          />
        </div>
      )}
    </div>
  );
};

export default CartPage;
