import React, { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../Cart/Hooks/useCart";
import { useOrders } from "../Hooks/useOrders";
import CheckoutSkeleton from "../Components/Skeletons/CheckoutSkeleton";
import BannerCarousel from "../../Home/Components/BannerCarousel";
import { InputField, SelectField, RadioCard } from "../../../Shared/FormFields";
import customAxios from "../../../utils/axios";
import { addToast } from "../../../utils/toast.slice";

const INDIAN_STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu",
  "Telangana", "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal",
  "Delhi", "Jammu and Kashmir", "Ladakh", "Puducherry"
];

const PAYMENT_METHODS = [
  {
    id: "Razorpay",
    label: "Razorpay / Online Payment",
    icon: "ri-qr-code-line",
    subtitle: "UPI, Cards, NetBanking, Wallets",
    disabled: false,
  },
  {
    id: "COD",
    label: "Cash on Delivery",
    icon: "ri-hand-coin-line",
    subtitle: "Pay with cash upon delivery",
    disabled: true,
    badge: "Coming Soon",
  },
];

const Checkout = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { cart, items, totalItems, subtotal, loading: cartLoading, handleGetCart } = useCart();
  const { user } = useSelector((state) => state.auth);
  const { handleCreateOrder, handleRazorpayCheckout } = useOrders();

  const userId = user?._id || user?.id;

  const [address, setAddress] = useState({
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "Maharashtra",
    country: "India",
    pincode: user?.address?.pincode || "",
  });

  const [pincodeError, setPincodeError] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Razorpay");
  const [placing, setPlacing] = useState(false);

  // Coupon state
  const [couponCodeInput, setCouponCodeInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);

  useEffect(() => {
    if (userId && !cart) {
      handleGetCart();
    }
  }, [userId]);

  const cartItems = items || cart?.items || [];

  const handleApplyCoupon = async (e) => {
    e?.preventDefault();
    if (!couponCodeInput.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await customAxios.post("/api/coupons/validate", {
        code: couponCodeInput.trim(),
        cartItems,
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
  const shippingPrice = subtotal > 1999 ? 0 : 99;
  const grandTotal = Math.max(0, subtotal - discountAmount + shippingPrice);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === "pincode") {
      // Numbers only, max 6 digits
      const cleaned = value.replace(/\D/g, "").slice(0, 6);
      setAddress((prev) => ({ ...prev, pincode: cleaned }));
      if (cleaned.length > 0 && cleaned.length !== 6) {
        setPincodeError("Pincode must be 6 digits");
      } else {
        setPincodeError("");
      }
      return;
    }
    setAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cartItems.length === 0) return;

    if (address.pincode.length !== 6) {
      setPincodeError("Pincode must be exactly 6 digits");
      return;
    }

    setPlacing(true);
    try {
      const res = paymentMethod === "Razorpay"
        ? await handleRazorpayCheckout({ shippingAddress: address, user, couponCode: appliedCoupon?.code })
        : await handleCreateOrder({ shippingAddress: address, paymentMethod, couponCode: appliedCoupon?.code });
      if (res?.order?._id) {
        navigate(`/orders/${res.order._id}`);
      } else {
        navigate("/my-orders");
      }
    } catch {
    } finally {
      setPlacing(false);
    }
  };

  // Show Skeleton while cart object is not fetched yet OR cart is loading
  if (cart === null || cartLoading) {
    return <CheckoutSkeleton />;
  }

  // Once cart is loaded, if items array is truly empty, show empty state
  if (cartItems.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-4 font-sans">
        <i className="ri-shopping-bag-line text-6xl text-foreground/30" />
        <h1 className="text-2xl font-black uppercase text-foreground">Your bag is empty</h1>
        <p className="text-xs text-foreground/50 max-w-sm">
          Add items to your shopping bag before proceeding to checkout.
        </p>
        <button
          onClick={() => navigate("/shop")}
          className="px-6 py-3 bg-accent text-accent-content font-extrabold text-xs uppercase tracking-wider rounded-full hover:opacity-90 transition cursor-pointer"
        >
          Explore Shop
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 md:px-12 max-w-6xl mx-auto font-sans">
      {/* Inline Checkout Banner */}
      <BannerCarousel page="checkout" placement="inline" />

      <div className="text-center mb-10 space-y-2">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
          Express Checkout
        </h1>
        <p className="text-xs md:text-sm font-bold tracking-wider uppercase text-foreground/60">
          Complete your order details below
        </p>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 7 Columns: Shipping Address & Payment Selection */}
        <div className="lg:col-span-7 space-y-6">
          {/* Shipping Address Box */}
          <div className="bg-surface border border-border-theme p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
            <h2 className="text-lg font-black uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border-theme pb-3">
              <i className="ri-map-pin-2-line text-accent text-xl" />
              <span>Shipping Address</span>
            </h2>

            <div className="space-y-4">
              <InputField
                required
                label="Street Address"
                name="street"
                value={address.street}
                onChange={handleChange}
                placeholder="House/Flat No., Building, Street Name"
                icon="ri-home-4-line"
              />

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  required
                  label="City"
                  name="city"
                  value={address.city}
                  onChange={handleChange}
                  placeholder="Mumbai"
                  icon="ri-building-line"
                />
                <SelectField
                  required
                  label="State"
                  name="state"
                  value={address.state}
                  onChange={handleChange}
                  options={INDIAN_STATES}
                  placeholder="Select State"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  required
                  type="text"
                  label="Pincode / Postal Code (6 Digits)"
                  name="pincode"
                  value={address.pincode}
                  onChange={handleChange}
                  placeholder="400001"
                  icon="ri-map-pin-line"
                  error={pincodeError}
                />
                <InputField
                  readOnly
                  label="Country"
                  name="country"
                  value={address.country}
                  icon="ri-global-line"
                />
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-surface border border-border-theme p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
            <h2 className="text-lg font-black uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border-theme pb-3">
              <i className="ri-bank-card-line text-accent text-xl" />
              <span>Payment Option</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {PAYMENT_METHODS.map((pm) => (
                <RadioCard
                  key={pm.id}
                  id={pm.id}
                  selectedId={paymentMethod}
                  onSelect={setPaymentMethod}
                  label={pm.label}
                  subtitle={pm.subtitle}
                  icon={pm.icon}
                  disabled={pm.disabled}
                  badge={pm.badge}
                />
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Order Summary Card & Sidebar Banner */}
        <div className="lg:col-span-5 space-y-6 sticky top-24">
          <div className="bg-surface border border-border-theme p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl">
            <h2 className="text-lg font-black uppercase tracking-wider text-foreground border-b border-border-theme pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-mono font-bold bg-accent/10 text-accent px-2.5 py-0.5 rounded-full border border-accent/20">
                {totalItems} items
              </span>
            </h2>

            {/* Items List Snapshot */}
            <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin pr-1">
              {cartItems.map((item, idx) => {
                const prod = item.product || {};
                const price =
                  item.variant?.price?.amount ||
                  item.variant?.priceAmount ||
                  prod.sellingPrice?.amount ||
                  prod.maxPrice?.amount ||
                  0;
                const imgUrl =
                  prod.images?.[0]?.url ||
                  (typeof prod.images?.[0] === "string" ? prod.images[0] : "") ||
                  "";

                return (
                  <div key={idx} className="flex items-center gap-3 bg-background/50 p-2.5 rounded-2xl border border-border-theme/40">
                    <img
                      src={imgUrl}
                      alt={prod.title}
                      className="w-12 h-14 object-cover rounded-xl border border-border-theme shrink-0"
                    />
                    <div className="flex-1 min-w-0 text-xs">
                      <p className="font-bold text-foreground truncate">{prod.title}</p>
                      <p className="text-[11px] text-foreground/60">Qty: {item.quantity}</p>
                    </div>
                    <p className="text-xs font-black font-mono text-foreground shrink-0">
                      ₹{(price * item.quantity).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Coupon Code Section */}
            <div className="space-y-2 pt-3 border-t border-border-theme">
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
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCodeInput}
                    onChange={(e) => setCouponCodeInput(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g. SCAPE20)"
                    className="flex-1 bg-background border border-border-theme rounded-xl px-3 py-2 text-xs font-mono font-bold text-foreground outline-none focus:border-accent uppercase tracking-wider"
                  />
                  <button
                    type="button"
                    onClick={handleApplyCoupon}
                    disabled={couponLoading || !couponCodeInput.trim()}
                    className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 active:scale-95 transition cursor-pointer disabled:opacity-50 flex items-center gap-1"
                  >
                    {couponLoading ? (
                      <i className="ri-loader-4-line animate-spin" />
                    ) : (
                      "Apply"
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Price Calculations Breakdown */}
            <div className="space-y-2.5 pt-4 border-t border-border-theme text-xs font-semibold text-foreground/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-foreground">₹{subtotal.toLocaleString()}</span>
              </div>

              {appliedCoupon && discountAmount > 0 && (
                <div className="flex justify-between text-emerald-500 font-bold">
                  <span className="flex items-center gap-1">
                    <i className="ri-discount-percent-fill" />
                    <span>Coupon Discount ({appliedCoupon.code})</span>
                  </span>
                  <span className="font-mono font-bold">
                    -₹{Number(discountAmount).toLocaleString("en-IN")}
                  </span>
                </div>
              )}

              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-mono font-bold text-foreground">
                  {shippingPrice === 0 ? <span className="text-emerald-500 font-black">FREE</span> : `₹${shippingPrice}`}
                </span>
              </div>

              <div className="flex justify-between pt-3 border-t border-border-theme text-base font-black text-foreground">
                <span>Grand Total</span>
                <span className="font-mono text-accent">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={placing || pincodeError}
              className="w-full py-4 bg-accent text-accent-content font-black tracking-widest uppercase rounded-2xl hover:opacity-90 active:scale-95 transition-all shadow-xl disabled:opacity-60 flex items-center justify-center gap-2 cursor-pointer text-xs"
            >
              {placing ? (
                <>
                  <i className="ri-loader-4-line animate-spin text-base" /> Placing Order...
                </>
              ) : (
                <>
                  <i className="ri-shield-check-line text-base" /> Place Order Now
                </>
              )}
            </button>
          </div>

          {/* Checkout Sidebar Banner */}
          <BannerCarousel page="checkout" placement="sidebar" />
        </div>
      </form>
    </div>
  );
};

export default Checkout;
