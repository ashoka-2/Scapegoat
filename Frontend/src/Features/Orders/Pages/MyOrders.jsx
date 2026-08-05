import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../Hooks/useOrders";
import socket from "../../../utils/socket";

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

const MyOrders = () => {
  const navigate = useNavigate();
  const { handleFetchMyOrders } = useOrders();
  const { myOrders, loading } = useSelector((state) => state.orders);
  const { user } = useSelector((state) => state.auth);

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

  if (loading && (!myOrders || myOrders.length === 0)) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center animate-pulse text-xl font-bold tracking-[0.5em] uppercase text-foreground/50">
        Loading Orders...
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
    <div className="min-h-screen py-12 px-4 sm:px-6 md:px-12 max-w-5xl mx-auto font-sans space-y-8">
      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tight text-foreground">
          My Orders
        </h1>
        <p className="text-xs md:text-sm font-bold tracking-wider uppercase text-foreground/60">
          Track and manage your order history
        </p>
      </div>

      <div className="space-y-6">
        {myOrders.map((order) => (
          <div
            key={order._id}
            onClick={() => navigate(`/orders/${order._id}`)}
            className="bg-surface border border-border-theme p-6 rounded-3xl space-y-4 shadow-xl hover:border-accent/40 transition cursor-pointer group"
          >
            {/* Header row: Order ID, Date & Status */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-theme pb-4">
              <div className="space-y-1">
                <p className="text-xs font-mono font-bold text-foreground/50">
                  Order ID:{" "}
                  <span className="text-accent font-black">
                    #{order.orderId || order._id.slice(-6).toUpperCase()}
                  </span>
                </p>
                <p className="text-[11px] font-semibold text-foreground/60">
                  Placed on {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                <span className={`text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border ${statusBadgeColor(order.status)}`}>
                  {order.status}
                </span>
                <i className="ri-arrow-right-s-line text-lg text-foreground/40 group-hover:text-accent group-hover:translate-x-1 transition-transform" />
              </div>
            </div>

            {/* Items Thumbnails */}
            <div className="flex items-center gap-3 overflow-x-auto scrollbar-none py-1">
              {order.orderItems?.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3 bg-background/50 p-2 rounded-2xl border border-border-theme/40 shrink-0">
                  {item.image && (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-12 h-14 object-cover rounded-xl border border-border-theme"
                    />
                  )}
                  <div className="text-xs space-y-0.5">
                    <p className="font-bold text-foreground max-w-[160px] truncate">{item.name}</p>

                    {item.selectedAttributes && Object.keys(item.selectedAttributes).length > 0 && (
                      <div className="flex gap-1 flex-wrap">
                        {Object.entries(item.selectedAttributes).map(([k, v]) => (
                          <span key={k} className="text-[9px] font-bold text-accent">
                            {k}: {String(v)}
                          </span>
                        ))}
                      </div>
                    )}

                    <p className="text-[11px] text-foreground/60">
                      Qty: {item.quantity} × ₹{item.price}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Footer row: Total Price */}
            <div className="flex items-center justify-between pt-2 border-t border-border-theme/40 text-xs">
              <span className="font-bold text-foreground/70">
                Payment: <span className="text-foreground uppercase font-mono font-black">{order.paymentMethod}</span>
              </span>
              <span className="font-black text-sm text-foreground font-mono">
                Total: <span className="text-accent">₹{order.totalPrice?.toLocaleString()}</span>
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyOrders;
