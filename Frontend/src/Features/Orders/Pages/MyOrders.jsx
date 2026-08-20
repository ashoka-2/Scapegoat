import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useOrders } from "../Hooks/useOrders";
import socket from "../../../utils/socket";
import BannerCarousel from "../../Home/Components/BannerCarousel";

const statusConfig = {
  Processing: {
    color: "bg-amber-500/10 text-amber-500 border-amber-500/30",
    icon: "ri-time-line",
  },
  Shipped: {
    color: "bg-blue-500/10 text-blue-500 border-blue-500/30",
    icon: "ri-truck-line",
  },
  Delivered: {
    color: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
    icon: "ri-checkbox-circle-line",
  },
  Cancelled: {
    color: "bg-red-500/10 text-red-500 border-red-500/30",
    icon: "ri-close-circle-line",
  },
};

const MyOrders = () => {
  const navigate = useNavigate();
  const { handleFetchMyOrders, handleCancelOrder, handleReorder } = useOrders();
  const { myOrders, loading } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);
  const [expandedOrders, setExpandedOrders] = useState({});
  const [cancellingId, setCancellingId] = useState(null);
  const [reorderingId, setReorderingId] = useState(null);

  useEffect(() => {
    handleFetchMyOrders();

    const userId = user?._id || user?.id;
    if (userId) {
      socket.emit("join_room", `user_${userId}`);
    }

    const onStatusUpdate = () => {
      handleFetchMyOrders();
    };

    socket.on("order_status_updated", onStatusUpdate);
    socket.on("realtime_update", onStatusUpdate);

    return () => {
      socket.off("order_status_updated", onStatusUpdate);
      socket.off("realtime_update", onStatusUpdate);
    };
  }, [user]);

  const toggleExpand = (e, orderId) => {
    e.stopPropagation();
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const onCancelOrder = async (e, orderId) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to cancel this entire order? This action cannot be undone.")) return;
    setCancellingId(orderId);
    try {
      await handleCancelOrder(orderId);
      handleFetchMyOrders();
    } catch (_) {}
    setCancellingId(null);
  };

  const onReorder = async (e, order) => {
    e.stopPropagation();
    setReorderingId(order._id);
    try {
      await handleReorder(order.orderItems);
    } catch (_) {}
    setReorderingId(null);
  };

  if (loading && (!myOrders || myOrders.length === 0)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!loading && myOrders.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4 space-y-4 font-sans">
        <i className="ri-inbox-archive-line text-6xl text-foreground/30" />
        <h1 className="text-2xl font-black uppercase text-foreground">No orders yet</h1>
        <p className="text-xs text-foreground/50 max-w-sm">
          You haven't placed any orders with ScapeGoat yet. Start exploring our latest collections!
        </p>
        <button
          onClick={() => navigate("/shop")}
          className="px-6 py-3 bg-accent text-accent-content font-extrabold text-xs uppercase tracking-wider rounded-full hover:opacity-90 transition cursor-pointer"
        >
          Browse Catalog
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-10 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto font-sans space-y-8">
      {/* Hero & Inline Orders Banners */}
      <BannerCarousel page="my-orders" placement="hero" />
      <BannerCarousel page="my-orders" placement="inline" />

      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight text-foreground">
          My Orders
        </h1>
        <p className="text-xs font-bold tracking-wider uppercase text-foreground/60">
          {myOrders.length} order{myOrders.length !== 1 ? "s" : ""} placed
        </p>
      </div>

      <div className="space-y-5">
        {myOrders.map((order) => {
          const isExpanded = expandedOrders[order._id] !== false;
          const cfg = statusConfig[order.status] || statusConfig.Processing;
          const canCancel = order.status === "Processing";
          const isCancelling = cancellingId === order._id;
          const isReordering = reorderingId === order._id;

          return (
            <div
              key={order._id}
              className="bg-surface border border-border-theme rounded-2xl overflow-hidden shadow-sm hover:border-accent/40 transition group"
            >
              {/* Header — clickable to navigate to order details */}
              <div
                onClick={() => navigate(`/orders/${order._id}`)}
                className="p-5 cursor-pointer"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-foreground/50">
                        Order
                      </span>
                      <span className="text-sm font-mono font-black text-accent">
                        #{order.orderId || order._id.slice(-6).toUpperCase()}
                      </span>
                      {order.coupon?.code && (
                        <span className="text-[10px] font-mono font-black text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20 flex items-center gap-1">
                          <i className="ri-coupon-3-fill text-xs" /> {order.coupon.code}
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] font-semibold text-foreground/50">
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                      {" · "}
                      {order.orderItems?.length} item{order.orderItems?.length !== 1 ? "s" : ""}
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border flex items-center gap-1.5 ${cfg.color}`}
                    >
                      <i className={`${cfg.icon} text-xs`} />
                      {order.status}
                    </span>

                    <button
                      type="button"
                      onClick={(e) => toggleExpand(e, order._id)}
                      className="p-2 rounded-xl bg-background border border-border-theme/60 hover:border-accent text-foreground/70 hover:text-accent cursor-pointer transition"
                    >
                      <i
                        className={`text-sm transition-transform duration-200 ${
                          isExpanded ? "ri-chevron-up-line" : "ri-chevron-down-line"
                        }`}
                      />
                    </button>

                    <i className="ri-arrow-right-s-line text-lg text-foreground/30 group-hover:text-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </div>
              </div>

              {/* Expandable Items Section */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="px-5 pb-2 space-y-2">
                      {order.orderItems?.map((item, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-3 bg-background/50 p-3 rounded-xl border border-border-theme/30"
                        >
                          {item.image && (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-11 h-13 object-cover rounded-lg border border-border-theme shrink-0"
                            />
                          )}
                          <div className="flex-1 min-w-0 text-xs">
                            <p className="font-bold text-foreground truncate">{item.name}</p>

                            {item.selectedAttributes &&
                              Object.keys(item.selectedAttributes).length > 0 && (
                                <div className="flex gap-1 flex-wrap mt-0.5">
                                  {Object.entries(item.selectedAttributes).map(([k, v]) => (
                                    <span
                                      key={k}
                                      className="text-[9px] font-bold text-accent bg-accent/10 px-1.5 py-0.5 rounded"
                                    >
                                      {k}: {String(v)}
                                    </span>
                                  ))}
                                </div>
                              )}

                            <p className="text-[11px] text-foreground/60 mt-0.5">
                              Qty: {item.quantity} × ₹{item.price?.toLocaleString()}
                            </p>
                          </div>
                          <p className="text-xs font-mono font-black text-foreground shrink-0">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Footer — Price + Action Buttons */}
              <div className="px-5 py-3 border-t border-border-theme/40 flex flex-wrap items-center justify-between gap-3">
                <div className="text-xs text-foreground/70">
                  <span className="font-semibold">Payment: </span>
                  <span className="font-mono font-black text-foreground uppercase">
                    {order.paymentMethod}
                  </span>
                  <span className="ml-3 font-mono font-black text-sm text-accent">
                    ₹{order.totalPrice?.toLocaleString()}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {/* Cancel Button — only when Processing */}
                  {canCancel && (
                    <button
                      type="button"
                      disabled={isCancelling}
                      onClick={(e) => onCancelOrder(e, order._id)}
                      className="px-3.5 py-1.5 rounded-lg bg-red-500/10 text-red-500 border border-red-500/20 hover:bg-red-500 hover:text-white text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                    >
                      {isCancelling ? (
                        <>
                          <div className="w-3 h-3 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
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

                  {/* Non-cancellable status hint */}
                  {order.status === "Shipped" && (
                    <span className="text-[10px] font-semibold text-foreground/40 flex items-center gap-1">
                      <i className="ri-information-line" /> Cannot cancel — already shipped
                    </span>
                  )}

                  {/* Reorder Button */}
                  <button
                    type="button"
                    disabled={isReordering}
                    onClick={(e) => onReorder(e, order)}
                    className="px-3.5 py-1.5 rounded-lg bg-accent/10 text-accent border border-accent/20 hover:bg-accent hover:text-accent-content text-[11px] font-bold transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  >
                    {isReordering ? (
                      <>
                        <div className="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <i className="ri-restart-line" />
                        Reorder
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MyOrders;
