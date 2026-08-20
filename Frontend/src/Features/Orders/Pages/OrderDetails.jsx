import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useParams, useNavigate } from "react-router-dom";
import { useOrders } from "../Hooks/useOrders";
import socket from "../../../utils/socket";

const statusConfig = {
  Processing: {
    color: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    icon: "ri-time-line",
    step: 1,
  },
  Shipped: {
    color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    icon: "ri-truck-line",
    step: 2,
  },
  Delivered: {
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    icon: "ri-checkbox-circle-line",
    step: 3,
  },
  Cancelled: {
    color: "bg-red-500/10 text-red-500 border-red-500/30",
    icon: "ri-close-circle-line",
    step: 0,
  },
};

const STEPS = [
  { label: "Order Placed", icon: "ri-checkbox-circle-line" },
  { label: "Processing", icon: "ri-time-line" },
  { label: "Shipped", icon: "ri-truck-line" },
  { label: "Delivered", icon: "ri-home-smile-line" },
];

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleFetchOrderById, handleCancelOrder, handleReorder } = useOrders();
  const { currentOrder, loading } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const [cancellingOrder, setCancellingOrder] = useState(false);
  const [reorderingOrder, setReorderingOrder] = useState(false);

  useEffect(() => {
    if (id) {
      handleFetchOrderById(id);
    }

    const userId = user?._id || user?.id;
    if (userId) {
      socket.emit("join_room", `user_${userId}`);
    }

    const onStatusUpdate = () => {
      if (id) handleFetchOrderById(id);
    };

    socket.on("order_status_updated", onStatusUpdate);
    socket.on("realtime_update", onStatusUpdate);

    return () => {
      socket.off("order_status_updated", onStatusUpdate);
      socket.off("realtime_update", onStatusUpdate);
    };
  }, [id, user]);

  if (loading || !currentOrder || currentOrder._id !== id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const order = currentOrder;
  const cfg = statusConfig[order.status] || statusConfig.Processing;
  const isBuyer = (user?._id || user?.id) === (order.user?._id || order.user);
  const canCancel = isBuyer && order.status === "Processing";
  const isCancelled = order.status === "Cancelled";

  // Progress step (0-indexed): 0 = placed, 1 = processing, 2 = shipped, 3 = delivered
  const activeStep = isCancelled ? -1 : cfg.step;

  const onCancel = async () => {
    if (!window.confirm("Are you sure you want to cancel this order? Stock will be restored.")) return;
    setCancellingOrder(true);
    try {
      await handleCancelOrder(order._id);
      handleFetchOrderById(id);
    } catch (_) {}
    setCancellingOrder(false);
  };

  const onReorder = async () => {
    setReorderingOrder(true);
    try {
      await handleReorder(order.orderItems);
    } catch (_) {}
    setReorderingOrder(false);
  };

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 md:px-12 max-w-4xl mx-auto font-sans space-y-6">
      {/* Back Button */}
      <button
        onClick={() => navigate("/my-orders")}
        className="flex items-center gap-2 text-xs font-bold text-accent hover:underline cursor-pointer"
      >
        <i className="ri-arrow-left-line text-sm" /> Back to My Orders
      </button>

      <div className="bg-surface border border-border-theme rounded-2xl overflow-hidden shadow-sm">
        {/* ── Header ── */}
        <div className="p-6 sm:p-8 border-b border-border-theme">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                Order Receipt
              </span>
              <h1 className="text-2xl font-mono font-black text-foreground">
                Order #{order.orderId || order._id.slice(-6).toUpperCase()}
              </h1>
              <p className="text-xs font-semibold text-foreground/50">
                Placed on{" "}
                {new Date(order.createdAt).toLocaleString("en-IN", {
                  dateStyle: "medium",
                  timeStyle: "short",
                })}
              </p>
            </div>

            <div className="flex flex-col items-end gap-2">
              <span
                className={`text-[10px] font-black uppercase tracking-wider px-3.5 py-1.5 rounded-full border flex items-center gap-1.5 ${cfg.color}`}
              >
                <i className={`${cfg.icon} text-xs`} />
                {order.status}
              </span>
              <p className="text-xs font-semibold text-foreground/50">
                Payment:{" "}
                <span className="font-bold text-foreground">
                  {order.isPaid ? "Paid ✓" : "Pending (COD)"}
                </span>
              </p>
            </div>
          </div>

          {/* ── Order Progress Timeline ── */}
          {!isCancelled && (
            <div className="mt-6 flex items-center justify-between relative">
              {/* Progress line */}
              <div className="absolute top-4 left-0 right-0 h-0.5 bg-border-theme" />
              <div
                className="absolute top-4 left-0 h-0.5 bg-accent transition-all duration-500"
                style={{ width: `${Math.max(0, (activeStep / (STEPS.length - 1)) * 100)}%` }}
              />

              {STEPS.map((step, idx) => {
                const isCompleted = idx <= activeStep;
                const isCurrent = idx === activeStep;
                return (
                  <div key={idx} className="relative flex flex-col items-center z-10">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm border-2 transition ${
                        isCompleted
                          ? "bg-accent border-accent text-accent-content"
                          : "bg-background border-border-theme text-foreground/40"
                      } ${isCurrent ? "ring-4 ring-accent/20" : ""}`}
                    >
                      <i className={step.icon} />
                    </div>
                    <span
                      className={`text-[10px] font-bold mt-1.5 whitespace-nowrap ${
                        isCompleted ? "text-accent" : "text-foreground/40"
                      }`}
                    >
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {isCancelled && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-500 font-bold flex items-center gap-2">
              <i className="ri-close-circle-fill text-base" />
              This order was cancelled. Stock has been restored.
            </div>
          )}
        </div>

        {/* ── Ordered Items ── */}
        <div className="p-6 sm:p-8 space-y-4 border-b border-border-theme">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
            <i className="ri-shopping-bag-3-line text-accent" /> Purchased Items (
            {order.orderItems?.length})
          </h2>

          <div className="space-y-3">
            {order.orderItems?.map((item, idx) => {
              const prodId = item.product?._id || item.product;
              return (
                <div
                  key={idx}
                  className="flex items-center justify-between gap-4 bg-background/50 p-4 rounded-xl border border-border-theme/30"
                >
                  <div
                    onClick={() => prodId && navigate(`/product/${prodId}`)}
                    className="flex items-center gap-4 min-w-0 cursor-pointer group"
                  >
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-13 h-15 object-cover rounded-lg border border-border-theme shrink-0 group-hover:border-accent transition"
                      />
                    )}
                    <div className="space-y-0.5 min-w-0">
                      <p className="text-xs font-bold text-foreground truncate group-hover:text-accent transition">
                        {item.name}
                      </p>

                      {item.selectedAttributes &&
                        Object.keys(item.selectedAttributes).length > 0 && (
                          <div className="flex gap-1.5 flex-wrap">
                            {Object.entries(item.selectedAttributes).map(([k, v]) => (
                              <span
                                key={k}
                                className="text-[9px] font-bold bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded"
                              >
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}

                      <p className="text-[11px] font-mono text-foreground/60">
                        Qty: <span className="font-bold text-foreground">{item.quantity}</span> × ₹
                        {item.price?.toLocaleString()}
                      </p>
                    </div>
                  </div>

                  <p className="text-sm font-mono font-black text-foreground shrink-0">
                    ₹{(item.price * item.quantity).toLocaleString()}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Shipping + Payment Summary Grid ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0">
          {/* Shipping Address */}
          <div className="p-6 sm:p-8 border-b md:border-b-0 md:border-r border-border-theme space-y-2 text-xs">
            <h3 className="font-black uppercase text-accent tracking-wider flex items-center gap-1.5 text-sm mb-3">
              <i className="ri-map-pin-line" /> Delivery Address
            </h3>
            <p className="font-bold text-foreground">{order.user?.fullname || "Customer"}</p>
            <p className="text-foreground/80">{order.shippingAddress?.street}</p>
            <p className="text-foreground/80">
              {order.shippingAddress?.city}, {order.shippingAddress?.state} -{" "}
              {order.shippingAddress?.pincode}
            </p>
            <p className="text-foreground/80">{order.shippingAddress?.country}</p>
            {order.user?.contact && (
              <p className="text-foreground/60 mt-2 font-mono">Contact: {order.user.contact}</p>
            )}
          </div>

          {/* Payment Summary */}
          <div className="p-6 sm:p-8 space-y-2 text-xs font-semibold">
            <h3 className="font-black uppercase text-accent tracking-wider flex items-center gap-1.5 text-sm mb-3">
              <i className="ri-bill-line" /> Payment Summary
            </h3>
            <div className="flex justify-between text-foreground/80">
              <span>Items Total</span>
              <span className="font-mono font-bold text-foreground">
                ₹{order.itemsPrice?.toLocaleString()}
              </span>
            </div>

            {((order.coupon && order.coupon.code) || order.discountPrice > 0) && (
              <div className="flex justify-between text-emerald-500 font-bold bg-emerald-500/10 px-2.5 py-1.5 rounded-xl border border-emerald-500/20 text-xs">
                <span className="flex items-center gap-1.5">
                  <i className="ri-coupon-3-fill" />
                  <span>Coupon ({order.coupon?.code || "PROMO"})</span>
                </span>
                <span className="font-mono">
                  -₹{(order.coupon?.discountAmount || order.discountPrice || 0).toLocaleString()}
                </span>
              </div>
            )}

            <div className="flex justify-between text-foreground/80">
              <span>Shipping Fee</span>
              <span className="font-mono font-bold text-foreground">
                {order.shippingPrice === 0 ? (
                  <span className="text-emerald-500 font-black">FREE</span>
                ) : (
                  `₹${order.shippingPrice}`
                )}
              </span>
            </div>
            <div className="flex justify-between pt-2 border-t border-border-theme text-sm font-black text-foreground">
              <span>Total ({order.paymentMethod})</span>
              <span className="font-mono text-accent">₹{order.totalPrice?.toLocaleString()}</span>
            </div>
          </div>
        </div>

        {/* ── Action Buttons Footer ── */}
        {isBuyer && (
          <div className="p-5 border-t border-border-theme flex flex-wrap items-center justify-end gap-3">
            {canCancel && (
              <button
                type="button"
                disabled={cancellingOrder}
                onClick={onCancel}
                className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
              >
                {cancellingOrder ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    Cancelling...
                  </>
                ) : (
                  <>
                    <i className="ri-close-circle-line" />
                    Cancel Order
                  </>
                )}
              </button>
            )}

            {order.status === "Shipped" && (
              <span className="text-[11px] font-semibold text-foreground/40 flex items-center gap-1">
                <i className="ri-information-line" /> Cannot cancel — already shipped
              </span>
            )}

            <button
              type="button"
              disabled={reorderingOrder}
              onClick={onReorder}
              className="px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-accent-content text-xs font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
            >
              {reorderingOrder ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                  Adding to Cart...
                </>
              ) : (
                <>
                  <i className="ri-restart-line" />
                  Reorder Items
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
