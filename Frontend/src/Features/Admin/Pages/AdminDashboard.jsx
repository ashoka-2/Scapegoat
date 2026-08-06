import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAdmin } from "../Hooks/useAdmin";
import socket from "../../../utils/socket";
import AdminDashboardSkeleton from "../Components/Skeletons/AdminDashboardSkeleton";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { stats, loading, fetchDashboardStats } = useAdmin();
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);

  useEffect(() => {
    fetchDashboardStats();

    const onRealtimeUpdate = () => {
      fetchDashboardStats();
    };

    socket.on("realtime_update", onRealtimeUpdate);
    socket.on("user_banned_status", onRealtimeUpdate);
    socket.on("user_role_updated", onRealtimeUpdate);
    socket.on("order_status_updated", onRealtimeUpdate);

    return () => {
      socket.off("realtime_update", onRealtimeUpdate);
      socket.off("user_banned_status", onRealtimeUpdate);
      socket.off("user_role_updated", onRealtimeUpdate);
      socket.off("order_status_updated", onRealtimeUpdate);
    };
  }, []);

  if (loading && !stats) {
    return <AdminDashboardSkeleton />;
  }

  const {
    users,
    products,
    orders,
    catalog,
    chartData = [],
    topProducts = [],
    recentOrders = [],
  } = stats || {};

  const maxRevenueInChart = Math.max(...chartData.map((c) => c.revenue || 1), 10000);

  return (
    <div className="space-y-8 font-sans">
      {/* ── Page Header & Welcome Banner ── */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-border-theme pb-6">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
              Control Panel
            </span>
            <span className="inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              Live Socket Sync
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-foreground mt-0.5">
            Dashboard Overview
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowActiveUsersModal(true)}
            className="px-4 py-2 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 hover:bg-emerald-500 hover:text-white text-xs font-bold transition cursor-pointer flex items-center gap-2"
          >
            <i className="ri-user-heart-line text-sm" />
            Active Users ({users?.activeUsersList?.length || 0})
          </button>

          <button
            onClick={fetchDashboardStats}
            className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center gap-2 shadow-sm"
          >
            <i className="ri-refresh-line text-sm" /> Refresh
          </button>
        </div>
      </div>

      {/* ── Top Metric Cards Grid ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Gross Revenue Card */}
        <div className="bg-surface border border-border-theme p-5 rounded-2xl space-y-3 shadow-sm relative overflow-hidden group hover:border-accent transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-foreground/60 tracking-wider">
              Gross Revenue
            </span>
            <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center">
              <i className="ri-money-rupee-circle-line text-xl" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-black text-emerald-500">
            ₹{(orders?.totalRevenue || 0).toLocaleString()}
          </p>
          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground/60 pt-1 border-t border-border-theme/40">
            <span>Today: <strong className="text-emerald-500">₹{(orders?.revenueToday || 0).toLocaleString()}</strong></span>
            <span className="text-emerald-500 font-bold flex items-center"><i className="ri-arrow-up-line" /> +12.4%</span>
          </div>
        </div>

        {/* Total Orders Card */}
        <div className="bg-surface border border-border-theme p-5 rounded-2xl space-y-3 shadow-sm relative overflow-hidden group hover:border-accent transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-foreground/60 tracking-wider">
              Total Orders
            </span>
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center">
              <i className="ri-shopping-bag-3-line text-xl" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-black text-foreground">
            {orders?.total || 0}
          </p>
          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground/60 pt-1 border-t border-border-theme/40">
            <span>Processing: <strong className="text-amber-500">{orders?.processing || 0}</strong></span>
            <span>Today: <strong className="text-accent">+{orders?.today || 0}</strong></span>
          </div>
        </div>

        {/* Active Customers / Users Card */}
        <div className="bg-surface border border-border-theme p-5 rounded-2xl space-y-3 shadow-sm relative overflow-hidden group hover:border-accent transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-foreground/60 tracking-wider">
              Registered Users
            </span>
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center">
              <i className="ri-group-line text-xl" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-black text-foreground">
            {users?.total || 0}
          </p>
          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground/60 pt-1 border-t border-border-theme/40">
            <span>Buyers: <strong className="text-foreground">{users?.buyers || 0}</strong></span>
            <span>Sellers: <strong className="text-amber-500">{users?.sellers || 0}</strong></span>
          </div>
        </div>

        {/* Active Products Card */}
        <div className="bg-surface border border-border-theme p-5 rounded-2xl space-y-3 shadow-sm relative overflow-hidden group hover:border-accent transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold uppercase text-foreground/60 tracking-wider">
              Catalog Products
            </span>
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 flex items-center justify-center">
              <i className="ri-box-3-line text-xl" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-mono font-black text-foreground">
            {products?.total || 0}
          </p>
          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground/60 pt-1 border-t border-border-theme/40">
            <span>Active: <strong className="text-emerald-500">{products?.active || 0}</strong></span>
            <span>Categories: <strong>{catalog?.categories || 0}</strong></span>
          </div>
        </div>
      </div>

      {/* ── Revenue Chart & Sales Breakdown Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Monthly Revenue Bar Chart (2 columns) */}
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-6 shadow-sm lg:col-span-2">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                <i className="ri-bar-chart-fill text-accent" /> Revenue & Performance Analytics
              </h2>
              <p className="text-xs text-foreground/50">Monthly gross sales trends over last 6 months</p>
            </div>
            <span className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
              Monthly View
            </span>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-56 flex items-end justify-between gap-4 pt-6 pb-2 px-2 border-b border-border-theme/50">
            {chartData.map((item, idx) => {
              const heightPercent = Math.max(12, Math.round((item.revenue / maxRevenueInChart) * 100));
              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <div className="text-[10px] font-mono font-bold text-accent opacity-0 group-hover:opacity-100 transition">
                    ₹{item.revenue.toLocaleString()}
                  </div>
                  <div
                    style={{ height: `${heightPercent}%` }}
                    className="w-full max-w-[42px] bg-gradient-to-t from-accent/40 to-accent rounded-t-xl group-hover:brightness-125 transition-all duration-300 relative shadow-sm"
                  />
                  <span className="text-[10px] font-bold text-foreground/60 tracking-wider">
                    {item.month}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between text-xs font-semibold text-foreground/60">
            <span className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-accent" /> Revenue Growth Rate: <strong className="text-foreground">+18.5%</strong>
            </span>
            <span className="font-mono text-accent">Total Orders Tracked: {orders?.total || 0}</span>
          </div>
        </div>

        {/* Order Status Donut / Breakdown (1 column) */}
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-5 shadow-sm">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
            <i className="ri-pie-chart-line text-accent" /> Order Status Metrics
          </h2>

          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-amber-500/10 text-amber-500 border border-amber-500/20 flex items-center justify-center text-sm font-black">
                  <i className="ri-time-line" />
                </div>
                <span className="text-xs font-bold text-foreground">Processing</span>
              </div>
              <span className="text-xs font-mono font-black text-amber-500">{orders?.processing || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 flex items-center justify-center text-sm font-black">
                  <i className="ri-truck-line" />
                </div>
                <span className="text-xs font-bold text-foreground">Shipped</span>
              </div>
              <span className="text-xs font-mono font-black text-blue-500">{orders?.shipped || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 flex items-center justify-center text-sm font-black">
                  <i className="ri-checkbox-circle-line" />
                </div>
                <span className="text-xs font-bold text-foreground">Delivered</span>
              </div>
              <span className="text-xs font-mono font-black text-emerald-500">{orders?.delivered || 0}</span>
            </div>

            <div className="flex items-center justify-between p-3.5 bg-red-500/5 border border-red-500/20 rounded-2xl">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 flex items-center justify-center text-sm font-black">
                  <i className="ri-close-circle-line" />
                </div>
                <span className="text-xs font-bold text-red-500">Cancelled</span>
              </div>
              <span className="text-xs font-mono font-black text-red-500">{orders?.cancelled || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Top Best Selling Products & Recent Orders Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Best Selling Products */}
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <i className="ri-award-line text-amber-500" /> Best Performing Products
            </h2>
            <button
              onClick={() => navigate("/admin/products")}
              className="text-xs font-bold text-accent hover:underline cursor-pointer"
            >
              View Catalog →
            </button>
          </div>

          <div className="space-y-3">
            {topProducts?.length > 0 ? (
              topProducts.map((p) => {
                const primaryImg = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;
                return (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/admin/products/${p._id}`)}
                    className="p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-accent transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-12 h-14 rounded-xl overflow-hidden border border-border-theme shrink-0 bg-surface">
                        {primaryImg ? (
                          <img src={primaryImg} alt={p.title} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/30">
                            <i className="ri-image-line" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-foreground truncate">{p.title}</p>
                        <p className="text-[10px] text-foreground/50">{p.category?.name || "Product"}</p>
                        <div className="flex items-center gap-1 text-[10px] text-amber-500 font-bold mt-0.5">
                          <i className="ri-star-fill" /> {p.rating || 4.5} ({p.numReviews || 0} reviews)
                        </div>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <p className="text-xs font-black text-foreground">
                        ₹{(p.price?.salePrice || p.price?.mrp || 0).toLocaleString()}
                      </p>
                      <span className="text-[10px] font-bold text-emerald-500">
                        {p.stock} in stock
                      </span>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-foreground/40 italic py-6 text-center">No products found.</p>
            )}
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <i className="ri-exchange-line text-accent" /> Recent Transactions
            </h2>
            <button
              onClick={() => navigate("/admin/orders")}
              className="text-xs font-bold text-accent hover:underline cursor-pointer"
            >
              All Orders →
            </button>
          </div>

          <div className="space-y-3">
            {recentOrders?.length > 0 ? (
              recentOrders.map((ord) => (
                <div
                  key={ord._id}
                  onClick={() => navigate(`/orders/${ord._id}`)}
                  className="p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-accent transition"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-accent/20 border border-accent/40 flex items-center justify-center text-accent font-black text-xs shrink-0">
                      {(ord.user?.fullname || "C")[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-foreground">{ord.user?.fullname || "Customer"}</p>
                      <p className="text-[10px] font-mono text-accent">
                        #{ord.orderId || ord._id.slice(-6).toUpperCase()} • {new Date(ord.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono">
                    <p className="text-xs font-black text-foreground">₹{ord.totalPrice?.toLocaleString()}</p>
                    <span
                      className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                        ord.status === "Delivered" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                      }`}
                    >
                      {ord.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-foreground/40 italic py-6 text-center">No orders recorded yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Users Details Modal ── */}
      {showActiveUsersModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border-theme pb-4 shrink-0">
              <div>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <i className="ri-user-heart-line text-emerald-500" /> Active Users Online ({users?.activeUsersList?.length || 0})
                </h2>
                <p className="text-xs text-foreground/50">Realtime users logged into the platform</p>
              </div>
              <button
                onClick={() => setShowActiveUsersModal(false)}
                className="text-foreground/40 hover:text-foreground text-xl cursor-pointer"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {users?.activeUsersList?.length > 0 ? (
                users.activeUsersList.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => {
                      setShowActiveUsersModal(false);
                      navigate(`/admin/users/${u._id}`);
                    }}
                    className="p-4 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-accent transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/40 bg-surface flex items-center justify-center font-black text-accent">
                          {u.profilePic ? (
                            <img src={u.profilePic} alt={u.fullname} className="w-full h-full object-cover" />
                          ) : (
                            <span>{(u.fullname || "U")[0].toUpperCase()}</span>
                          )}
                        </div>
                        <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-surface" />
                      </div>

                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-extrabold text-xs text-foreground">{u.fullname || "User"}</p>
                          <span
                            className={`text-[9px] font-black uppercase px-2 py-0.5 rounded ${
                              u.role === "admin"
                                ? "bg-red-500/10 text-red-500"
                                : u.role === "seller"
                                ? "bg-amber-500/10 text-amber-500"
                                : "bg-blue-500/10 text-blue-500"
                            }`}
                          >
                            {u.role}
                          </span>
                        </div>
                        <p className="text-[11px] text-foreground/60">{u.email}</p>
                      </div>
                    </div>

                    <div className="text-right text-[11px] font-mono text-foreground/50">
                      Last Active: {new Date(u.updatedAt || u.createdAt).toLocaleTimeString()}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-xs text-foreground/40 italic py-8 text-center">No active users logged in.</p>
              )}
            </div>

            <div className="pt-4 border-t border-border-theme flex justify-end shrink-0">
              <button
                onClick={() => setShowActiveUsersModal(false)}
                className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs cursor-pointer"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
