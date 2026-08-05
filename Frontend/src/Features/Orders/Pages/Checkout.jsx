import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useCart } from "../../Cart/Hooks/useCart";
import { useOrders } from "../Hooks/useOrders";
import CheckoutSkeleton from "../Components/Skeletons/CheckoutSkeleton";

const Checkout = () => {
  const navigate = useNavigate();
  const { cart, items, totalItems, subtotal, loading: cartLoading, handleGetCart } = useCart();
  const { user } = useSelector((state) => state.auth);
  const { handleCreateOrder } = useOrders();

  const [address, setAddress] = useState({
    street: user?.address?.street || "",
    city: user?.address?.city || "",
    state: user?.address?.state || "",
    country: "India",
    pincode: user?.address?.pincode || "",
  });

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [placing, setPlacing] = useState(false);

  useEffect(() => {
    if (!cart) {
      handleGetCart();
    }
  }, []);

  const shippingPrice = subtotal > 1999 ? 0 : 99;
  const taxPrice = Math.round(subtotal * 0.18);
  const grandTotal = subtotal + shippingPrice + taxPrice;

  const handleChange = (e) => {
    setAddress({ ...address, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (items.length === 0) return;

    setPlacing(true);
    try {
      const res = await handleCreateOrder({
        shippingAddress: address,
        paymentMethod,
      });
      if (res?.order?._id) {
        navigate(`/orders/${res.order._id}`);
      } else {
        navigate("/my-orders");
      }
    } catch (_) {
    } finally {
      setPlacing(false);
    }
  };

  if (cartLoading && (!items || items.length === 0)) {
    return <CheckoutSkeleton />;
  }

  if (!cartLoading && (!items || items.length === 0)) {
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

            <div className="space-y-4 text-xs font-semibold">
              <div>
                <label className="block text-[11px] font-extrabold uppercase text-foreground/60 mb-1">
                  Street Address
                </label>
                <input
                  required
                  type="text"
                  name="street"
                  value={address.street}
                  onChange={handleChange}
                  placeholder="House/Flat No., Building, Street Name"
                  className="w-full bg-background border border-border-theme rounded-xl px-4 py-3 text-xs font-medium text-foreground outline-none focus:border-accent"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-foreground/60 mb-1">
                    City
                  </label>
                  <input
                    required
                    type="text"
                    name="city"
                    value={address.city}
                    onChange={handleChange}
                    placeholder="Mumbai"
                    className="w-full bg-background border border-border-theme rounded-xl px-4 py-3 text-xs font-medium text-foreground outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-foreground/60 mb-1">
                    State
                  </label>
                  <input
                    required
                    type="text"
                    name="state"
                    value={address.state}
                    onChange={handleChange}
                    placeholder="Maharashtra"
                    className="w-full bg-background border border-border-theme rounded-xl px-4 py-3 text-xs font-medium text-foreground outline-none focus:border-accent"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-foreground/60 mb-1">
                    Pincode / Postal Code
                  </label>
                  <input
                    required
                    type="text"
                    name="pincode"
                    value={address.pincode}
                    onChange={handleChange}
                    placeholder="400001"
                    className="w-full bg-background border border-border-theme rounded-xl px-4 py-3 text-xs font-medium text-foreground outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-extrabold uppercase text-foreground/60 mb-1">
                    Country
                  </label>
                  <input
                    readOnly
                    type="text"
                    name="country"
                    value={address.country}
                    className="w-full bg-background/50 border border-border-theme rounded-xl px-4 py-3 text-xs font-medium text-foreground/70 outline-none cursor-not-allowed"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Payment Method Selection */}
          <div className="bg-surface border border-border-theme p-6 sm:p-8 rounded-3xl space-y-4 shadow-xl">
            <h2 className="text-lg font-black uppercase tracking-wider text-foreground flex items-center gap-2 border-b border-border-theme pb-3">
              <i className="ri-bank-card-line text-accent text-xl" />
              <span>Payment Option</span>
            </h2>

            <div className="grid grid-cols-2 gap-3 text-xs font-bold">
              {[
                { id: "COD", label: "Cash on Delivery", icon: "ri-hand-coin-line" },
                { id: "UPI", label: "Instant UPI", icon: "ri-qr-code-line" },
                { id: "Card", label: "Credit / Debit Card", icon: "ri-bank-card-2-line" },
                { id: "NetBanking", label: "Net Banking", icon: "ri-bank-line" },
              ].map((pm) => (
                <button
                  key={pm.id}
                  type="button"
                  onClick={() => setPaymentMethod(pm.id)}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-2 cursor-pointer transition ${
                    paymentMethod === pm.id
                      ? "border-accent bg-accent/10 text-foreground"
                      : "border-border-theme bg-background hover:border-accent/40 text-foreground/70"
                  }`}
                >
                  <i className={`${pm.icon} text-xl text-accent`} />
                  <span>{pm.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Order Summary Card */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface border border-border-theme p-6 sm:p-8 rounded-3xl space-y-6 shadow-xl sticky top-24">
            <h2 className="text-lg font-black uppercase tracking-wider text-foreground border-b border-border-theme pb-3 flex items-center justify-between">
              <span>Order Summary</span>
              <span className="text-xs font-mono font-bold bg-accent/10 text-accent px-2.5 py-0.5 rounded-full border border-accent/20">
                {totalItems} items
              </span>
            </h2>

            {/* Items List Snapshot */}
            <div className="space-y-3 max-h-60 overflow-y-auto scrollbar-thin pr-1">
              {items.map((item, idx) => {
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

            {/* Price Calculations Breakdown */}
            <div className="space-y-2.5 pt-4 border-t border-border-theme text-xs font-semibold text-foreground/80">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span className="font-mono font-bold text-foreground">₹{subtotal.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Shipping Fee</span>
                <span className="font-mono font-bold text-foreground">
                  {shippingPrice === 0 ? <span className="text-emerald-500 font-black">FREE</span> : `₹${shippingPrice}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Estimated GST (18%)</span>
                <span className="font-mono font-bold text-foreground">₹{taxPrice.toLocaleString()}</span>
              </div>

              <div className="flex justify-between pt-3 border-t border-border-theme text-base font-black text-foreground">
                <span>Grand Total</span>
                <span className="font-mono text-accent">₹{grandTotal.toLocaleString()}</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={placing}
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
        </div>
      </form>
    </div>
  );
};

export default Checkout;
