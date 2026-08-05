import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useOrders } from "../Hooks/useOrders";

const statusBadgeColor = (status) => {
  switch (status) {
    case "Processing":
      return "bg-amber-500/10 text-amber-500 border-amber-500/30";
    case "Shipped":
      return "bg-blue-500/10 text-blue-500 border-blue-500/30";
    case "Delivered":
      return "bg-emerald-500/10 text-emerald-500 border-emerald-500/30";
    case "Cancelled":
      return "bg-red-500/10 text-red-500 border-red-500/30";
    default:
      return "bg-accent/10 text-accent border-accent/20";
  }
};

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleFetchOrderById } = useOrders();
  const { currentOrder, loading } = useSelector((state) => state.orders);

  useEffect(() => {
    if (id) {
      handleFetchOrderById(id);
    }
  }, [id]);

  if (loading || !currentOrder || currentOrder._id !== id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-pulse text-xl font-bold tracking-[0.5em] uppercase text-foreground/50">
        Loading Order Receipt...
      </div>
    );
  }

  const order = currentOrder;

  return (
    <div className="min-h-screen py-12 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto font-sans space-y-8">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-xs font-bold text-accent hover:underline cursor-pointer"
      >
        <i className="ri-arrow-left-line text-sm" /> Back to Orders
      </button>

      <div className="bg-surface border border-border-theme p-6 sm:p-10 rounded-3xl space-y-8 shadow-xl">
        {/* Header: Receipt Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-theme pb-6">
          <div className="space-y-1">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Order Receipt</span>
            <h1 className="text-2xl font-mono font-black text-foreground">
              Order #{order._id.toUpperCase()}
            </h1>
            <p className="text-xs font-semibold text-foreground/60">
              Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
            </p>
          </div>

          <div className="text-right space-y-2">
            <span className={`inline-block text-xs font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border ${statusBadgeColor(order.status)}`}>
              {order.status}
            </span>
            <p className="text-xs font-semibold text-foreground/60">
              Payment Status: <span className="font-bold text-foreground">{order.isPaid ? "Paid ✓" : "Pending (COD)"}</span>
            </p>
          </div>
        </div>

        {/* Ordered Items List */}
        <div className="space-y-4">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
            <i className="ri-shopping-bag-3-line text-accent" /> Purchased Items ({order.orderItems?.length})
          </h2>

          <div className="space-y-3">
            {order.orderItems?.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between gap-4 bg-background/50 p-4 rounded-2xl border border-border-theme/40">
                <div className="flex items-center gap-4 min-w-0">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-14 h-16 object-cover rounded-xl border border-border-theme shrink-0"
                    />
                  )}
                  <div className="space-y-1 min-w-0">
                    <p className="text-xs font-bold text-foreground truncate">{item.name}</p>
                    <p className="text-[11px] font-mono text-foreground/60">
                      Quantity: <span className="font-bold text-foreground">{item.quantity}</span> × ₹{item.price?.toLocaleString()}
                    </p>
                  </div>
                </div>

                <p className="text-sm font-mono font-black text-foreground shrink-0">
                  ₹{(item.price * item.quantity).toLocaleString()}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Grid Split: Shipping Address & Cost Summary */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border-theme">
          {/* Shipping Address Box */}
          <div className="bg-background/40 border border-border-theme/40 p-5 rounded-2xl space-y-2 text-xs">
            <h3 className="font-black uppercase text-accent tracking-wider flex items-center gap-1.5 mb-2">
              <i className="ri-map-pin-line text-sm" /> Delivery Address
            </h3>
            <p className="font-bold text-foreground">{order.user?.fullname || "Customer"}</p>
            <p className="text-foreground/80">{order.shippingAddress?.street}</p>
            <p className="text-foreground/80">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
            </p>
            <p className="text-foreground/80">{order.shippingAddress?.country}</p>
            {order.user?.contact && <p className="text-foreground/60 mt-2 font-mono">Contact: {order.user.contact}</p>}
          </div>

          {/* Cost Summary Breakdown */}
          <div className="bg-background/40 border border-border-theme/40 p-5 rounded-2xl space-y-2 text-xs font-semibold">
            <h3 className="font-black uppercase text-accent tracking-wider flex items-center gap-1.5 mb-2">
              <i className="ri-bill-line text-sm" /> Payment Summary
            </h3>
            <div className="flex justify-between text-foreground/80">
              <span>Items Total</span>
              <span className="font-mono font-bold text-foreground">₹{order.itemsPrice?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between text-foreground/80">
              <span>Shipping Fee</span>
              <span className="font-mono font-bold text-foreground">
                {order.shippingPrice === 0 ? <span className="text-emerald-500 font-black">FREE</span> : `₹${order.shippingPrice}`}
              </span>
            </div>
            <div className="flex justify-between text-foreground/80">
              <span>GST Tax</span>
              <span className="font-mono font-bold text-foreground">₹{order.taxPrice?.toLocaleString()}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border-theme text-sm font-black text-foreground">
              <span>Total Paid ({order.paymentMethod})</span>
              <span className="font-mono text-accent">₹{order.totalPrice?.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetails;
