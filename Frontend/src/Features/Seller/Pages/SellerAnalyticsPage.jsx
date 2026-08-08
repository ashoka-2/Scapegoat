import React, { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useSellerAnalytics } from "../Hooks/useSellerAnalytics.js";

const StatCard = ({ title, value, subtext, icon, iconBg, valueColor = "text-foreground" }) => (
  <div className="bg-surface border border-border-theme p-5 rounded-2xl space-y-2 shadow-sm relative overflow-hidden group hover:border-accent/50 transition duration-300">
    <div className="flex items-center justify-between">
      <span className="text-xs font-extrabold uppercase tracking-wider text-foreground/60">{title}</span>
      <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center text-lg text-white shadow-sm`}>
        <i className={icon} />
      </div>
    </div>
    <div className={`text-2xl sm:text-3xl font-black ${valueColor}`}>{value}</div>
    {subtext && <p className="text-[11px] font-semibold text-foreground/50">{subtext}</p>}
  </div>
);

const SellerAnalyticsPage = () => {
  const { data, loading, error } = useSellerAnalytics();

  const [searchTerm, setSearchTerm] = useState("");
  const [sortField, setSortField] = useState("totalProfit"); // 'totalProfit' | 'unitsSold' | 'totalRevenue' | 'marginPercent'

  const summary = data.summary || {};
  const mostSold = data.mostSoldProduct;
  const mostProfitable = data.mostProfitableProduct;
  const itemized = data.itemizedPerformance || [];
  const trends = data.dailyTrends || [];

  // Filter & sort itemized products
  const filteredItemized = itemized
    .filter((item) =>
      item.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => (b[sortField] || 0) - (a[sortField] || 0));

  // Max value calculation for trend graph bars
  const maxTrendRevenue = Math.max(...trends.map((t) => t.revenue || 0), 100);

  return (
    <div className="space-y-8 font-sans pb-12 w-full">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-black text-foreground tracking-tight">Profit & Loss Analytics</h1>
            <span className="px-2.5 py-0.5 rounded-full bg-accent/10 border border-accent/30 text-accent font-extrabold text-[10px] uppercase tracking-widest">
              Confidential Seller Data
            </span>
          </div>
          <p className="text-xs text-foreground/60 mt-1">
            Real-time breakdown of cost prices, gross revenue, net profit margins, and itemized product performance.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2.5 rounded-xl bg-surface border border-border-theme hover:border-accent text-xs font-bold text-foreground transition cursor-pointer flex items-center gap-1.5"
          >
            <i className="ri-refresh-line" />
            <span>Refresh</span>
          </button>
          <Link
            to="/products/create"
            className="px-4 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs shadow-md hover:opacity-90 transition cursor-pointer flex items-center gap-1.5"
          >
            <i className="ri-add-line" />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="w-10 h-10 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-xs font-bold text-foreground/60">Calculating Profit & Loss Metrics...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/30 rounded-2xl text-center space-y-3">
          <p className="text-xs font-bold text-rose-500">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="px-4 py-2 rounded-xl bg-rose-500 text-white font-bold text-xs cursor-pointer"
          >
            Try Again
          </button>
        </div>
      ) : (
        <>
          {/* Summary Stat Grid - Full Width Spanning */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard
              title="Gross Revenue"
              value={`₹${(summary.totalRevenue || 0).toLocaleString()}`}
              subtext={`Across ${summary.totalOrders || 0} customer orders`}
              icon="ri-wallet-3-line"
              iconBg="bg-blue-600"
              valueColor="text-blue-500"
            />
            <StatCard
              title="Total Cost (COGS)"
              value={`₹${(summary.totalCost || 0).toLocaleString()}`}
              subtext={`Confidential Inventory Cost`}
              icon="ri-coins-line"
              iconBg="bg-amber-600"
              valueColor="text-amber-500"
            />
            <StatCard
              title="Net Profit / Loss"
              value={`₹${(summary.netProfit || 0).toLocaleString()}`}
              subtext={summary.netProfit >= 0 ? "Positive Net Earnings" : "Net Loss Incurred"}
              icon={summary.netProfit >= 0 ? "ri-line-chart-line" : "ri-funds-line"}
              iconBg={summary.netProfit >= 0 ? "bg-emerald-600" : "bg-rose-600"}
              valueColor={summary.netProfit >= 0 ? "text-emerald-500" : "text-rose-500"}
            />
            <StatCard
              title="Profit Margin"
              value={`${summary.overallMargin || 0}%`}
              subtext="Average Profit Return Ratio"
              icon="ri-percent-line"
              iconBg="bg-purple-600"
              valueColor="text-purple-500"
            />
            <StatCard
              title="Units Sold"
              value={(summary.totalUnitsSold || 0).toLocaleString()}
              subtext="Total Products Dispatched"
              icon="ri-shopping-bag-3-line"
              iconBg="bg-cyan-600"
              valueColor="text-cyan-500"
            />
          </div>

          {/* Top Performance Highlights Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Most Sold Product (Volume Leader) */}
            <div className="bg-surface border border-border-theme rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-amber-500/10 text-amber-500 text-lg">🏆</span>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">Most Sold Product</h3>
                    <p className="text-[11px] text-foreground/60">Highest sales volume leader</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-500 border border-amber-500/30 text-[10px] font-black uppercase tracking-wider">
                  Volume Leader
                </span>
              </div>

              {mostSold && mostSold.unitsSold > 0 ? (
                <div className="flex items-center gap-4 bg-background/60 border border-border-theme p-4 rounded-xl">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface shrink-0 border border-border-theme">
                    {mostSold.image ? (
                      <img src={mostSold.image} alt={mostSold.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-foreground/40">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="font-bold text-xs text-foreground truncate">{mostSold.title}</h4>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-extrabold text-accent">{mostSold.unitsSold} Units Sold</span>
                      <span className="text-foreground/40">•</span>
                      <span className="font-bold text-foreground/80">₹{mostSold.totalRevenue.toLocaleString()} Revenue</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs font-semibold text-foreground/50">
                  No sales recorded yet to determine top volume product.
                </div>
              )}
            </div>

            {/* Most Profitable Product (Margin Leader) */}
            <div className="bg-surface border border-border-theme rounded-2xl p-6 space-y-4 shadow-sm relative overflow-hidden">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-500 text-lg">💎</span>
                  <div>
                    <h3 className="font-extrabold text-sm text-foreground">Most Profitable Product</h3>
                    <p className="text-[11px] text-foreground/60">Generated highest net profit</p>
                  </div>
                </div>
                <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/30 text-[10px] font-black uppercase tracking-wider">
                  Profit Leader
                </span>
              </div>

              {mostProfitable && mostProfitable.totalProfit > 0 ? (
                <div className="flex items-center gap-4 bg-background/60 border border-border-theme p-4 rounded-xl">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-surface shrink-0 border border-border-theme">
                    {mostProfitable.image ? (
                      <img src={mostProfitable.image} alt={mostProfitable.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-foreground/40">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 space-y-1">
                    <h4 className="font-bold text-xs text-foreground truncate">{mostProfitable.title}</h4>
                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-extrabold text-emerald-500">+₹{mostProfitable.totalProfit.toLocaleString()} Profit</span>
                      <span className="text-foreground/40">•</span>
                      <span className="font-bold text-purple-500">{Math.round(mostProfitable.marginPercent)}% Margin</span>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="py-6 text-center text-xs font-semibold text-foreground/50">
                  No sales recorded yet to determine top profit product.
                </div>
              )}
            </div>
          </div>

          {/* Redesigned Sales & Profit Trend Overview Chart */}
          <div className="bg-surface border border-border-theme rounded-2xl p-6 space-y-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <i className="ri-bar-chart-fill text-accent" />
                  <span>Sales & Profit Trend Overview</span>
                </h3>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Daily comparison of Gross Sales Revenue vs Net Profit generated
                </p>
              </div>

              <div className="flex items-center gap-4 text-xs font-bold bg-background/80 border border-border-theme px-3.5 py-1.5 rounded-xl">
                <span className="flex items-center gap-1.5 text-blue-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500 inline-block shadow-sm" />
                  <span>Gross Revenue</span>
                </span>
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block shadow-sm" />
                  <span>Net Profit</span>
                </span>
              </div>
            </div>

            {trends.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <i className="ri-line-chart-line text-3xl text-foreground/30" />
                <p className="text-xs font-bold text-foreground/50">No recent sales data to plot comparison chart.</p>
              </div>
            ) : (
              <div className="relative pt-6 pb-2">
                {/* Horizontal Gridlines */}
                <div className="absolute inset-x-0 top-6 bottom-10 flex flex-col justify-between pointer-events-none opacity-20">
                  <div className="border-b border-dashed border-foreground/50 w-full" />
                  <div className="border-b border-dashed border-foreground/50 w-full" />
                  <div className="border-b border-dashed border-foreground/50 w-full" />
                </div>

                {/* Bars Container - Slender, proportional bar columns */}
                <div className="flex items-end justify-around gap-6 h-64 px-4 overflow-x-auto relative z-10">
                  {trends.map((t, idx) => {
                    const revHeightPercent = Math.max(12, Math.min(100, (t.revenue / maxTrendRevenue) * 100));
                    const profitHeightPercent = Math.max(10, Math.min(100, (Math.max(0, t.profit) / maxTrendRevenue) * 100));

                    return (
                      <div key={idx} className="flex flex-col items-center gap-3 h-full justify-end group shrink-0 min-w-[120px]">
                        {/* Values Overlay Pill */}
                        <div className="flex items-center gap-1.5 text-[10px] font-mono font-bold bg-background/90 border border-border-theme px-2 py-0.5 rounded-full shadow-sm">
                          <span className="text-blue-500">₹{t.revenue.toLocaleString()}</span>
                          <span className="text-foreground/30">/</span>
                          <span className="text-emerald-500">₹{t.profit.toLocaleString()}</span>
                        </div>

                        {/* Dual Bar Column */}
                        <div className="flex items-end justify-center gap-2.5 h-full w-full">
                          {/* Revenue Bar */}
                          <div className="flex flex-col items-center h-full justify-end w-8 sm:w-10">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${revHeightPercent}%` }}
                              transition={{ duration: 0.6, ease: "easeOut" }}
                              className="w-full bg-gradient-to-t from-blue-600 via-blue-500 to-indigo-400 rounded-t-xl shadow-lg shadow-blue-500/20 group-hover:brightness-110 transition relative cursor-pointer"
                            />
                          </div>

                          {/* Profit Bar */}
                          <div className="flex flex-col items-center h-full justify-end w-8 sm:w-10">
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: `${profitHeightPercent}%` }}
                              transition={{ duration: 0.6, delay: 0.1, ease: "easeOut" }}
                              className="w-full bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 rounded-t-xl shadow-lg shadow-emerald-500/20 group-hover:brightness-110 transition relative cursor-pointer"
                            />
                          </div>
                        </div>

                        {/* Date Label */}
                        <div className="text-[11px] font-mono font-bold text-foreground/70 bg-surface px-2 py-0.5 rounded-md border border-border-theme/40">
                          {t.date}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Itemized Product Profit & Loss Breakdown Table */}
          <div className="bg-surface border border-border-theme rounded-2xl p-6 space-y-4 shadow-sm overflow-hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
              <div>
                <h3 className="font-extrabold text-base text-foreground flex items-center gap-2">
                  <i className="ri-table-line text-accent" />
                  <span>Itemized Product Profit & Loss Breakdown</span>
                </h3>
                <p className="text-xs text-foreground/60 mt-0.5">
                  Detailed margins, cost prices, and net profits per catalog product
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground/40 text-xs" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Search product title..."
                    className="w-full pl-8 pr-3 py-1.5 bg-background border border-border-theme rounded-xl text-xs text-foreground placeholder:text-foreground/40 focus:outline-none focus:border-accent"
                  />
                </div>

                <select
                  value={sortField}
                  onChange={(e) => setSortField(e.target.value)}
                  className="px-3 py-1.5 bg-background border border-border-theme rounded-xl text-xs font-bold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="totalProfit">Sort by Total Profit</option>
                  <option value="unitsSold">Sort by Units Sold</option>
                  <option value="totalRevenue">Sort by Total Revenue</option>
                  <option value="marginPercent">Sort by Margin %</option>
                </select>
              </div>
            </div>

            {filteredItemized.length === 0 ? (
              <div className="py-12 text-center text-xs font-semibold text-foreground/50">
                No items match your filter criteria.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-sans border-collapse">
                  <thead>
                    <tr className="border-b border-border-theme text-foreground/60 uppercase tracking-wider font-extrabold text-[10px]">
                      <th className="py-3 px-3">Product</th>
                      <th className="py-3 px-3">Selling Price</th>
                      <th className="py-3 px-3">Cost Price</th>
                      <th className="py-3 px-3">Unit Profit</th>
                      <th className="py-3 px-3 text-center">Units Sold</th>
                      <th className="py-3 px-3">Total Revenue</th>
                      <th className="py-3 px-3">Total Profit</th>
                      <th className="py-3 px-3 text-right">Margin %</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border-theme">
                    {filteredItemized.map((item) => {
                      const isProfitPos = item.totalProfit >= 0;

                      return (
                        <tr key={item._id} className="hover:bg-background/40 transition">
                          <td className="py-3 px-3">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-background shrink-0 border border-border-theme">
                                {item.image ? (
                                  <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center text-[9px] text-foreground/40 font-bold">
                                    No Image
                                  </div>
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-bold text-xs text-foreground truncate max-w-[220px]">{item.title}</p>
                                <p className="text-[10px] text-foreground/50 font-medium">{item.category}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-3 font-semibold text-foreground">₹{item.sellingPrice}</td>
                          <td className="py-3 px-3 font-semibold text-amber-500">
                            {item.costPrice > 0 ? `₹${item.costPrice}` : "—"}
                          </td>
                          <td className={`py-3 px-3 font-bold ${item.unitProfit >= 0 ? "text-emerald-500" : "text-rose-500"}`}>
                            {item.unitProfit >= 0 ? `+₹${item.unitProfit}` : `-₹${Math.abs(item.unitProfit)}`}
                          </td>
                          <td className="py-3 px-3 text-center font-extrabold text-foreground">{item.unitsSold}</td>
                          <td className="py-3 px-3 font-bold text-blue-500">₹{item.totalRevenue.toLocaleString()}</td>
                          <td className={`py-3 px-3 font-extrabold ${isProfitPos ? "text-emerald-500" : "text-rose-500"}`}>
                            {isProfitPos ? `+₹${item.totalProfit.toLocaleString()}` : `-₹${Math.abs(item.totalProfit).toLocaleString()}`}
                          </td>
                          <td className="py-3 px-3 text-right">
                            <span
                              className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black ${
                                isProfitPos
                                  ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
                                  : "bg-rose-500/10 text-rose-500 border border-rose-500/30"
                              }`}
                            >
                              {Math.round(item.marginPercent)}%
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default SellerAnalyticsPage;
