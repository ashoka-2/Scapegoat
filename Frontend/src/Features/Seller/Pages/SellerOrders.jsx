import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useOrders } from "../../Orders/Hooks/useOrders";
import SellerTableSkeleton from "../Components/Skeletons/SellerTableSkeleton";
import MarketTaxInvoice from "../Components/MarketTaxInvoice";

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
  const { user: authUser } = useSelector((state) => state.auth || {});
  const [filterStatus, setFilterStatus] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedQuickPrintOrder, setSelectedQuickPrintOrder] = useState(null);

  useEffect(() => {
    handleFetchSellerOrders();
  }, []);

  const currentSellerId = authUser?._id?.toString();

  const filteredOrders = (sellerOrders || [])
    .filter((o) => (filterStatus === "All" ? true : o.status === filterStatus))
    .filter((o) => {
      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      const idMatch =
        o._id?.toLowerCase().includes(q) ||
        String(o.orderId || "").toLowerCase().includes(q);
      const nameMatch = o.user?.fullname?.toLowerCase().includes(q);
      const emailMatch = o.user?.email?.toLowerCase().includes(q);
      return idMatch || nameMatch || emailMatch;
    });

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
            Real-time fulfillment station • Click any order to view details & print tax bills
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
                  ? "bg-accent text-accent-content border-accent shadow-sm"
                  : "bg-background border-border-theme text-foreground/70 hover:border-accent/40"
              }`}
            >
              {st}
            </button>
          ))}
        </div>
      </div>

      {/* Search Input Filter */}
      <div className="relative">
        <i className="ri-search-line absolute left-4 top-1/2 -translate-y-1/2 text-foreground/40" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by Order ID, Buyer name, email..."
          className="w-full pl-11 pr-4 py-3 bg-surface border border-border-theme rounded-2xl text-xs font-medium text-foreground placeholder:text-foreground/40 outline-none focus:border-accent transition shadow-sm"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/40 hover:text-foreground text-sm cursor-pointer"
          >
            <i className="ri-close-line" />
          </button>
        )}
      </div>

      {/* Orders List / Clean High-Level Cards */}
      {filteredOrders.length === 0 ? (
        <div className="bg-surface border border-border-theme p-12 rounded-3xl text-center space-y-3 shadow-sm">
          <i className="ri-inbox-archive-line text-5xl text-foreground/30" />
          <h2 className="text-lg font-black uppercase text-foreground">No orders found</h2>
          <p className="text-xs text-foreground/50">
            {filterStatus === "All"
              ? "You haven't received any customer orders yet."
              : `No orders matching status "${filterStatus}".`}
          </p>
        </div>
      ) : (
        <div className="space-y-3.5">
          {filteredOrders.map((order) => {
            const allItems = order.orderItems || [];
            
            // Calculate earnings for this seller specifically
            const sellerItems = currentSellerId
              ? allItems.filter(
                  (item) =>
                    item.seller?._id?.toString() === currentSellerId ||
                    item.seller?.toString() === currentSellerId
                )
              : allItems;
            
            const effectiveItems = sellerItems.length > 0 ? sellerItems : allItems;
            const sellerEarnings = effectiveItems.reduce(
              (sum, item) => sum + (item.price || 0) * (item.quantity || 1),
              0
            );

            const isPaid = order.isPaid;
            const paymentMethod = order.paymentMethod || "COD";
            const itemCount = effectiveItems.length;
            const firstItemName = effectiveItems[0]?.name || "Product";

            return (
              <div
                key={order._id}
                onClick={() => navigate(`/seller/orders/${order._id}`)}
                className="group bg-surface hover:bg-surface/80 border border-border-theme hover:border-accent/40 p-5 rounded-3xl space-y-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                {/* Main Order Row: ID, Date, Buyer, Payment, Status, Total */}
                <div className="flex flex-wrap items-center justify-between gap-4">
                  
                  {/* Left: ID & Buyer */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-mono font-black text-accent group-hover:underline">
                        #{order.orderId || order._id.slice(-6).toUpperCase()}
                      </span>

                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${
                          STATUS_COLORS[order.status] || "bg-accent/10 text-accent border-accent/20"
                        }`}
                      >
                        {order.status}
                      </span>

                      {/* Payment Method Badge */}
                      <span
                        className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-full border flex items-center gap-1 ${
                          isPaid
                            ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30"
                            : paymentMethod === "COD"
                            ? "bg-blue-500/10 text-blue-500 border-blue-500/30"
                            : "bg-amber-500/10 text-amber-500 border-amber-500/30"
                        }`}
                      >
                        <i
                          className={
                            paymentMethod === "Razorpay"
                              ? "ri-bank-card-line"
                              : paymentMethod === "COD"
                              ? "ri-hand-coin-line"
                              : "ri-money-dollar-circle-line"
                          }
                        />
                        {paymentMethod} • {isPaid ? "Paid" : "Pending"}
                      </span>
                    </div>

                    <p className="text-xs font-bold text-foreground">
                      Customer: <span className="font-extrabold">{order.user?.fullname || "Customer"}</span>{" "}
                      <span className="text-foreground/50 font-normal text-[11px]">
                        ({order.user?.email || "N/A"})
                      </span>
                    </p>
                  </div>

                  {/* Right: Items preview & Earnings */}
                  <div className="flex items-center gap-4 flex-wrap">
                    
                    {/* Item count & preview */}
                    <div className="text-right text-xs">
                      <span className="font-bold text-foreground block">
                        {itemCount} {itemCount === 1 ? "Item" : "Items"}
                      </span>
                      <span className="text-[10px] text-foreground/50 truncate max-w-[160px] block">
                        {firstItemName} {itemCount > 1 ? `+ ${itemCount - 1} more` : ""}
                      </span>
                    </div>

                    {/* Earnings */}
                    <div className="text-right font-mono pl-4 border-l border-border-theme">
                      <span className="text-[10px] text-foreground/50 uppercase block font-sans font-bold">
                        Your Total
                      </span>
                      <span className="text-sm font-black text-emerald-500">
                        ₹{sellerEarnings.toLocaleString()}
                      </span>
                    </div>

                    {/* Quick Print Button & View Details Arrow */}
                    <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                      <button
                        type="button"
                        onClick={() => setSelectedQuickPrintOrder(order)}
                        className="p-2.5 rounded-xl bg-background hover:bg-accent hover:text-accent-content border border-border-theme/60 text-foreground/70 text-xs font-bold transition cursor-pointer shadow-sm"
                        title="Print Standard Market Bill"
                      >
                        <i className="ri-printer-line text-sm" />
                      </button>

                      <button
                        type="button"
                        onClick={() => navigate(`/seller/orders/${order._id}`)}
                        className="px-3.5 py-2 rounded-xl bg-accent/10 hover:bg-accent text-accent hover:text-accent-content text-xs font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <span>View Details</span>
                        <i className="ri-arrow-right-line" />
                      </button>
                    </div>

                  </div>

                </div>

                {/* Bottom Row: Timestamp & Destination summary */}
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-border-theme/40 text-[11px] text-foreground/50">
                  <div className="flex items-center gap-1.5">
                    <i className="ri-map-pin-line text-xs" />
                    <span>
                      Ship to: {order.shippingAddress?.city}, {order.shippingAddress?.state} ({order.shippingAddress?.pincode})
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 font-mono">
                    <i className="ri-time-line text-xs" />
                    <span>
                      Placed: {new Date(order.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Quick Print Invoice Modal */}
      {selectedQuickPrintOrder && (
        <MarketTaxInvoice
          order={selectedQuickPrintOrder}
          sellerUser={authUser}
          onClose={() => setSelectedQuickPrintOrder(null)}
        />
      )}

    </div>
  );
};

export default SellerOrders;
