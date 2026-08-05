import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../../Orders/Hooks/useOrders";
import SellerTableSkeleton from "../Components/Skeletons/SellerTableSkeleton";

const STATUS_COLORS = {
  Processing: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  Shipped: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  Delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  Cancelled: "bg-red-500/10 text-red-500 border-red-500/30",
};

const SellerOrders = () => {
  const navigate = useNavigate();
  const { handleFetchSellerOrders, handleUpdateStatus } = useOrders();
  const { sellerOrders, loading } = useSelector((state) => state.orders);
  const [filterStatus, setFilterStatus] = useState("All");
  const [expandedOrders, setExpandedOrders] = useState({});

  useEffect(() => {
    handleFetchSellerOrders();
  }, []);

  const toggleExpand = (orderId) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  const filteredOrders =
    filterStatus === "All"
      ? sellerOrders
      : sellerOrders.filter((o) => o.status === filterStatus);

  if (loading && (!sellerOrders || sellerOrders.length === 0)) {
    return <SellerTableSkeleton />;
  }

  return (
    <div className="space-y-6 font-sans">
      {/* Header & Status Filter */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border-theme p-6 rounded-3xl shadow-lg">
        <div>
          <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
            Customer Orders
          </h1>
          <p className="text-xs text-foreground/60">
            Real-time fulfillment station for your store purchases
          </p>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none py-1 text-xs font-bold">
          {["All", "Processing", "Shipped", "Delivered", "Cancelled"].map((st) => (
            <button
              key={st}
              onClick={() => setFilterStatus(st)}
              className={`px-3.5 py-1.5 rounded-full border transition cursor-pointer ${
                filterStatus === st
                  ? "bg-accent text-accent-content border-accent"
                  : "bg-background border-border-theme text-foreground/70 hover:border-accent/40"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Orders List / Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-surface border border-border-theme p-12 rounded-3xl text-center space-y-3">
          <i className="ri-inbox-archive-line text-5xl text-foreground/30" />
          <h2 className="text-lg font-black uppercase text-foreground">No orders found</h2>
          <p className="text-xs text-foreground/50">
            {filterStatus === "All"
              ? "You haven't received any customer orders yet."
              : `No orders with status "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredOrders.map((order) => {
            const isExpanded = expandedOrders[order._id] !== false; // Default expanded

            return (
              <div
                key={order._id}
                className="bg-surface border border-border-theme p-6 rounded-3xl space-y-5 shadow-lg transition-all"
              >
                {/* Top Row: Order ID, Date, Buyer & Status Control */}
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border-theme pb-4">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-black text-accent">
                        #{order.orderId || order._id.slice(-6).toUpperCase()}
                      </span>
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          STATUS_COLORS[order.status] || "bg-accent/10 text-accent border-accent/20"
                        }`}
                      >
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[11px] font-semibold text-foreground/60">
                      Buyer:{" "}
                      <button
                        onClick={() => order.user?._id && navigate(`/seller/users/${order.user._id}`)}
                        className="font-bold text-foreground hover:text-accent underline transition cursor-pointer"
                      >
                        {order.user?.fullname || "Customer"}
                      </button>{" "}
                      ({order.user?.email}) • Placed{" "}
                      {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  {/* Right side: Status dropdown & Collapse Toggle */}
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <label className="text-[11px] font-black uppercase text-foreground/60">
                        Status:
                      </label>
                      <select
                        value={order.status}
                        onChange={(e) => handleUpdateStatus(order._id, e.target.value)}
                        className="bg-background border border-border-theme rounded-xl px-3 py-1.5 text-xs font-bold text-foreground outline-none focus:border-accent cursor-pointer"
                      >
                        <option value="Processing">Processing</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                      </select>
                    </div>

                    <button
                      type="button"
                      onClick={() => toggleExpand(order._id)}
                      className="px-3 py-1.5 rounded-xl bg-background border border-border-theme/60 hover:border-accent text-xs font-bold text-foreground/80 flex items-center gap-1.5 cursor-pointer transition"
                    >
                      <span>{isExpanded ? "Hide Items" : `Items (${order.orderItems?.length})`}</span>
                      <i className={`text-sm ${isExpanded ? "ri-chevron-up-line" : "ri-chevron-down-line"}`} />
                    </button>
                  </div>
                </div>

                {/* Collapsible Items List */}
                {isExpanded && (
                  <div className="space-y-2 animate-fadeIn">
                    {order.orderItems?.map((item, idx) => {
                      const prodId = item.product?._id || item.product;
                      const selectedAttrs = item.selectedAttributes || item.attributes || {};

                      return (
                        <div
                          key={idx}
                          className="flex items-center justify-between gap-3 bg-background/50 p-3 rounded-2xl border border-border-theme/40 text-xs"
                        >
                          <div
                            onClick={() => prodId && navigate(`/product/${prodId}`)}
                            className="flex items-center gap-3 min-w-0 cursor-pointer group"
                          >
                            {item.image && (
                              <img
                                src={item.image}
                                alt={item.name}
                                className="w-10 h-12 object-cover rounded-xl border border-border-theme shrink-0 group-hover:border-accent transition"
                              />
                            )}
                            <div className="min-w-0">
                              <p className="font-bold text-foreground truncate group-hover:text-accent transition">
                                {item.name}
                              </p>

                              {/* Variant Attributes */}
                              {Object.keys(selectedAttrs).length > 0 && (
                                <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                  {Object.entries(selectedAttrs).map(([k, v]) => (
                                    <span
                                      key={k}
                                      className="text-[9px] font-bold bg-accent/10 text-accent border border-accent/20 px-1.5 py-0.5 rounded"
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
                          </div>

                          <span className="font-mono font-black text-foreground shrink-0">
                            ₹{(item.price * item.quantity).toLocaleString()}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Delivery Address & Order Total */}
                <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-border-theme/40 text-xs">
                  <div className="text-foreground/70">
                    <span className="font-bold">Ship to: </span>
                    {order.shippingAddress?.street}, {order.shippingAddress?.city},{" "}
                    {order.shippingAddress?.state} - {order.shippingAddress?.pincode}
                  </div>
                  <div className="font-mono text-sm font-black text-foreground">
                    Order Total: <span className="text-accent">₹{order.totalPrice?.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default SellerOrders;
