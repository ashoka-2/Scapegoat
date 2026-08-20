import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { useOrders } from "../../Orders/Hooks/useOrders";
import MarketTaxInvoice from "../Components/MarketTaxInvoice";
import { printInvoiceDocument } from "../../../utils/printInvoice";

const STATUS_COLORS = {
  Processing: "bg-amber-500/10 text-amber-500 border-amber-500/30",
  Shipped: "bg-blue-500/10 text-blue-500 border-blue-500/30",
  Delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/30",
  Cancelled: "bg-red-500/10 text-red-500 border-red-500/30",
};

const STEPS = [
  { key: "Processing", label: "Order Placed", icon: "ri-time-line" },
  { key: "Processing", label: "Processing", icon: "ri-box-3-line" },
  { key: "Shipped", label: "Shipped", icon: "ri-truck-line" },
  { key: "Delivered", label: "Delivered", icon: "ri-checkbox-circle-line" },
];

const SellerOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleFetchOrderById, handleUpdateStatus } = useOrders();
  const { currentOrder, loading } = useSelector((state) => state.orders);
  const { user: authUser } = useSelector((state) => state.auth || {});
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);

  useEffect(() => {
    if (id) {
      handleFetchOrderById(id);
    }
  }, [id]);

  const onStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await handleUpdateStatus(id, newStatus);
      await handleFetchOrderById(id);
    } catch (e) {
      console.error("Status update error:", e);
    } finally {
      setUpdatingStatus(false);
    }
  };

  if (loading || !currentOrder) {
    return (
      <div className="space-y-6 font-sans">
        <div className="flex items-center gap-3">
          <div className="h-10 w-24 bg-surface animate-pulse rounded-xl border border-border-theme" />
          <div className="h-10 w-48 bg-surface animate-pulse rounded-xl border border-border-theme" />
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="h-64 bg-surface animate-pulse rounded-3xl border border-border-theme" />
            <div className="h-48 bg-surface animate-pulse rounded-3xl border border-border-theme" />
          </div>
          <div className="space-y-6">
            <div className="h-72 bg-surface animate-pulse rounded-3xl border border-border-theme" />
          </div>
        </div>
      </div>
    );
  }

  const order = currentOrder;
  const user = order.user || {};
  const shippingAddress = order.shippingAddress || {};
  const allItems = order.orderItems || order.items || [];

  const currentSellerId = authUser?._id?.toString();
  const sellerItems = currentSellerId
    ? allItems.filter(
        (item) =>
          item.seller?._id?.toString() === currentSellerId ||
          item.seller?.toString() === currentSellerId
      )
    : allItems;

  const displayItems = sellerItems.length > 0 ? sellerItems : allItems;
  const sellerEarnings = displayItems.reduce(
    (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
    0
  );

  const isPaid = order.isPaid;
  const paymentMethod = order.paymentMethod || "COD";
  const isDelivered = order.status === "Delivered";

  const getStepIndex = (status) => {
    switch (status) {
      case "Processing":
        return 1;
      case "Shipped":
        return 2;
      case "Delivered":
        return 3;
      case "Cancelled":
        return -1;
      default:
        return 0;
    }
  };

  const currentStep = getStepIndex(order.status);

  return (
    <div className="space-y-6 font-sans">
      
      {/* Top Navigation & Action Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border-theme p-6 rounded-3xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/seller/orders")}
              className="text-xs font-bold text-foreground/60 hover:text-accent flex items-center gap-1 transition cursor-pointer"
            >
              <i className="ri-arrow-left-line text-sm" /> Customer Orders
            </button>
            <span className="text-foreground/30">•</span>
            <span className="text-xs font-mono font-black text-accent">
              #{order.orderId || order._id?.slice(-6).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
              Order Details
            </h1>
            <span
              className={`text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full border ${
                STATUS_COLORS[order.status] || "bg-accent/10 text-accent border-accent/20"
              }`}
            >
              {order.status}
            </span>
          </div>
          <p className="text-xs text-foreground/50">
            Placed on {new Date(order.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
          </p>
        </div>

        {/* Header Action Buttons */}
        <div className="flex items-center gap-3 flex-wrap">
          {/* Main Print & Preview Action */}
          <button
            type="button"
            onClick={() => setShowInvoiceModal(true)}
            className="px-4 py-2.5 rounded-2xl bg-accent text-accent-content font-black text-xs hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-2 shadow-lg shadow-accent/20"
          >
            <i className="ri-bill-line text-base" />
            <span>Generate & Print Bill</span>
          </button>

          {/* Direct Quick Print */}
          <button
            type="button"
            onClick={() =>
              printInvoiceDocument({
                order,
                sellerUser: authUser,
                includeImages: false,
              })
            }
            className="px-3.5 py-2.5 rounded-2xl bg-background hover:bg-surface border border-border-theme hover:border-accent text-foreground font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm"
            title="Instant 1-click print without images"
          >
            <i className="ri-printer-line text-sm" />
            <span>Quick Print</span>
          </button>

          {/* Fulfillment Status Changer */}
          <div className="flex items-center gap-2 bg-background border border-border-theme p-1.5 rounded-2xl">
            <label className="text-[10px] font-black uppercase text-foreground/60 px-2">
              Status:
            </label>
            <select
              disabled={updatingStatus}
              value={order.status}
              onChange={(e) => onStatusChange(e.target.value)}
              className="bg-surface border border-border-theme rounded-xl px-3 py-1 text-xs font-bold text-foreground outline-none focus:border-accent cursor-pointer disabled:opacity-50"
            >
              <option value="Processing">Processing</option>
              <option value="Shipped">Shipped</option>
              <option value="Delivered">Delivered</option>
              <option value="Cancelled">Cancelled</option>
            </select>
          </div>
        </div>
      </div>

      {/* Main Order Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Column: Items, Timeline, Shipping */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Fulfillment Progress Timeline */}
          {order.status !== "Cancelled" && (
            <div className="bg-surface border border-border-theme p-6 rounded-3xl shadow-sm space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-foreground/60">
                Fulfillment Tracker
              </h2>

              <div className="grid grid-cols-4 gap-2 relative">
                {STEPS.map((st, idx) => {
                  const isDone = currentStep >= idx;
                  const isCurrent = currentStep === idx;

                  return (
                    <div key={idx} className="flex flex-col items-center text-center space-y-2">
                      <div
                        className={`w-9 h-9 rounded-2xl flex items-center justify-center text-sm font-bold transition-all ${
                          isDone
                            ? "bg-accent text-accent-content shadow-md shadow-accent/25"
                            : "bg-background border border-border-theme text-foreground/40"
                        }`}
                      >
                        <i className={st.icon} />
                      </div>
                      <span
                        className={`text-[11px] font-bold ${
                          isCurrent
                            ? "text-accent font-black"
                            : isDone
                            ? "text-foreground"
                            : "text-foreground/40"
                        }`}
                      >
                        {st.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Purchased Items Card */}
          <div className="bg-surface border border-border-theme p-6 rounded-3xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-border-theme pb-4">
              <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
                Your Store Items ({displayItems.length})
              </h2>
              <span className="text-xs font-mono font-bold text-foreground/60">
                Item Total: <span className="text-emerald-500 font-black">₹{sellerEarnings.toLocaleString()}</span>
              </span>
            </div>

            <div className="space-y-3">
              {displayItems.map((item, idx) => {
                const prodId = item.product?._id || item.product;
                const selectedAttrs = item.selectedAttributes || item.attributes || {};

                return (
                  <div
                    key={idx}
                    className="flex flex-wrap items-center justify-between gap-4 p-4 bg-background/50 border border-border-theme/40 rounded-2xl text-xs hover:border-accent/30 transition"
                  >
                    <div
                      onClick={() => prodId && navigate(`/product/${prodId}`)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer group flex-1"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-14 h-16 object-cover rounded-xl border border-border-theme shrink-0 group-hover:border-accent transition"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-sm text-foreground group-hover:text-accent transition truncate">
                          {item.name || item.product?.title || "Product"}
                        </p>

                        {/* Variant Attributes */}
                        {Object.keys(selectedAttrs).length > 0 && (
                          <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                            {Object.entries(selectedAttrs).map(([k, v]) => (
                              <span
                                key={k}
                                className="text-[10px] font-bold bg-accent/10 text-accent border border-accent/20 px-2 py-0.5 rounded-md"
                              >
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}

                        <p className="text-xs text-foreground/60 mt-1 font-mono">
                          Unit Price: ₹{item.price?.toLocaleString()} • Qty: {item.quantity}
                        </p>
                      </div>
                    </div>

                    <div className="text-right font-mono shrink-0">
                      <span className="text-[10px] text-foreground/50 block uppercase">Subtotal</span>
                      <span className="text-base font-black text-foreground">
                        ₹{((item.price || 0) * (item.quantity || 1)).toLocaleString()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Shipping & Delivery Address Card */}
          <div className="bg-surface border border-border-theme p-6 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
              Delivery Destination
            </h2>

            <div className="p-4 bg-background/50 border border-border-theme/40 rounded-2xl space-y-2 text-xs">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-extrabold text-sm text-foreground">
                    {user.fullname || shippingAddress.fullname || "Customer"}
                  </p>
                  <p className="text-foreground/70">{shippingAddress.street}</p>
                  <p className="text-foreground/70">
                    {shippingAddress.city}, {shippingAddress.state} - <span className="font-bold text-foreground">{shippingAddress.pincode}</span>
                  </p>
                  <p className="text-foreground/70">{shippingAddress.country || "India"}</p>
                </div>

                <div className="space-y-1 text-right">
                  <p className="text-foreground/60 font-mono">
                    Ph: <span className="font-bold text-foreground">{user.contact || shippingAddress.phone || "N/A"}</span>
                  </p>
                  <p className="text-foreground/60 truncate max-w-[200px]">{user.email}</p>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Payment, Payout & Print Bill Trigger */}
        <div className="space-y-6">
          
          {/* Payment Details Card */}
          <div className="bg-surface border border-border-theme p-6 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
              Payment Information
            </h2>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 bg-background/50 border border-border-theme/40 rounded-xl">
                <span className="text-foreground/60">Method:</span>
                <span className="font-mono font-bold text-foreground uppercase bg-surface px-2 py-0.5 rounded border border-border-theme">
                  {paymentMethod}
                </span>
              </div>

              <div className="flex items-center justify-between p-3 bg-background/50 border border-border-theme/40 rounded-xl">
                <span className="text-foreground/60">Payment Status:</span>
                <span
                  className={`font-black uppercase px-2 py-0.5 rounded-full text-[10px] border ${
                    isPaid
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                      : paymentMethod === "COD"
                      ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  }`}
                >
                  {isPaid ? "Paid Online" : paymentMethod === "COD" ? "Cash On Delivery" : "Pending"}
                </span>
              </div>

              {order.paymentResult?.razorpayPaymentId && (
                <div className="p-3 bg-background/50 border border-border-theme/40 rounded-xl space-y-1">
                  <span className="text-[10px] text-foreground/50 font-bold block uppercase">Transaction ID</span>
                  <span className="font-mono text-[11px] text-foreground break-all">
                    {order.paymentResult.razorpayPaymentId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Seller Settlement Card */}
          <div className="bg-surface border border-border-theme p-6 rounded-3xl shadow-sm space-y-4">
            <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
              Settlement & Earnings
            </h2>

            <div className="space-y-2 text-xs font-mono p-4 bg-background/50 border border-border-theme/40 rounded-2xl">
              <div className="flex justify-between text-foreground/70">
                <span>Your Products Total:</span>
                <span>₹{sellerEarnings.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-foreground/70">
                <span>Estimated Taxes (GST):</span>
                <span>₹0 (Included)</span>
              </div>
              <div className="flex justify-between text-foreground/70">
                <span>Platform Commission:</span>
                <span>₹0</span>
              </div>

              <div className="pt-2 border-t border-border-theme flex justify-between text-sm font-black text-foreground">
                <span>Net Payout:</span>
                <span className="text-emerald-500 font-mono">₹{sellerEarnings.toLocaleString()}</span>
              </div>

              <div className="pt-2">
                <span
                  className={`block text-center text-[10px] font-black uppercase py-1.5 px-2 rounded-xl border ${
                    isDelivered
                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                      : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                  }`}
                >
                  {isDelivered
                    ? "✅ Delivered — Eligible for Payout"
                    : "⏳ Payout Released Upon Customer Delivery"}
                </span>
              </div>
            </div>
          </div>

          {/* Print Invoice Card Banner */}
          <div className="bg-gradient-to-br from-accent/15 via-surface to-surface border border-accent/30 p-6 rounded-3xl space-y-3 shadow-md">
            <div className="flex items-center gap-2 text-accent">
              <i className="ri-bill-line text-xl" />
              <h3 className="font-black uppercase tracking-tight text-foreground text-sm">
                Official Retail Bill
              </h3>
            </div>
            <p className="text-xs text-foreground/70">
              Commercial tax bill formatted for standard physical packing & dispatch.
            </p>
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={() =>
                  printInvoiceDocument({
                    order,
                    sellerUser: authUser,
                    includeImages: false,
                  })
                }
                className="w-full py-2 rounded-xl bg-background border border-border-theme hover:border-accent text-foreground font-bold text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <i className="ri-printer-line" />
                <span>Print Bill (No Images)</span>
              </button>

              <button
                type="button"
                onClick={() =>
                  printInvoiceDocument({
                    order,
                    sellerUser: authUser,
                    includeImages: true,
                  })
                }
                className="w-full py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs hover:brightness-110 transition cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-accent/20"
              >
                <i className="ri-image-line" />
                <span>Print Bill (With Images)</span>
              </button>
            </div>
          </div>

        </div>

      </div>

      {/* Full Market Format Tax Invoice Print Preview Modal */}
      {showInvoiceModal && (
        <MarketTaxInvoice
          order={order}
          sellerUser={authUser}
          onClose={() => setShowInvoiceModal(false)}
        />
      )}

    </div>
  );
};

export default SellerOrderDetailPage;
