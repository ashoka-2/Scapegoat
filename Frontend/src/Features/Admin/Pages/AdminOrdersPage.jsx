import React, { useEffect, useState } from "react";
import { useAdmin } from "../Hooks/useAdmin";
import AdminOrdersSkeleton from "../Components/Skeletons/AdminOrdersSkeleton";
import OrderReceiptModal from "../Components/OrderReceiptModal";

const AdminOrdersPage = () => {
  const {
    orders,
    ordersTotal,
    ordersPage,
    ordersPages,
    loading,
    fetchAdminOrders,
  } = useAdmin();

  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  useEffect(() => {
    fetchAdminOrders({
      status: statusFilter,
      page: 1,
    });
  }, [statusFilter]);

  return (
    <div className="space-y-6 font-sans">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
            Order Lifecycle
          </span>
          <h1 className="text-2xl font-black text-foreground">All Orders ({ordersTotal})</h1>
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-surface border border-border-theme rounded-xl px-3 py-2 text-xs font-semibold text-foreground focus:outline-none focus:border-accent cursor-pointer"
        >
          <option value="all">All Statuses</option>
          <option value="Processing">Processing Only</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
        </select>
      </div>

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
                  <th className="py-3.5 px-4">Payment</th>
                  <th className="py-3.5 px-4">Total Amount</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-theme/40 text-xs font-semibold">
                {orders?.length > 0 ? (
                  orders.map((ord) => {
                    const itemsCount = ord.items?.length || ord.orderItems?.length || 0;
                    const firstItemTitle = ord.items?.[0]?.product?.title || ord.orderItems?.[0]?.name || "Product";
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
                          <p className="text-[10px] text-foreground/50 truncate max-w-[180px]">
                            {firstItemTitle} {itemsCount > 1 ? `+ ${itemsCount - 1} more` : ""}
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
                            <i className="ri-receipt-line" /> View Receipt
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-foreground/40 italic">
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
