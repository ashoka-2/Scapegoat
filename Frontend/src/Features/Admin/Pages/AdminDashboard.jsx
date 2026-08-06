import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { useAdmin } from "../Hooks/useAdmin";
import socket from "../../../utils/socket";
import { addToast } from "../../../utils/toast.slice";
import AdminDashboardSkeleton from "../Components/Skeletons/AdminDashboardSkeleton";
import OrderReceiptModal from "../Components/OrderReceiptModal";

const AdminDashboard = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { stats, loading, fetchDashboardStats } = useAdmin();
  const [showActiveUsersModal, setShowActiveUsersModal] = useState(false);
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Calendar & Timeframe Filters for Performance Analytics
  const [timeframe, setTimeframe] = useState("monthly");
  const [activeMetric, setActiveMetric] = useState("revenue"); // "revenue" | "orders" | "wishlist" | "cart" | "users"
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [selectedBarDate, setSelectedBarDate] = useState(null);
  const [selectedBarTab, setSelectedBarTab] = useState(null); // "revenue" | "orders" | "users" | "wishlist" | "cart"

  const getImageUrl = (img) => {
    if (!img) return "https://placehold.co/100x100?text=No+Image";
    if (typeof img === "string") return img;
    if (typeof img === "object" && img.url) return img.url;
    return "https://placehold.co/100x100?text=No+Image";
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await fetchDashboardStats({ timeframe, startDate, endDate });
      dispatch(
        addToast({
          message: "Dashboard overview refreshed successfully! 🎉",
          type: "success",
        }),
      );
    } catch (err) {
      dispatch(
        addToast({
          message: "Failed to refresh dashboard stats.",
          type: "error",
        }),
      );
    } finally {
      setTimeout(() => setIsRefreshing(false), 500);
    }
  };

  useEffect(() => {
    fetchDashboardStats({ timeframe, startDate, endDate });

    const onRealtimeUpdate = () => {
      fetchDashboardStats({ timeframe, startDate, endDate });
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
  }, [timeframe, startDate, endDate]);

  const handleApplyDateFilter = (e) => {
    e.preventDefault();
    fetchDashboardStats({ timeframe, startDate, endDate });
  };

  const handleClearDateFilter = () => {
    setStartDate("");
    setEndDate("");
    fetchDashboardStats({ timeframe, startDate: "", endDate: "" });
  };

  if (loading && !stats) {
    return <AdminDashboardSkeleton />;
  }

  const {
    users,
    products,
    orders,
    catalog,
    analytics,
    chartData = [],
    topProducts = [],
    recentOrders = [],
  } = stats || {};

  const maxRevenueInChart = Math.max(
    ...chartData.map((c) => c.revenue || 1),
    100,
  );

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
            Active Online Shoppers ({users?.activeNow || 0})
          </button>

          <button
            disabled={isRefreshing}
            onClick={handleRefresh}
            className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition cursor-pointer flex items-center gap-2 shadow-sm disabled:opacity-50"
          >
            <i
              className={`ri-refresh-line text-sm ${isRefreshing ? "animate-spin" : ""}`}
            />
            {isRefreshing ? "Refreshing..." : "Refresh"}
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
            <span>
              Today:{" "}
              <strong className="text-emerald-500">
                ₹{(orders?.revenueToday || 0).toLocaleString()}
              </strong>
            </span>
            <span className="text-emerald-500 font-bold flex items-center">
              <i className="ri-arrow-up-line" /> Verified
            </span>
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
            <span>
              Processing:{" "}
              <strong className="text-amber-500">
                {orders?.processing || 0}
              </strong>
            </span>
            <span>
              Today:{" "}
              <strong className="text-accent">+{orders?.today || 0}</strong>
            </span>
          </div>
        </div>

        {/* Registered Users Card */}
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
            <span>
              Buyers:{" "}
              <strong className="text-foreground">{users?.buyers || 0}</strong>
            </span>
            <span>
              Sellers:{" "}
              <strong className="text-amber-500">{users?.sellers || 0}</strong>
            </span>
          </div>
        </div>

        {/* Catalog Products Card */}
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
            <span>
              Active:{" "}
              <strong className="text-emerald-500">
                {products?.active || 0}
              </strong>
            </span>
            <span>
              Categories: <strong>{catalog?.categories || 0}</strong>
            </span>
          </div>
        </div>
      </div>

      {/* ── Revenue & Performance Analytics Section (Strictly MongoDB Aggregation Data) ── */}
      <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 space-y-6 shadow-sm">
        {/* Top Title & Filters Bar */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-border-theme/60 pb-5">
          <div>
            <h2 className="text-base font-black uppercase tracking-wider text-foreground flex items-center gap-2">
              <i className="ri-bar-chart-grouped-line text-accent text-lg" /> Revenue Track & Real Order Performance
            </h2>
            <p className="text-xs text-foreground/50 mt-0.5 font-medium">
              Strictly verified MongoDB aggregation pipeline data (No simulated data)
            </p>
          </div>

          {/* Timeframe Presets & Calendar Inputs */}
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            <div className="flex items-center bg-background border border-border-theme rounded-xl p-1 gap-1">
              {[
                { id: "daily", label: "Daily" },
                { id: "monthly", label: "Monthly" },
                { id: "yearly", label: "Yearly" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTimeframe(t.id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    timeframe === t.id
                      ? "bg-accent text-accent-content shadow-xs"
                      : "text-foreground/70 hover:text-foreground"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {/* Custom Date Range Calendar Inputs */}
            <form
              onSubmit={handleApplyDateFilter}
              className="flex items-center gap-2"
            >
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-background border border-border-theme rounded-xl px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                title="Start Date"
              />
              <span className="text-xs text-foreground/40 font-bold">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="bg-background border border-border-theme rounded-xl px-2.5 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-accent"
                title="End Date"
              />
              <button
                type="submit"
                className="px-3 py-1.5 rounded-xl bg-accent/10 text-accent border border-accent/20 font-bold text-xs hover:bg-accent hover:text-accent-content transition cursor-pointer"
              >
                Apply
              </button>
              {(startDate || endDate) && (
                <button
                  type="button"
                  onClick={handleClearDateFilter}
                  className="px-2.5 py-1.5 rounded-xl bg-red-500/10 text-red-500 border border-red-500/20 font-bold text-xs hover:bg-red-500 hover:text-white transition cursor-pointer"
                >
                  Clear
                </button>
              )}
            </form>
          </div>
        </div>

        {/* Metric Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {[
            { id: "revenue", label: "Gross Revenue", icon: "ri-money-rupee-circle-line", color: "text-emerald-500" },
            { id: "orders", label: "Order Count", icon: "ri-shopping-bag-3-line", color: "text-amber-500" },
            { id: "users", label: "New Users", icon: "ri-user-add-line", color: "text-blue-500" },
            { id: "wishlist", label: "Wishlist Adds", icon: "ri-heart-3-line", color: "text-rose-500" },
            { id: "cart", label: "Cart Adds", icon: "ri-shopping-cart-2-line", color: "text-purple-500" },
          ].map((m) => (
            <button
              key={m.id}
              type="button"
              onClick={() => setActiveMetric(m.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition border cursor-pointer ${
                activeMetric === m.id
                  ? "bg-accent/15 border-accent text-accent shadow-xs"
                  : "bg-background/60 border-border-theme/60 text-foreground/60 hover:text-foreground"
              }`}
            >
              <i className={`${m.icon} ${m.color} text-sm`} />
              <span>{m.label}</span>
            </button>
          ))}
        </div>

        {/* Metric Summary Statistics Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-background/40 p-4 rounded-2xl border border-border-theme/40 text-xs">
          <div>
            <span className="text-[10px] font-extrabold uppercase text-foreground/50 tracking-wider">
              Total {activeMetric.toUpperCase()} (Selected Range)
            </span>
            <p className="text-lg font-mono font-black text-foreground mt-0.5">
              {activeMetric === "revenue"
                ? `₹${chartData.reduce((sum, item) => sum + (item.revenue || 0), 0).toLocaleString()}`
                : chartData.reduce((sum, item) => sum + (item[activeMetric === "users" ? "newUsers" : activeMetric === "wishlist" ? "wishlistAdds" : activeMetric === "cart" ? "cartItems" : "orders"] || 0), 0).toLocaleString()}
            </p>
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase text-foreground/50 tracking-wider">
              Average Per Period ({timeframe})
            </span>
            <p className="text-lg font-mono font-black text-accent mt-0.5">
              {activeMetric === "revenue"
                ? `₹${Math.round(chartData.reduce((sum, item) => sum + (item.revenue || 0), 0) / (chartData.length || 1)).toLocaleString()}`
                : Math.round(chartData.reduce((sum, item) => sum + (item[activeMetric === "users" ? "newUsers" : activeMetric === "wishlist" ? "wishlistAdds" : activeMetric === "cart" ? "cartItems" : "orders"] || 0), 0) / (chartData.length || 1)).toLocaleString()}
            </p>
          </div>
          <div className="col-span-2 sm:col-span-1">
            <span className="text-[10px] font-extrabold uppercase text-foreground/50 tracking-wider">
              Total Timeframe Intervals
            </span>
            <p className="text-lg font-mono font-black text-foreground mt-0.5">
              {chartData.length} {timeframe} records
            </p>
          </div>
        </div>

        {/* Performance Visualization Graph */}
        {chartData.length > 0 ? (
          <div className="h-72 flex items-end justify-between gap-3 pt-12 pb-6 px-3 border-b border-border-theme/50 overflow-x-auto scrollbar-none relative">
            {chartData.map((item, idx) => {
              const val =
                activeMetric === "revenue"
                  ? item.revenue || 0
                  : activeMetric === "orders"
                  ? item.orders || 0
                  : activeMetric === "users"
                  ? item.newUsers || 0
                  : activeMetric === "wishlist"
                  ? item.wishlistAdds || 0
                  : item.cartItems || 0;

              const maxVal = Math.max(
                ...chartData.map((i) =>
                  activeMetric === "revenue"
                    ? i.revenue || 0
                    : activeMetric === "orders"
                    ? i.orders || 0
                    : activeMetric === "users"
                    ? i.newUsers || 0
                    : activeMetric === "wishlist"
                    ? i.wishlistAdds || 0
                    : i.cartItems || 0
                ),
                1
              );

              // If val is 0, heightPercent is 0 (shows as baseline dot). Otherwise scale between 16% and 100%.
              const heightPercent = val === 0 ? 0 : Math.max(16, Math.round((val / maxVal) * 100));
              const isSelected = selectedBarDate === item.dateLabel;

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedBarDate(isSelected ? null : item.dateLabel)}
                  className={`flex-1 min-w-[55px] flex flex-col items-center gap-2 group h-full justify-end relative cursor-pointer transition-all ${
                    isSelected ? "scale-105" : "hover:scale-102"
                  }`}
                  title={`Click to inspect specific items for ${item.dateLabel}`}
                >
                  {/* Floating Backdrop Tooltip (Never clipped, z-30) */}
                  <div className="absolute -top-16 hidden group-hover:flex flex-col items-center bg-surface/95 border border-accent/40 px-3 py-1.5 rounded-xl shadow-2xl z-30 whitespace-nowrap text-[10px] font-mono pointer-events-none animate-in fade-in backdrop-blur-xl">
                    <span className="font-extrabold text-foreground">{item.dateLabel}</span>
                    <span className="text-accent font-bold">
                      {val === 0
                        ? "0 Recorded"
                        : activeMetric === "revenue"
                        ? `₹${val.toLocaleString()}`
                        : `${val.toLocaleString()} ${activeMetric}`}
                    </span>
                    <div className="text-[9px] text-foreground/50">
                      Click to inspect items
                    </div>
                  </div>

                  {/* Top Bar Value Display */}
                  <div className={`text-[10px] font-mono font-bold transition whitespace-nowrap ${isSelected ? "text-accent opacity-100 scale-110" : "text-accent opacity-0 group-hover:opacity-100"}`}>
                    {val === 0 ? "-" : activeMetric === "revenue" ? `₹${val.toLocaleString()}` : val.toLocaleString()}
                  </div>

                  {/* Bar Body */}
                  {val === 0 ? (
                    <div className="h-1.5 w-full max-w-[40px] bg-foreground/15 rounded-full transition-all group-hover:bg-accent/40" />
                  ) : (
                    <div
                      style={{ height: `${heightPercent}%` }}
                      className={`w-full max-w-[48px] rounded-t-xl group-hover:brightness-125 transition-all duration-300 relative shadow-sm ${
                        isSelected
                          ? "ring-2 ring-accent shadow-[0_0_20px_rgba(var(--accent-rgb),0.5)] brightness-125"
                          : ""
                      } ${
                        activeMetric === "revenue"
                          ? "bg-gradient-to-t from-emerald-500/40 to-emerald-500"
                          : activeMetric === "orders"
                          ? "bg-gradient-to-t from-amber-500/40 to-amber-500"
                          : activeMetric === "users"
                          ? "bg-gradient-to-t from-blue-500/40 to-blue-500"
                          : activeMetric === "wishlist"
                          ? "bg-gradient-to-t from-rose-500/40 to-rose-500"
                          : "bg-gradient-to-t from-purple-500/40 to-purple-500"
                      }`}
                    />
                  )}

                  {/* Date Label with ample breathing space */}
                  <span className={`text-[10px] font-mono font-bold tracking-wider truncate max-w-[65px] pt-1 ${isSelected ? "text-accent" : "text-foreground/70"}`}>
                    {item.dateLabel}
                  </span>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-foreground/40 italic bg-background/30 rounded-2xl border border-border-theme/30">
            No MongoDB analytics data recorded for the selected timeframe or date range.
          </div>
        )}

        {/* Selected Interval Detailed Breakdown Drawer / Card with Specific Items */}
        {selectedBarDate && (() => {
          const selectedItem = chartData.find((i) => i.dateLabel === selectedBarDate);
          if (!selectedItem) return null;

          const specificOrders = selectedItem.specificItems?.orders || [];
          const specificUsers = selectedItem.specificItems?.users || [];
          const specificProducts = selectedItem.specificItems?.products || [];

          // Active tab inside breakdown card defaults to activeMetric if not manually overridden
          const currentTab = selectedBarTab || activeMetric;

          return (
            <div className="bg-background/90 border border-accent/40 rounded-2xl p-5 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 mt-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent flex items-center justify-center font-bold">
                    <i className="ri-calendar-check-line text-lg" />
                  </div>
                  <div>
                    <h3 className="text-xs font-black uppercase text-foreground flex items-center gap-2">
                      Interval Analytics Breakdown: <span className="text-accent bg-accent/10 px-2 py-0.5 rounded-lg border border-accent/20">{selectedItem.dateLabel}</span>
                    </h3>
                    <p className="text-[10px] text-foreground/50">
                      Click any metric summary card below to filter specific items for {selectedItem.dateLabel}
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setSelectedBarDate(null);
                    setSelectedBarTab(null);
                  }}
                  className="p-1.5 rounded-lg text-foreground/40 hover:text-foreground hover:bg-surface transition cursor-pointer"
                  title="Close Breakdown"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              {/* 5 Key Metric Summary Cards (Interactive Filter Tabs) */}
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                {/* Gross Revenue Card */}
                <div
                  onClick={() => setSelectedBarTab("revenue")}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
                    currentTab === "revenue" || currentTab === "orders"
                      ? "bg-emerald-500/10 border-emerald-500 shadow-xs"
                      : "bg-surface border-border-theme/50 hover:border-emerald-500/40"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                    <i className="ri-money-rupee-circle-line" /> Gross Revenue
                  </span>
                  <p className="text-sm font-mono font-black text-foreground">
                    ₹{(selectedItem.revenue || 0).toLocaleString()}
                  </p>
                </div>

                {/* Orders Card */}
                <div
                  onClick={() => setSelectedBarTab("orders")}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
                    currentTab === "orders"
                      ? "bg-amber-500/10 border-amber-500 shadow-xs"
                      : "bg-surface border-border-theme/50 hover:border-amber-500/40"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-amber-500 tracking-wider flex items-center gap-1">
                    <i className="ri-shopping-bag-3-line" /> Orders
                  </span>
                  <p className="text-sm font-mono font-black text-foreground">
                    {selectedItem.orders || 0}
                  </p>
                  {selectedItem.deliveredOrders > 0 && (
                    <span className="text-[9px] text-emerald-500 font-semibold block">
                      {selectedItem.deliveredOrders} Delivered
                    </span>
                  )}
                </div>

                {/* New Users Card */}
                <div
                  onClick={() => setSelectedBarTab("users")}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
                    currentTab === "users"
                      ? "bg-blue-500/10 border-blue-500 shadow-xs"
                      : "bg-surface border-border-theme/50 hover:border-blue-500/40"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-blue-500 tracking-wider flex items-center gap-1">
                    <i className="ri-user-add-line" /> New Users
                  </span>
                  <p className="text-sm font-mono font-black text-foreground">
                    +{selectedItem.newUsers || 0}
                  </p>
                </div>

                {/* Wishlist Adds Card */}
                <div
                  onClick={() => setSelectedBarTab("wishlist")}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-1 ${
                    currentTab === "wishlist"
                      ? "bg-rose-500/10 border-rose-500 shadow-xs"
                      : "bg-surface border-border-theme/50 hover:border-rose-500/40"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-rose-500 tracking-wider flex items-center gap-1">
                    <i className="ri-heart-3-line" /> Wishlist Adds
                  </span>
                  <p className="text-sm font-mono font-black text-foreground">
                    {selectedItem.wishlistAdds || 0}
                  </p>
                </div>

                {/* Cart Adds Card */}
                <div
                  onClick={() => setSelectedBarTab("cart")}
                  className={`p-3 rounded-xl border transition cursor-pointer space-y-1 col-span-2 sm:col-span-1 ${
                    currentTab === "cart"
                      ? "bg-purple-500/10 border-purple-500 shadow-xs"
                      : "bg-surface border-border-theme/50 hover:border-purple-500/40"
                  }`}
                >
                  <span className="text-[10px] font-extrabold uppercase text-purple-500 tracking-wider flex items-center gap-1">
                    <i className="ri-shopping-cart-2-line" /> Cart Adds
                  </span>
                  <p className="text-sm font-mono font-black text-foreground">
                    {selectedItem.cartItems || 0}
                  </p>
                </div>
              </div>

              {/* ── Specific Items List Display for Selected Tab ── */}
              <div className="space-y-4 pt-3 border-t border-border-theme/40">
                {/* 1. Orders Tab Content */}
                {(currentTab === "revenue" || currentTab === "orders") && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-amber-500 flex items-center gap-1.5">
                        <i className="ri-shopping-bag-3-line" /> Specific Orders Placed on {selectedItem.dateLabel} ({specificOrders.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/orders")}
                        className="text-[11px] font-bold text-accent hover:underline cursor-pointer flex items-center gap-1"
                      >
                        View in Admin Orders Page →
                      </button>
                    </div>

                    {specificOrders.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {specificOrders.map((ord) => (
                          <div
                            key={ord._id}
                            className="bg-surface p-3.5 rounded-2xl border border-border-theme space-y-2 text-xs shadow-xs"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-foreground">
                                #{ord._id.slice(-6).toUpperCase()}
                              </span>
                              <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase ${
                                ord.status === "Delivered"
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                                  : ord.status === "Shipped"
                                  ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                                  : "bg-amber-500/10 text-amber-500 border border-amber-500/20"
                              }`}>
                                {ord.status}
                              </span>
                            </div>

                            <div className="flex items-center justify-between text-[11px] text-foreground/70">
                              <span>Buyer: <strong className="text-foreground">{ord.user?.fullname || ord.user?.email || "Customer"}</strong></span>
                              <span className="font-mono font-black text-emerald-500 text-xs">
                                ₹{(ord.totalPrice || 0).toLocaleString()}
                              </span>
                            </div>

                            {/* Order Items Preview */}
                            {ord.orderItems?.length > 0 && (
                              <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
                                {ord.orderItems.map((item, i) => (
                                  <img
                                    key={i}
                                    src={getImageUrl(item.product?.images?.[0] || item.image)}
                                    alt={item.product?.title || "Item"}
                                    className="w-7 h-7 rounded-md object-cover border border-border-theme/40 bg-background"
                                    title={item.product?.title}
                                  />
                                ))}
                              </div>
                            )}

                            <div className="pt-2 border-t border-border-theme/40 flex justify-end">
                              <button
                                type="button"
                                onClick={() => setSelectedReceiptOrder(ord)}
                                className="px-3 py-1 rounded-xl bg-accent/10 text-accent border border-accent/20 text-[10px] font-bold hover:bg-accent hover:text-accent-content transition cursor-pointer"
                              >
                                Inspect Full Receipt
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-foreground/40 italic bg-surface/50 rounded-xl border border-border-theme/40">
                        No specific order records logged for {selectedItem.dateLabel}.
                      </div>
                    )}
                  </div>
                )}

                {/* 2. New Users Tab Content */}
                {currentTab === "users" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-blue-500 flex items-center gap-1.5">
                        <i className="ri-user-add-line" /> Specific Users Registered on {selectedItem.dateLabel} ({specificUsers.length})
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/users")}
                        className="text-[11px] font-bold text-blue-500 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        View in Admin Users Page →
                      </button>
                    </div>

                    {specificUsers.length > 0 ? (
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {specificUsers.map((u) => (
                          <div
                            key={u._id}
                            onClick={() => navigate(`/admin/users/${u._id}`)}
                            className="bg-surface p-3 rounded-2xl border border-border-theme flex items-center justify-between gap-3 text-xs hover:border-accent cursor-pointer transition shadow-xs"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <div className="w-8 h-8 rounded-xl bg-accent/15 text-accent font-bold flex items-center justify-center text-xs shrink-0">
                                {u.fullname?.charAt(0)?.toUpperCase() || "U"}
                              </div>
                              <div className="min-w-0">
                                <span className="font-bold text-foreground block truncate">
                                  {u.fullname || "User"}
                                </span>
                                <span className="text-[10px] text-foreground/50 truncate block">
                                  {u.email}
                                </span>
                              </div>
                            </div>
                            <span className="px-2 py-0.5 rounded-md text-[9px] font-bold uppercase bg-background border border-border-theme text-foreground/70 shrink-0">
                              {u.role}
                            </span>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="py-6 text-center text-xs text-foreground/40 italic bg-surface/50 rounded-xl border border-border-theme/40">
                        No new user signups logged for {selectedItem.dateLabel}.
                      </div>
                    )}
                  </div>
                )}

                {/* 3. Wishlist Tab Content */}
                {currentTab === "wishlist" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-rose-500 flex items-center gap-1.5">
                        <i className="ri-heart-3-line" /> Wishlist Activity Recorded for {selectedItem.dateLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/products")}
                        className="text-[11px] font-bold text-rose-500 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        View in Admin Products Page →
                      </button>
                    </div>

                    <div className="p-4 bg-surface rounded-2xl border border-border-theme space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/70">Total Wishlist Additions:</span>
                        <strong className="text-rose-500 text-sm font-mono">{selectedItem.wishlistAdds || 0} items</strong>
                      </div>
                      <p className="text-[11px] text-foreground/50">
                        Wishlist additions summarize customer product saves during {selectedItem.dateLabel}.
                      </p>
                    </div>
                  </div>
                )}

                {/* 4. Cart Tab Content */}
                {currentTab === "cart" && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold uppercase text-purple-500 flex items-center gap-1.5">
                        <i className="ri-shopping-cart-2-line" /> Cart Activity Recorded for {selectedItem.dateLabel}
                      </span>
                      <button
                        type="button"
                        onClick={() => navigate("/admin/products")}
                        className="text-[11px] font-bold text-purple-500 hover:underline cursor-pointer flex items-center gap-1"
                      >
                        View in Admin Products Page →
                      </button>
                    </div>

                    <div className="p-4 bg-surface rounded-2xl border border-border-theme space-y-2 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="text-foreground/70">Total Cart Items Added:</span>
                        <strong className="text-purple-500 text-sm font-mono">{selectedItem.cartItems || 0} items</strong>
                      </div>
                      <p className="text-[11px] text-foreground/50">
                        Cart items summarize active cart additions during {selectedItem.dateLabel}.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Bar */}
              <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-border-theme/30">
                <button
                  type="button"
                  onClick={() => navigate("/admin/orders")}
                  className="px-3 py-1.5 rounded-xl bg-accent/10 text-accent border border-accent/20 text-[11px] font-bold hover:bg-accent hover:text-accent-content transition cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-shopping-bag-3-line" /> View in Admin Orders Page →
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/products")}
                  className="px-3 py-1.5 rounded-xl bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-[11px] font-bold hover:bg-emerald-500 hover:text-white transition cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-box-3-line" /> View in Admin Products Page →
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/admin/users")}
                  className="px-3 py-1.5 rounded-xl bg-blue-500/10 text-blue-500 border border-blue-500/20 text-[11px] font-bold hover:bg-blue-500 hover:text-white transition cursor-pointer flex items-center gap-1.5"
                >
                  <i className="ri-group-line" /> View in Admin Users Page →
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedBarDate(null);
                    setSelectedBarTab(null);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-surface text-foreground/60 border border-border-theme text-[11px] font-bold hover:text-foreground transition cursor-pointer ml-auto"
                >
                  Deselect
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* ── Top Best Selling Products & Recent Transactions Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Best Selling Products (Aggregated Sales) */}
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                <i className="ri-award-line text-amber-500" /> Best Performing
                Products (Real Sales)
              </h2>
              <p className="text-[10px] text-foreground/50">
                Ranked by total quantity sold in completed customer orders
              </p>
            </div>
            <button
              onClick={() => navigate("/admin/products")}
              className="text-xs font-bold text-accent hover:underline cursor-pointer"
            >
              View Catalog →
            </button>
          </div>

          <div className="space-y-3">
            {topProducts?.length > 0 ? (
              topProducts.map((p, idx) => {
                const primaryImg =
                  p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;
                const unitPrice =
                  p.unitPrice ??
                  (typeof p.sellingPrice === "number"
                    ? p.sellingPrice
                    : (p.sellingPrice?.amount ??
                      p.maxPrice?.amount ??
                      p.price?.amount ??
                      p.price?.salePrice ??
                      p.price?.mrp ??
                      (typeof p.price === "number" ? p.price : 0) ??
                      p.variants?.[0]?.price?.amount ??
                      0));

                return (
                  <div
                    key={p._id || idx}
                    onClick={() => navigate(`/admin/products/${p._id}`)}
                    className="p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-accent transition"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-6 h-6 rounded-full bg-amber-500/10 text-amber-500 font-mono font-black text-xs flex items-center justify-center shrink-0">
                        #{idx + 1}
                      </span>
                      <div className="w-12 h-14 rounded-xl overflow-hidden border border-border-theme shrink-0 bg-surface">
                        {primaryImg ? (
                          <img
                            src={primaryImg}
                            alt={p.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-foreground/30">
                            <i className="ri-image-line" />
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="font-extrabold text-xs text-foreground truncate max-w-[180px]">
                          {p.title}
                        </p>
                        <p className="text-[10px] text-foreground/50">
                          {p.category?.name || "Category"}
                        </p>
                        <span className="text-[10px] font-bold text-accent">
                          ₹{unitPrice.toLocaleString()} per unit
                        </span>
                      </div>
                    </div>

                    <div className="text-right shrink-0 font-mono">
                      <p className="text-xs font-black text-emerald-500">
                        {p.totalSold || 0} Sold
                      </p>
                      <p className="text-[10px] font-bold text-foreground/60">
                        ₹{(p.totalRevenueEarned || 0).toLocaleString()} Rev
                      </p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-foreground/40 italic py-6 text-center">
                No product sales recorded yet.
              </p>
            )}
          </div>
        </div>

        {/* Recent Transactions List (Click to Open Order Receipt Modal) */}
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm">
          <div className="flex items-center justify-between border-b border-border-theme/40 pb-3">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground flex items-center gap-2">
                <i className="ri-receipt-line text-accent" /> Recent
                Transactions
              </h2>
              <p className="text-[10px] text-foreground/50">
                Click any transaction card to open full printable order receipt
              </p>
            </div>
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
                  onClick={() => setSelectedReceiptOrder(ord)}
                  className="p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center justify-between gap-4 cursor-pointer hover:border-accent transition group"
                  title="Click to view printable receipt invoice"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-accent/10 border border-accent/30 flex items-center justify-center text-accent font-black text-xs shrink-0 group-hover:scale-105 transition">
                      <i className="ri-file-list-3-line text-base" />
                    </div>
                    <div>
                      <p className="font-extrabold text-xs text-foreground group-hover:text-accent transition">
                        {ord.user?.fullname || "Customer"}
                      </p>
                      <p className="text-[10px] font-mono text-foreground/50">
                        #{ord.orderId || ord._id.slice(-6).toUpperCase()} •{" "}
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>

                  <div className="text-right font-mono flex items-center gap-3">
                    <div>
                      <p className="text-xs font-black text-foreground">
                        ₹{ord.totalPrice?.toLocaleString()}
                      </p>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          ord.status === "Delivered"
                            ? "bg-emerald-500/10 text-emerald-500"
                            : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>
                    <i className="ri-external-link-line text-foreground/40 group-hover:text-accent text-sm" />
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-foreground/40 italic py-6 text-center">
                No transactions recorded yet.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* ── Active Shoppers Real-time Modal (Excluding Admin, showing devices) ── */}
      {showActiveUsersModal && (
        <div className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-2xl animate-in fade-in zoom-in-95 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-border-theme pb-4 shrink-0">
              <div>
                <h2 className="text-lg font-black text-foreground flex items-center gap-2">
                  <i className="ri-user-heart-line text-emerald-500" />{" "}
                  Real-time Online Shoppers (
                  {users?.activeUsersList?.length || 0})
                </h2>
                <p className="text-xs text-foreground/50">
                  Active buyers & sellers browsing the site (Excludes Admins)
                </p>
              </div>
              <button
                onClick={() => setShowActiveUsersModal(false)}
                className="text-foreground/40 hover:text-foreground text-xl cursor-pointer"
              >
                <i className="ri-close-line" />
              </button>
            </div>

            {/* Device breakdown pill summary */}
            {analytics?.devices && (
              <div className="flex items-center gap-3 bg-background/60 p-3 rounded-2xl border border-border-theme/40 text-xs font-bold text-foreground/70">
                <span className="text-[10px] font-black uppercase text-accent tracking-wider">
                  Device Breakdown:
                </span>
                <span className="flex items-center gap-1">
                  <i className="ri-computer-line text-accent" /> Desktop (
                  {analytics.devices.Desktop || 0})
                </span>
                <span className="flex items-center gap-1">
                  <i className="ri-smartphone-line text-emerald-500" /> Mobile (
                  {analytics.devices.Mobile || 0})
                </span>
                <span className="flex items-center gap-1">
                  <i className="ri-tablet-line text-purple-500" /> Tablet (
                  {analytics.devices.Tablet || 0})
                </span>
              </div>
            )}

            <div className="overflow-y-auto space-y-3 pr-1 flex-1">
              {users?.activeUsersList?.length > 0 ? (
                users.activeUsersList.map((u) => {
                  const isGuestUser = u.isGuest || u.role === "guest";

                  return (
                    <div
                      key={u._id}
                      onClick={() => {
                        if (!isGuestUser && u._id) {
                          setShowActiveUsersModal(false);
                          navigate(`/admin/users/${u._id}`);
                        }
                      }}
                      className={`p-4 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center justify-between gap-4 transition ${
                        !isGuestUser
                          ? "cursor-pointer hover:border-accent"
                          : "cursor-default"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div
                            className={`w-10 h-10 rounded-full overflow-hidden border flex items-center justify-center font-black text-xs ${
                              isGuestUser
                                ? "bg-purple-500/10 border-purple-500/30 text-purple-500"
                                : "bg-accent/20 border-accent/40 text-accent"
                            }`}
                          >
                            {isGuestUser ? (
                              <i className="ri-user-shared-line text-lg" />
                            ) : u.profilePic ? (
                              <img
                                src={u.profilePic}
                                alt={u.fullname}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <span>
                                {(u.fullname || "U")[0].toUpperCase()}
                              </span>
                            )}
                          </div>
                          <span className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-surface animate-pulse" />
                        </div>

                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-extrabold text-xs text-foreground">
                              {u.fullname || "Guest Visitor"}
                            </p>
                            <span
                              className={`text-[9px] font-black uppercase px-2 py-0.5 rounded border ${
                                isGuestUser
                                  ? "bg-purple-500/10 text-purple-500 border-purple-500/20"
                                  : u.role === "seller"
                                    ? "bg-amber-500/10 text-amber-500 border-amber-500/20"
                                    : "bg-blue-500/10 text-blue-500 border-blue-500/20"
                              }`}
                            >
                              {isGuestUser ? "Guest" : u.role}
                            </span>
                          </div>
                          <p className="text-[11px] text-foreground/60">
                            {u.email || "Viewing storefront anonymously"}
                          </p>
                        </div>
                      </div>

                      <div className="text-right text-[11px] font-mono text-foreground/60 space-y-0.5">
                        <p className="flex items-center gap-1 justify-end font-bold text-foreground">
                          <i
                            className={
                              u.deviceInfo?.device === "Mobile"
                                ? "ri-smartphone-line text-accent"
                                : "ri-computer-line text-accent"
                            }
                          />
                          {u.deviceInfo?.browser || "Browser"} on{" "}
                          {u.deviceInfo?.model || u.deviceInfo?.os || "PC"}
                        </p>
                        <p className="text-[10px] text-foreground/40">
                          Active:{" "}
                          {u.lastActiveAt
                            ? new Date(u.lastActiveAt).toLocaleTimeString()
                            : "Now"}
                        </p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-xs text-foreground/40 italic py-8 text-center">
                  No active visitors currently browsing the site.
                </p>
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

      {/* ── Order Receipt Modal Triggered from Recent Transactions ── */}
      {selectedReceiptOrder && (
        <OrderReceiptModal
          order={selectedReceiptOrder}
          onClose={() => setSelectedReceiptOrder(null)}
        />
      )}
    </div>
  );
};

export default AdminDashboard;
