import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import customAxios from "../../../utils/axios";
import MarketTaxInvoice from "../../Seller/Components/MarketTaxInvoice";
import { printInvoiceDocument } from "../../../utils/printInvoice";
import { addToast } from "../../../utils/toast.slice.js";

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

const AdminOrderDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingPayoutSellerId, setUpdatingPayoutSellerId] = useState(null);
  const [selectedPrintSeller, setSelectedPrintSeller] = useState(null); // null = full order, object = specific seller
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);

  const fetchOrder = async () => {
    try {
      setLoading(true);
      const res = await customAxios.get(`/api/orders/${id}`);
      if (res.data?.success) {
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error("Error fetching order:", err);
      dispatch(addToast({ message: err.response?.data?.message || "Failed to load order.", type: "error" }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) fetchOrder();
  }, [id]);

  const handleStatusChange = async (newStatus) => {
    try {
      setUpdatingStatus(true);
      const res = await customAxios.put(`/api/orders/${id}/status`, { status: newStatus });
      if (res.data?.success) {
        dispatch(addToast({ message: "Order status updated successfully.", type: "success" }));
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error("Error updating status:", err);
      dispatch(addToast({ message: err.response?.data?.message || "Failed to update status.", type: "error" }));
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleToggleSellerPayout = async (sellerId, currentSettled) => {
    try {
      setUpdatingPayoutSellerId(sellerId);
      const newStatus = !currentSettled;
      const res = await customAxios.put(`/api/orders/${id}/payout/${sellerId}`, {
        isSettled: newStatus,
        transactionRef: newStatus ? `TXN-PAYOUT-${Date.now().toString().slice(-6)}` : "",
      });
      if (res.data?.success) {
        dispatch(addToast({ message: res.data.message || "Seller payout status updated.", type: "success" }));
        setOrder(res.data.order);
      }
    } catch (err) {
      console.error("Error updating seller payout:", err);
      dispatch(addToast({ message: err.response?.data?.message || "Failed to update payout status.", type: "error" }));
    } finally {
      setUpdatingPayoutSellerId(null);
    }
  };

  if (loading || !order) {
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
            <div className="h-48 bg-surface animate-pulse rounded-3xl border border-border-theme" />
          </div>
        </div>
      </div>
    );
  }

  const user = order.user || {};
  const shippingAddress = order.shippingAddress || {};
  const items = order.orderItems || order.items || [];
  const isDelivered = order.status === "Delivered";
  const isCancelled = order.status === "Cancelled";

  // Group items by Seller
  const sellerGroups = items.reduce((acc, item) => {
    const candidate =
      (typeof item.seller === "object" && item.seller !== null ? item.seller : null) ||
      (typeof item.product?.seller === "object" && item.product?.seller !== null ? item.product.seller : null) ||
      (typeof item.product === "object" && typeof item.product?.seller === "object" ? item.product.seller : null);

    const rawSellerId =
      candidate?._id ||
      item.seller?._id ||
      item.seller ||
      item.product?.seller?._id ||
      item.product?.seller ||
      "unassigned";

    const sellerId = typeof rawSellerId === "object" && rawSellerId?._id ? rawSellerId._id.toString() : rawSellerId.toString();

    // Check recorded settlement from order.sellerPayouts (which may also contain populated seller details)
    const payoutRecord = order.sellerPayouts?.find(
      (p) => (p.seller?._id || p.seller)?.toString() === sellerId
    );
    const payoutSellerObj = typeof payoutRecord?.seller === "object" ? payoutRecord.seller : null;

    const finalSellerObj = candidate || payoutSellerObj || (typeof item.seller === "object" ? item.seller : null) || {};

    const sellerName =
      finalSellerObj.storeName ||
      finalSellerObj.fullname ||
      (finalSellerObj.email ? finalSellerObj.email.split("@")[0] : "Marketplace Merchant");

    const sellerEmail = finalSellerObj.email || "";
    const sellerContact = finalSellerObj.contact || finalSellerObj.phone || "";

    const itemTotal = (item.price || 0) * (item.quantity || 1);

    if (!acc[sellerId]) {
      acc[sellerId] = {
        sellerId,
        sellerObj: {
          _id: sellerId,
          fullname: finalSellerObj.fullname || sellerName,
          storeName: finalSellerObj.storeName || sellerName,
          email: sellerEmail,
          contact: sellerContact,
        },
        sellerName,
        sellerEmail,
        sellerContact,
        items: [],
        totalPayout: 0,
        isSettled: Boolean(payoutRecord?.isSettled),
        settledAt: payoutRecord?.settledAt,
        transactionRef: payoutRecord?.transactionRef,
      };
    } else {
      // Backfill missing email/phone if later item has it
      if (!acc[sellerId].sellerEmail && sellerEmail) acc[sellerId].sellerEmail = sellerEmail;
      if (!acc[sellerId].sellerContact && sellerContact) acc[sellerId].sellerContact = sellerContact;
      if (acc[sellerId].sellerName === "Marketplace Merchant" && sellerName !== "Marketplace Merchant") {
        acc[sellerId].sellerName = sellerName;
      }
    }

    acc[sellerId].items.push(item);
    acc[sellerId].totalPayout += itemTotal;

    return acc;
  }, {});

  const sellerList = Object.values(sellerGroups);
  const totalSellerPayoutSum = sellerList.reduce((sum, s) => sum + s.totalPayout, 0);

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
      
      {/* Header Navigation & Action Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-surface border border-border-theme p-6 rounded-3xl shadow-lg">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-xs font-bold text-foreground/60 hover:text-accent flex items-center gap-1 transition cursor-pointer"
            >
              <i className="ri-arrow-left-line text-sm" /> All Admin Orders
            </button>
            <span className="text-foreground/30">•</span>
            <span className="text-xs font-mono font-black text-accent">
              #{order.orderId || order._id?.slice(-8).toUpperCase()}
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-black uppercase tracking-tight text-foreground">
              Admin Order Lifecycle & Payouts
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
          {/* Main Print Full Bill Action */}
          <button
            type="button"
            onClick={() => {
              setSelectedPrintSeller(null);
              setShowInvoiceModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-accent text-accent-content font-black text-xs hover:brightness-110 active:scale-95 transition cursor-pointer flex items-center gap-2 shadow-lg shadow-accent/20"
          >
            <i className="ri-bill-line text-base" />
            <span>Generate & Print Bill</span>
          </button>

          {/* Quick Print A4 & Thermal Direct */}
          <div className="flex items-center bg-background border border-border-theme rounded-2xl p-1 text-xs">
            <button
              type="button"
              onClick={() =>
                printInvoiceDocument({
                  order,
                  sellerUser: null,
                  includeImages: false,
                  paperSize: "A4",
                })
              }
              className="px-3 py-1.5 rounded-xl font-bold hover:text-accent transition cursor-pointer flex items-center gap-1"
              title="Print standard A4"
            >
              <i className="ri-file-paper-2-line" /> Quick A4
            </button>
            <button
              type="button"
              onClick={() =>
                printInvoiceDocument({
                  order,
                  sellerUser: null,
                  includeImages: true,
                  paperSize: "thermal",
                })
              }
              className="px-3 py-1.5 rounded-xl font-bold text-amber-500 hover:text-amber-400 transition cursor-pointer flex items-center gap-1"
              title="Print 80mm POS Thermal Receipt"
            >
              <i className="ri-receipt-line" /> POS 80mm
            </button>
          </div>

          {/* Fulfillment Status Changer */}
          <div className="flex items-center gap-2 bg-background border border-border-theme p-1.5 rounded-2xl">
            <label className="text-[10px] font-black uppercase text-foreground/60 px-2">
              Status:
            </label>
            <select
              disabled={updatingStatus}
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
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

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left 2 Cols: Fulfillment & Multi-Vendor Seller Breakdown */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Fulfillment Tracker */}
          {order.status !== "Cancelled" && (
            <div className="bg-surface border border-border-theme p-6 rounded-3xl shadow-sm space-y-4">
              <h2 className="text-xs font-black uppercase tracking-wider text-foreground/60">
                Customer Delivery Status
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
                        } ${isCurrent ? "ring-4 ring-accent/20 scale-110" : ""}`}
                      >
                        <i className={st.icon} />
                      </div>
                      <span
                        className={`text-[11px] font-bold ${
                          isDone ? "text-foreground" : "text-foreground/40"
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

          {/* Multi-Vendor Seller Payout Cards */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-black uppercase tracking-tight text-foreground">
                  Multi-Vendor Breakdown & Seller Payouts
                </h2>
                <p className="text-xs text-foreground/50">
                  {sellerList.length === 1
                    ? "Single seller order"
                    : `Order contains products from ${sellerList.length} different sellers. Pay each seller when delivered.`}
                </p>
              </div>
              <span className="text-xs font-mono font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                Total Seller Liability: ₹{totalSellerPayoutSum.toLocaleString()}
              </span>
            </div>

            {sellerList.map((sg, idx) => {
              const canPay = isDelivered;

              return (
                <div
                  key={idx}
                  className="bg-surface border border-border-theme rounded-3xl p-6 shadow-sm space-y-4 hover:border-border-theme/80 transition"
                >
                  {/* Seller Header */}
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border-theme/60 pb-4">
                    <div className="flex items-center gap-3.5">
                      <div className="w-11 h-11 rounded-2xl bg-accent/10 border border-accent/20 text-accent flex items-center justify-center text-xl shrink-0">
                        <i className="ri-store-2-line" />
                      </div>
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="font-black text-sm text-foreground">
                            {sg.sellerName}
                          </h3>
                          <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-md bg-background border border-border-theme text-foreground/60">
                            ID: {sg.sellerId.slice(-6).toUpperCase()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs flex-wrap">
                          {sg.sellerEmail ? (
                            <a
                              href={`mailto:${sg.sellerEmail}`}
                              className="text-foreground/70 hover:text-accent flex items-center gap-1 font-medium transition cursor-pointer bg-background/60 px-2 py-0.5 rounded-lg border border-border-theme/50"
                            >
                              <i className="ri-mail-line text-accent" />
                              <span>{sg.sellerEmail}</span>
                            </a>
                          ) : (
                            <span className="text-foreground/40 text-[11px] italic">Email: Not Available</span>
                          )}

                          {sg.sellerContact ? (
                            <a
                              href={`tel:${sg.sellerContact}`}
                              className="text-foreground/70 hover:text-accent flex items-center gap-1 font-medium transition cursor-pointer bg-background/60 px-2 py-0.5 rounded-lg border border-border-theme/50"
                            >
                              <i className="ri-phone-line text-emerald-500" />
                              <span>{sg.sellerContact}</span>
                            </a>
                          ) : (
                            <span className="text-foreground/40 text-[11px] italic">Phone: Not Available</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Payout Settlement Badge & Button */}
                    <div className="flex items-center gap-2.5 flex-wrap">
                      {/* Payout Status Badge */}
                      <span
                        className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-xl border ${
                          sg.isSettled
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                            : isDelivered
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/30 animate-pulse"
                            : isCancelled
                            ? "bg-red-500/10 text-red-500 border-red-500/30"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                        }`}
                      >
                        {sg.isSettled
                          ? "✅ Payout Settled"
                          : isDelivered
                          ? "⚡ Ready for Payout"
                          : isCancelled
                          ? "❌ Cancelled"
                          : "⏳ On Hold (Pending Delivery)"}
                      </span>

                      {/* Admin Toggle Payout Settlement Button */}
                      <button
                        type="button"
                        disabled={updatingPayoutSellerId === sg.sellerId || (!isDelivered && !sg.isSettled)}
                        onClick={() => handleToggleSellerPayout(sg.sellerId, sg.isSettled)}
                        className={`px-3.5 py-1.5 rounded-xl font-bold text-xs transition cursor-pointer flex items-center gap-1.5 shadow-sm disabled:opacity-40 disabled:cursor-not-allowed ${
                          sg.isSettled
                            ? "bg-background border border-border-theme hover:border-red-500 hover:text-red-500 text-foreground/70"
                            : "bg-emerald-500 text-black hover:bg-emerald-400 font-extrabold"
                        }`}
                        title={
                          !isDelivered && !sg.isSettled
                            ? "Payouts can be released after order is marked Delivered to customer"
                            : "Toggle seller payout settlement"
                        }
                      >
                        <i className={sg.isSettled ? "ri-close-circle-line" : "ri-money-dollar-circle-line"} />
                        <span>{sg.isSettled ? "Mark Unsettled" : "Release & Pay Seller"}</span>
                      </button>

                      {/* Print Seller Packing Slip */}
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedPrintSeller(sg.sellerObj);
                          setShowInvoiceModal(true);
                        }}
                        className="p-2 rounded-xl bg-background hover:bg-surface border border-border-theme text-foreground/70 hover:text-foreground text-xs font-bold transition cursor-pointer"
                        title="Print bill for this seller's items only"
                      >
                        <i className="ri-printer-line" />
                      </button>
                    </div>
                  </div>

                  {/* Seller Items List */}
                  <div className="divide-y divide-border-theme/40">
                    {sg.items.map((item, itemIdx) => {
                      const img = item.image || item.product?.images?.[0]?.url || item.product?.images?.[0] || "";
                      const title = item.name || item.product?.title || "Product";
                      const price = Number(item.price || 0);
                      const qty = Number(item.quantity || 1);
                      const gross = price * qty;
                      const selectedAttrs = item.selectedAttributes || {};

                      return (
                        <div key={itemIdx} className="py-3 flex items-center justify-between gap-4">
                          <div className="flex items-center gap-3 min-w-0">
                            {img ? (
                              <img
                                src={img}
                                alt={title}
                                className="w-12 h-12 rounded-xl object-cover border border-border-theme shrink-0"
                              />
                            ) : (
                              <div className="w-12 h-12 rounded-xl bg-background border border-border-theme flex items-center justify-center text-xs text-foreground/40 shrink-0">
                                No Pic
                              </div>
                            )}
                            <div className="min-w-0">
                              <p className="text-xs font-bold text-foreground truncate">{title}</p>
                              {Object.keys(selectedAttrs).length > 0 && (
                                <p className="text-[10px] text-foreground/50">
                                  Variant: {Object.entries(selectedAttrs).map(([k, v]) => `${k}: ${v}`).join(", ")}
                                </p>
                              )}
                              <p className="text-[11px] text-foreground/60 font-mono">
                                {qty} × ₹{price.toLocaleString()}
                              </p>
                            </div>
                          </div>

                          <div className="text-right shrink-0">
                            <span className="text-xs font-mono font-black text-foreground">
                              ₹{gross.toLocaleString()}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Seller Payout Subtotal Footer */}
                  <div className="flex items-center justify-between pt-3 border-t border-border-theme/60 text-xs">
                    <span className="text-foreground/50 font-bold uppercase tracking-wider text-[10px]">
                      Payout Payable to {sg.sellerName}:
                    </span>
                    <span className="font-mono font-black text-sm text-emerald-500">
                      ₹{sg.totalPayout.toLocaleString()}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

        </div>

        {/* Right Col: Customer & Payment Audit Card */}
        <div className="space-y-6">
          
          {/* Customer & Shipping Destination */}
          <div className="bg-surface border border-border-theme p-6 rounded-3xl space-y-4 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground/60">
              Buyer & Destination
            </h2>

            <div className="space-y-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-background border border-border-theme space-y-1">
                <span className="text-[10px] font-black uppercase text-foreground/40 block">Customer</span>
                <p className="font-bold text-foreground">{user.fullname || shippingAddress.fullname || "Customer"}</p>
                <p className="text-foreground/60">{user.email || "N/A"}</p>
                <p className="text-foreground/60 font-medium">
                  Phone: <span className="text-foreground font-bold">{user.contact || shippingAddress.phone || "N/A"}</span>
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-background border border-border-theme space-y-1">
                <span className="text-[10px] font-black uppercase text-foreground/40 block">Shipping Destination</span>
                <p className="font-bold text-foreground">{shippingAddress.fullname || user.fullname || "Recipient"}</p>
                <p className="text-foreground/60">{shippingAddress.street || "Address"}</p>
                <p className="text-foreground/60">
                  {shippingAddress.city}, {shippingAddress.state} - <span className="font-bold text-foreground">{shippingAddress.pincode}</span>
                </p>
                <p className="text-foreground/40 text-[10px]">Country: {shippingAddress.country || "India"}</p>
              </div>
            </div>
          </div>

          {/* Payment & Financial Ledger */}
          <div className="bg-surface border border-border-theme p-6 rounded-3xl space-y-4 shadow-sm">
            <h2 className="text-xs font-black uppercase tracking-wider text-foreground/60">
              Financial Settlement
            </h2>

            <div className="space-y-2 text-xs font-mono">
              <div className="flex justify-between text-foreground/70">
                <span>Items Subtotal:</span>
                <span>₹{(order.itemsPrice || order.totalPrice || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-foreground/70">
                <span>Shipping Fee:</span>
                <span className="text-emerald-500 font-bold">{order.shippingPrice === 0 ? "FREE" : `₹${order.shippingPrice}`}</span>
              </div>
              <div className="flex justify-between text-sm font-black text-foreground pt-2 border-t border-border-theme">
                <span>Grand Total:</span>
                <span>₹{order.totalPrice?.toLocaleString()}</span>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-background border border-border-theme space-y-1.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Payment Mode:</span>
                <span className="font-bold text-foreground">{order.paymentMethod || "COD"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-foreground/60">Payment Status:</span>
                <span className={`px-2 py-0.5 rounded text-[10px] font-black ${order.isPaid ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                  {order.isPaid ? "PAID ONLINE" : "PENDING / COD"}
                </span>
              </div>
              {(order.paymentResult?.razorpayPaymentId || order.paymentResult?.id) && (
                <p className="text-[10px] text-foreground/40 truncate font-mono pt-1">
                  Txn ID: {order.paymentResult?.razorpayPaymentId || order.paymentResult?.id}
                </p>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Reusable Print Preview Modal (Supports Full Order or Specific Seller Filter) */}
      {showInvoiceModal && (
        <MarketTaxInvoice
          order={order}
          sellerUser={selectedPrintSeller}
          onClose={() => {
            setShowInvoiceModal(false);
            setSelectedPrintSeller(null);
          }}
        />
      )}

    </div>
  );
};

export default AdminOrderDetailPage;
