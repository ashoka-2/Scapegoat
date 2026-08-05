import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { Link } from "react-router-dom";
import { useProduct } from "../../Products/Hooks/useProduct";
import { useSeller } from "../Hooks/useSeller";

// Cards showing in the seller dashboard
const GridCard = (name, count, icon = "📊") => {
  return (
    <div className="bg-surface border border-border-theme p-4 rounded-2xl space-y-1 shadow-sm">
      <div className="flex items-center justify-between text-xs font-semibold text-foreground/70">
        <span>{name}</span>
        <span className="text-base">{icon}</span>
      </div>
      <p className="text-2xl font-extrabold text-accent">{count}</p>
    </div>
  );
};

const SellerDashboard = () => {
  const { user } = useSelector((state) => state.auth);
  const { sellerProducts, loading: loadingProducts, handleFetchSellerProducts } = useProduct();
  const { fetchDashboardData } = useSeller();
  const { allCarts, allWishlists, allOrders } = useSelector((state) => state.seller);

  useEffect(() => {
    if (user?._id || user?.id) {
      handleFetchSellerProducts(user._id || user.id);
      fetchDashboardData(user);
    }
  }, [user]);

  const totalProducts = sellerProducts.length;
  const totalOrders = allOrders.length;
  const activeCarts = allCarts.length;
  const totalWishlists = allWishlists.length;
  const totalRevenue = allOrders.reduce((sum, o) => sum + (o.totalPrice || 0), 0);

  return (
    <div className="space-y-8 font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border-theme pb-4">
        <div>
          <h1 className="text-2xl font-extrabold text-foreground">Seller Dashboard</h1>
          <p className="text-xs text-foreground/60 mt-1">
            Welcome back, <strong className="text-accent">{user?.fullname || user?.username}</strong>! Manage your products, catalog, and real-time sales performance.
          </p>
        </div>
        <Link
          to="/products/create"
          className="px-5 py-3 rounded-xl bg-accent text-accent-content font-bold text-xs shadow-md hover:opacity-90 transition cursor-pointer"
        >
          Create New Product
        </Link>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {GridCard("Products", totalProducts, "📦")}
        {GridCard("Orders", totalOrders, "📑")}
        {GridCard("Active Carts", activeCarts, "🛒")}
        {GridCard("Wishlists", totalWishlists, "❤️")}
        {GridCard("Revenue", `₹${totalRevenue.toLocaleString()}`, "💰")}
      </div>

      {/* Seller Products Table / List */}
      <div className="bg-background border border-border-theme rounded-2xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground">Your Products Catalog</h2>
          <span className="text-xs text-foreground/60">{sellerProducts.length} items listed</span>
        </div>

        {loadingProducts ? (
          <div className="py-12 text-center text-xs text-foreground/60 font-semibold animate-pulse">
            Loading products catalog...
          </div>
        ) : sellerProducts.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <p className="text-sm font-semibold text-foreground/60">No products created yet.</p>
            <Link
              to="/products/create"
              className="inline-block px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 text-xs font-bold"
            >
              + Create your first product
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
            {sellerProducts.map((p) => (
              <div
                key={p._id}
                className="bg-surface border border-border-theme p-4 rounded-xl space-y-3 flex flex-col justify-between"
              >
                <div className="flex space-x-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-background shrink-0 border border-border-theme">
                    {p.images && p.images.length > 0 ? (
                      <img src={p.images[0].url || p.images[0]} alt={p.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-[10px] text-foreground/40 font-bold">
                        No Image
                      </div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-accent/10 text-accent">
                      {p.status}
                    </span>
                    <h3 className="font-bold text-xs text-foreground truncate mt-1">{p.title}</h3>
                    <p className="text-xs font-bold text-accent mt-0.5">
                      ₹{p.sellingPrice?.amount || p.maxPrice?.amount || 0}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SellerDashboard;
