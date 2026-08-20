import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import customAxios from "../../../utils/axios";
import { useAdmin } from "../Hooks/useAdmin";
import OrderReceiptModal from "../Components/OrderReceiptModal";
import AdminReviewCard from "../Components/AdminReviewCard";
import AdminUserDetailSkeleton from "../Components/Skeletons/AdminUserDetailSkeleton";

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading, fetchUserById, changeUserRole, toggleBan } = useAdmin();
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);
  const [localData, setLocalData] = useState(null);
  const [localLoading, setLocalLoading] = useState(false);

  const getDisplayPrice = (p) => {
    if (!p) return 0;
    if (typeof p.sellingPrice?.amount === "number") return p.sellingPrice.amount;
    if (typeof p.maxPrice?.amount === "number") return p.maxPrice.amount;
    if (typeof p.price?.amount === "number") return p.price.amount;
    if (typeof p.price?.salePrice === "number") return p.price.salePrice;
    if (typeof p.price?.mrp === "number") return p.price.mrp;
    if (typeof p.price === "number") return p.price;
    if (Array.isArray(p.variants) && p.variants[0]?.price?.amount) return p.variants[0].price.amount;
    return 0;
  };

  const loadUserData = async () => {
    if (!id) return;
    fetchUserById(id);
    try {
      setLocalLoading(true);
      const res = await customAxios.get(`/api/admin/users/${id}`);
      if (res.data?.success) {
        setLocalData(res.data);
      }
    } catch (err) {
      console.error("Direct fetch user error:", err);
    } finally {
      setLocalLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      loadUserData();
    }
  }, [id]);

  const activePayload = localData || currentUser;
  const rawUser = activePayload?.user || activePayload;
  const currentUserId = (rawUser?._id || rawUser?.id || "").toString();

  if ((loading && !localData) || (localLoading && !currentUser)) {
    return <AdminUserDetailSkeleton />;
  }

  if (!activePayload || !rawUser || (currentUserId && id && currentUserId !== id.toString())) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center space-y-4">
        <p className="text-sm font-bold text-foreground/70">User record not found or invalid user ID.</p>
        <button
          onClick={() => navigate("/admin/users")}
          className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs cursor-pointer"
        >
          Return to Users Directory
        </button>
      </div>
    );
  }

  const user = rawUser;
  const orders = activePayload?.orders || user?.orders || [];
  const reviews = activePayload?.reviews || user?.reviews || [];
  const rawCart = activePayload?.cart || user?.cart || [];
  const cart = Array.isArray(rawCart) ? rawCart : rawCart?.items || [];
  const rawWishlist = activePayload?.wishlist || user?.wishlist || [];
  const wishlist = Array.isArray(rawWishlist) ? rawWishlist : rawWishlist?.products || [];
  const sellerProducts = activePayload?.sellerProducts || activePayload?.products || user?.sellerProducts || user?.products || [];
  const isSeller = user.role === "seller";

  return (
    <div className="space-y-6 font-sans">
      {/* Back Button */}
      <button
        onClick={() => navigate("/admin/users")}
        className="flex items-center gap-2 text-xs font-bold text-accent hover:underline cursor-pointer"
      >
        <i className="ri-arrow-left-line text-sm" /> Back to Users Directory
      </button>

      {/* User Header Profile Card */}
      <div className="bg-surface border border-border-theme rounded-3xl p-6 sm:p-8 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-5">
          <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-accent shrink-0 bg-background flex items-center justify-center font-black text-accent text-2xl">
            {user.profilePic ? (
              <img src={user.profilePic} alt={user.fullname} className="w-full h-full object-cover" />
            ) : (
              <span>{(user.fullname || "U")[0].toUpperCase()}</span>
            )}
          </div>

          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-2xl font-black text-foreground">{user.fullname}</h1>
              <span
                className={`text-[10px] font-black uppercase px-2.5 py-1 rounded-full border ${
                  user.role === "admin"
                    ? "bg-red-500/10 text-red-500 border-red-500/30"
                    : user.role === "seller"
                    ? "bg-amber-500/10 text-amber-500 border-amber-500/30"
                    : "bg-blue-500/10 text-blue-500 border-blue-500/30"
                }`}
              >
                {user.role}
              </span>
              {user.isBanned && (
                <span className="text-[10px] font-black uppercase px-2.5 py-1 rounded-full bg-red-500 text-white">
                  Banned
                </span>
              )}
            </div>

            <p className="text-xs font-semibold text-foreground/70">{user.email}</p>
            <p className="text-xs font-mono text-foreground/50">
              Contact: {user.contact || "N/A"} • Joined: {new Date(user.createdAt).toLocaleDateString()}
            </p>

            {/* Device & Activity Tracker */}
            <div className="flex items-center gap-3 pt-2 text-[11px] font-semibold text-foreground/70 flex-wrap">
              <span className="flex items-center gap-1 bg-background/60 border border-border-theme px-2.5 py-1 rounded-lg">
                <i className={user.deviceInfo?.device === "Mobile" ? "ri-smartphone-line text-accent" : "ri-computer-line text-accent"} />
                {user.deviceInfo?.browser || "Chrome"} on {user.deviceInfo?.os || "Windows"} ({user.deviceInfo?.device || "Desktop"})
              </span>

              <span className="flex items-center gap-1 bg-background/60 border border-border-theme px-2.5 py-1 rounded-lg font-mono">
                <i className="ri-wifi-line text-emerald-500" /> IP: {user.deviceInfo?.ip || "127.0.0.1"}
              </span>

              <span className="flex items-center gap-1 bg-background/60 border border-border-theme px-2.5 py-1 rounded-lg font-mono">
                <i className="ri-time-line text-amber-500" /> Last Active: {user.lastActiveAt ? new Date(user.lastActiveAt).toLocaleString() : "Recently"}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Action Controls */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <select
            value={user.role}
            onChange={(e) => changeUserRole(user._id, e.target.value)}
            className="bg-background border border-border-theme rounded-xl px-3 py-2 text-xs font-bold text-foreground cursor-pointer focus:outline-none"
          >
            <option value="buyer">Role: BUYER</option>
            <option value="seller">Role: SELLER</option>
            <option value="admin">Role: ADMIN</option>
          </select>

          <button
            onClick={() => toggleBan(user._id)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer border flex items-center gap-1.5 ${
              user.isBanned
                ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/30 hover:bg-emerald-500 hover:text-white"
                : "bg-red-500/10 text-red-500 border-red-500/30 hover:bg-red-500 hover:text-white"
            }`}
          >
            <i className={user.isBanned ? "ri-user-follow-line" : "ri-user-unfollow-line"} />
            {user.isBanned ? "Unban Account" : "Ban Account"}
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-1.5 bg-surface border border-border-theme p-1.5 rounded-2xl overflow-x-auto scrollbar-none shadow-sm relative">
        {[
          { id: "orders", label: "Orders", icon: "ri-receipt-line", count: orders?.length || 0 },
          { id: "cart", label: "Cart Items", icon: "ri-shopping-cart-2-line", count: cart?.length || 0 },
          { id: "wishlist", label: "Wishlist", icon: "ri-heart-line", count: wishlist?.length || 0 },
          ...(isSeller
            ? [{ id: "products", label: "Listed Products", icon: "ri-store-2-line", count: sellerProducts?.length || 0 }]
            : []),
          { id: "reviews", label: "Reviews", icon: "ri-star-line", count: reviews?.length || 0 },
        ].map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <motion.button
              key={tab.id}
              whileTap={{ scale: 0.98 }}
              onClick={() => setActiveTab(tab.id)}
              className={`relative px-4 py-2.5 rounded-xl text-xs font-bold transition-colors cursor-pointer flex items-center gap-2 shrink-0 z-10 ${
                isActive
                  ? "text-accent-content"
                  : "text-foreground/70 hover:text-foreground hover:bg-background/40"
              }`}
            >
              <i className={`${tab.icon} relative z-10 text-sm`} />
              <span className="relative z-10">{tab.label}</span>
              <span
                className={`relative z-10 text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                  isActive
                    ? "bg-accent-content text-accent"
                    : "bg-background/80 text-foreground/60 border border-border-theme/40"
                }`}
              >
                {tab.count}
              </span>

              {/* Smooth Spring Bubble Background */}
              {isActive && (
                <motion.div
                  layoutId="activeAdminUserDetailTabBubble"
                  className="absolute inset-0 bg-accent rounded-xl shadow-md shadow-accent/25 z-0"
                  transition={{
                    type: "spring",
                    stiffness: 450,
                    damping: 35,
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* ── Smooth Animated Tab Views ── */}
      <AnimatePresence mode="wait">
        {/* Tab 1: Orders View */}
        {activeTab === "orders" && (
          <motion.div
            key="orders"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm"
          >
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-wider text-foreground">
                User Order History ({orders?.length || 0})
              </h2>
              <span className="text-xs font-bold font-mono text-foreground/50 bg-background border border-border-theme px-3 py-1 rounded-xl">
                {orders?.length || 0} Orders Recorded
              </span>
          </div>

          <div className="space-y-3">
            {orders?.length > 0 ? (
              orders.map((ord) => {
                const orderItems = ord.orderItems || ord.items || [];
                return (
                  <div
                    key={ord._id}
                    className="p-4 bg-background/50 border border-border-theme/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 hover:border-border-theme transition"
                  >
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-black text-accent">
                          #{ord.orderId || ord._id.slice(-6).toUpperCase()}
                        </span>
                        <span className="text-[10px] text-foreground/40">•</span>
                        <span className="text-[11px] text-foreground/50">
                          {new Date(ord.createdAt).toLocaleDateString("en-IN", { dateStyle: "medium" })}
                        </span>
                      </div>
                      <p className="text-xs text-foreground/70 font-medium">
                        {orderItems.length} {orderItems.length === 1 ? "Product" : "Products"} ({orderItems.map((i) => i.name || i.product?.title || "Item").slice(0, 2).join(", ")}{orderItems.length > 2 ? "..." : ""})
                      </p>
                    </div>

                    <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
                      <div className="text-right">
                        <p className="text-xs font-mono font-black text-foreground">
                          ₹{ord.totalPrice?.toLocaleString()}
                        </p>
                        <span
                          className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full border ${
                            ord.status === "Delivered"
                              ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                              : ord.status === "Cancelled"
                              ? "bg-red-500/10 text-red-500 border-red-500/20"
                              : "bg-amber-500/10 text-amber-500 border-amber-500/20"
                          }`}
                        >
                          {ord.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setSelectedReceiptOrder(ord)}
                          className="px-3 py-1.5 rounded-xl bg-background border border-border-theme text-xs font-bold text-foreground/70 hover:text-foreground hover:bg-surface transition cursor-pointer flex items-center gap-1.5"
                          title="Print / View Receipt"
                        >
                          <i className="ri-receipt-line" /> Receipt
                        </button>
                        <button
                          onClick={() => navigate(`/admin/orders/${ord._id}`)}
                          className="px-3 py-1.5 rounded-xl bg-accent/10 text-accent border border-accent/20 text-xs font-bold hover:bg-accent hover:text-accent-content transition cursor-pointer flex items-center gap-1"
                        >
                          <span>Order Audit</span>
                          <i className="ri-arrow-right-line" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-foreground/40 italic py-8 text-center">
                No orders found for this user.
              </p>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 2: Cart Items */}
      {activeTab === "cart" && (
        <motion.div
          key="cart"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm"
        >
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Cart Added Items</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cart?.length > 0 ? (
              cart.map((item, idx) => {
                const p = item.product || {};
                const primaryImg = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url || (typeof p.images?.[0] === "string" ? p.images[0] : "");
                const price = getDisplayPrice(p);

                return (
                  <div key={idx} onClick={() => p._id && navigate(`/admin/products/${p._id}`)} className="p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-accent transition">
                    <div className="w-12 h-14 rounded-xl overflow-hidden border border-border-theme shrink-0 bg-surface">
                      {primaryImg ? (
                        <img src={primaryImg} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/30"><i className="ri-image-line" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-xs text-foreground truncate">{p.title || "Product"}</p>
                      <p className="text-[10px] text-accent font-bold">Qty: {item.quantity}</p>
                      <p className="text-xs font-mono font-black text-foreground mt-0.5">₹{price.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-foreground/40 italic py-8 text-center sm:col-span-2 lg:col-span-3">User has no active cart items.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 3: Wishlist Items */}
      {activeTab === "wishlist" && (
        <motion.div
          key="wishlist"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm"
        >
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Wishlist Saved Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist?.length > 0 ? (
              wishlist.map((p) => {
                const primaryImg = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url || (typeof p.images?.[0] === "string" ? p.images[0] : "");
                const price = getDisplayPrice(p);

                return (
                  <div key={p._id} onClick={() => navigate(`/admin/products/${p._id}`)} className="p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-accent transition">
                    <div className="w-12 h-14 rounded-xl overflow-hidden border border-border-theme shrink-0 bg-surface">
                      {primaryImg ? (
                        <img src={primaryImg} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/30"><i className="ri-image-line" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-xs text-foreground truncate">{p.title}</p>
                      <p className="text-[10px] font-bold text-emerald-500">{p.stock > 0 ? "In Stock" : "Out of Stock"}</p>
                      <p className="text-xs font-mono font-black text-foreground mt-0.5">₹{price.toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-foreground/40 italic py-8 text-center sm:col-span-2 lg:col-span-3">User has no wishlist items.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 4: Listed Products (ONLY for Seller) */}
      {isSeller && activeTab === "products" && (
        <motion.div
          key="products"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm"
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-black uppercase tracking-wider text-amber-500">Products Listed by Seller ({sellerProducts?.length || 0})</h2>
              <p className="text-xs text-foreground/50">All active catalog items published by this merchant</p>
            </div>
            <span className="text-xs font-bold text-foreground/60 font-mono bg-background border border-border-theme px-3 py-1 rounded-xl">
              {sellerProducts?.length || 0} Listed Items
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellerProducts?.length > 0 ? (
              sellerProducts.map((p) => {
                const primaryImg = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url || (typeof p.images?.[0] === "string" ? p.images[0] : "");
                const price = getDisplayPrice(p);
                const maxPrice = p.maxPrice?.amount || (typeof p.maxPrice === "number" ? p.maxPrice : null);

                return (
                  <div key={p._id} onClick={() => navigate(`/admin/products/${p._id}`)} className="p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center gap-3.5 cursor-pointer hover:border-amber-500/50 hover:bg-background transition group shadow-sm">
                    <div className="w-14 h-16 rounded-xl overflow-hidden border border-border-theme shrink-0 bg-surface">
                      {primaryImg ? (
                        <img src={primaryImg} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/30"><i className="ri-image-line text-lg" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5">
                      <p className="font-extrabold text-xs text-foreground truncate group-hover:text-amber-500 transition">{p.title}</p>
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-bold ${p.stock > 0 ? "text-emerald-500" : "text-red-400"}`}>Stock: {p.stock || 0}</span>
                        {p.status && <span className="text-[9px] uppercase px-1.5 py-0.2 rounded bg-surface border border-border-theme text-foreground/50 font-bold">{p.status}</span>}
                      </div>
                      <div className="flex items-baseline gap-1.5 pt-0.5">
                        <span className="text-sm font-mono font-black text-foreground">₹{price.toLocaleString()}</span>
                        {maxPrice && maxPrice > price && <span className="text-[10px] font-mono text-foreground/40 line-through">₹{maxPrice.toLocaleString()}</span>}
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-foreground/40 italic py-8 text-center sm:col-span-2 lg:col-span-3">This seller has not created any products yet.</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Tab 5: Reviews */}
      {activeTab === "reviews" && (
        <motion.div
          key="reviews"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
          className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm"
        >
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Submitted Reviews</h2>

          <div className="space-y-3">
            {reviews?.length > 0 ? (
              reviews.map((rev) => (
                <AdminReviewCard
                  key={rev._id}
                  review={rev}
                  onUpdateSuccess={() => fetchUserById(id)}
                />
              ))
            ) : (
              <p className="text-xs text-foreground/40 italic py-8 text-center">No reviews submitted by this user.</p>
            )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

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

export default AdminUserDetailPage;
