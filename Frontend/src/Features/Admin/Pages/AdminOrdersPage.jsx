import React, { useEffect, useState } from "react";
import { useAdmin } from "../Hooks/useAdmin";
import AdminOrdersSkeleton from "../Components/Skeletons/AdminOrdersSkeleton";
import OrderReceiptModal from "../Components/OrderReceiptModal";
import AdminSearchFilterHeader from "../Components/AdminSearchFilterHeader";

const AdminOrdersPage = () => {
  const {
    orders,
    ordersTotal,
    ordersPage,
    ordersPages,
    loading,
    fetchAdminOrders,
  } = useAdmin();

  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateMode, setDateMode] = useState("all"); // "all" | "single" | "range"
  const [singleDate, setSingleDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  useEffect(() => {
    fetchAdminOrders({
      status: statusFilter,
      page: 1,
    });
  }, [statusFilter]);

  const filteredOrders = orders.filter((ord) => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const idMatch = ord._id?.toLowerCase().includes(q) || ord.orderId?.toLowerCase().includes(q);
      const nameMatch = ord.user?.fullname?.toLowerCase().includes(q);
      const emailMatch = ord.user?.email?.toLowerCase().includes(q);
      if (!idMatch && !nameMatch && !emailMatch) return false;
    }

    if (ord.createdAt) {
      const oDate = new Date(ord.createdAt).toISOString().split("T")[0];
      if (dateMode === "single" && singleDate) {
        if (oDate !== singleDate) return false;
      } else if (dateMode === "range") {
        if (startDate && oDate < startDate) return false;
        if (endDate && oDate > endDate) return false;
      }
    }

    return true;
  });

  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("all");
    setDateMode("all");
    setSingleDate("");
    setStartDate("");
    setEndDate("");
  };

  return (
    <div className="space-y-6 font-sans">
      {/* Search and Date Filter Header */}
      <AdminSearchFilterHeader
        title="Order Lifecycle Management"
        subtitle="Search orders by ID, buyer name, email & filter by single date or date range"
        icon="ri-receipt-line"
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        dateMode={dateMode}
        onDateModeChange={setDateMode}
        singleDate={singleDate}
        onSingleDateChange={setSingleDate}
        startDate={startDate}
        onStartDateChange={setStartDate}
        endDate={endDate}
        onEndDateChange={setEndDate}
        onClearFilters={handleClearFilters}
        totalCount={ordersTotal || orders.length}
        filteredCount={filteredOrders.length}
        placeholder="Search Order ID, customer name, email..."
        extraControls={
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-background border border-border-theme rounded-xl px-3 py-1.5 text-xs font-semibold text-foreground focus:outline-none focus:border-accent cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="Processing">Processing Only</option>
            <option value="Shipped">Shipped</option>
            <option value="Delivered">Delivered</option>
            <option value="Cancelled">Cancelled</option>
          </select>
        }
      />

      {/* Orders Table */}
      {loading ? (
        <AdminOrdersSkeleton />
      ) : (
        <div className="bg-surface border border-border-theme rounded-2xl overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border-theme bg-background/50 text-[10px] font-black uppercase tracking-wider text-foreground/50">
                  <th className="py-3.5 px-4">Order ID</th>
                  <th className="py-3.5 px-4">Customer</th>
                  <th className="py-3.5 px-4">Purchased Items</th>
                  <th className="py-3.5 px-4">Seller & Payout</th>
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 text-xs font-semibold">
                {filteredOrders?.length > 0 ? (
                  filteredOrders.map((ord) => {
                    const orderItemsList = ord.orderItems || ord.items || [];
                    const itemsCount = orderItemsList.length;
                    const firstItemTitle = orderItemsList[0]?.product?.title || orderItemsList[0]?.name || "Product";
                    
                    // Identify distinct sellers and total seller payout amount
                    const sellerMap = {};
                    let totalSellerPayout = 0;
                    orderItemsList.forEach((item) => {
                      const sObj = item.seller || item.product?.seller;
                      const sName =
                        typeof sObj === "object"
                          ? sObj.storeName || sObj.fullname || "Seller"
                          : "Seller";
                      sellerMap[sName] = true;
                      totalSellerPayout += (item.price || item.unitPrice || 0) * (item.quantity || 1);
                    });
                    const distinctSellers = Object.keys(sellerMap);
                    const sellerSummary =
                      distinctSellers.length === 1
                        ? distinctSellers[0]
                        : distinctSellers.length > 1
                        ? `${distinctSellers[0]} +${distinctSellers.length - 1} more`
                        : "Marketplace";

                    const isDelivered = ord.status === "Delivered";
                    const isCancelled = ord.status === "Cancelled";

                    return (
                      <tr key={ord._id} className="hover:bg-background/40 transition">
                        <td className="py-3.5 px-4 font-mono font-bold text-accent">
                          #{ord.orderId || ord._id.slice(-6).toUpperCase()}
                        </td>

                        <td className="py-3.5 px-4">
                          <p className="font-extrabold text-foreground">{ord.user?.fullname || "Customer"}</p>
                          <p className="text-[10px] text-foreground/50">{ord.user?.email}</p>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className="font-bold text-foreground">{itemsCount} items</span>
                          <p className="text-[10px] text-foreground/50 truncate max-w-[170px]">
                            {firstItemTitle} {itemsCount > 1 ? `+ ${itemsCount - 1} more` : ""}
                          </p>
                        </td>

                        {/* Seller & Payout Column */}
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-foreground truncate max-w-[140px]">
                            {sellerSummary}
                          </p>
                          <p
                            className={`text-[10px] font-bold font-mono ${
                              isDelivered
                                ? "text-emerald-500"
                                : isCancelled
                                ? "text-red-500/70"
                                : "text-amber-500"
                            }`}
                          >
                            ₹{totalSellerPayout.toLocaleString()}{" "}
                            <span className="text-[9px] font-normal">
                              ({isDelivered ? "Payable" : isCancelled ? "Cancelled" : "On Hold"})
                            </span>
                          </p>
                        </td>

                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${ord.isPaid ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"}`}>
                            {ord.paymentMethod || "COD"} ({ord.isPaid ? "Paid" : "Pending"})
                          </span>
                        </td>

                        <td className="py-3.5 px-4 font-mono font-black text-foreground">
                          ₹{ord.totalPrice?.toLocaleString()}
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
                              ord.status === "Delivered"
                                ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                : ord.status === "Shipped"
                                ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                : ord.status === "Cancelled"
                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                            }`}
                          >
                            {ord.status}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => setSelectedReceiptOrder(ord)}
                            className="px-3 py-1.5 rounded-xl bg-background hover:bg-accent hover:text-accent-content border border-border-theme text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ml-auto"
                          >
                            <i className="ri-receipt-line" /> Audit & Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-foreground/40 italic">
                      No orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {ordersPages > 1 && (
            <div className="p-4 border-t border-border-theme flex items-center justify-between text-xs">
              <span className="text-foreground/50 font-bold">
                Page {ordersPage} of {ordersPages}
              </span>
              <div className="flex gap-2">
                <button
                  disabled={ordersPage <= 1}
                  onClick={() =>
                    fetchAdminOrders({
                      status: statusFilter,
                      page: ordersPage - 1,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-background border border-border-theme font-bold disabled:opacity-40 cursor-pointer"
                >
                  Previous
                </button>
                <button
                  disabled={ordersPage >= ordersPages}
                  onClick={() =>
                    fetchAdminOrders({
                      status: statusFilter,
                      page: ordersPage + 1,
                    })
                  }
                  className="px-3 py-1.5 rounded-lg bg-background border border-border-theme font-bold disabled:opacity-40 cursor-pointer"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reusable Receipt Modal */}
      {selectedReceiptOrder && (
        <OrderReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
};

export default AdminOrdersPage;
