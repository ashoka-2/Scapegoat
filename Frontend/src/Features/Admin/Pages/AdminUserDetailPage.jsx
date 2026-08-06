import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAdmin } from "../Hooks/useAdmin";
import OrderReceiptModal from "../Components/OrderReceiptModal";

const AdminUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading, fetchUserById, changeUserRole, toggleBan } = useAdmin();
  const [activeTab, setActiveTab] = useState("orders");
  const [selectedReceiptOrder, setSelectedReceiptOrder] = useState(null);

  useEffect(() => {
    if (id) {
      fetchUserById(id);
    }
  }, [id]);

  if (loading || !currentUser || currentUser.user?._id !== id) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-accent border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const { user, orders, reviews, cart, wishlist, sellerProducts } = currentUser;
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

      {/* Navigation Tabs for User Details */}
      <div className="flex items-center gap-1.5 bg-background/60 p-1.5 rounded-2xl border border-border-theme overflow-x-auto">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "orders" ? "bg-accent text-accent-content shadow-sm" : "text-foreground/70 hover:text-foreground"
          }`}
        >
          <i className="ri-receipt-line" /> Orders ({orders?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("cart")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "cart" ? "bg-accent text-accent-content shadow-sm" : "text-foreground/70 hover:text-foreground"
          }`}
        >
          <i className="ri-shopping-cart-2-line" /> Cart Items ({cart?.length || 0})
        </button>

        <button
          onClick={() => setActiveTab("wishlist")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "wishlist" ? "bg-accent text-accent-content shadow-sm" : "text-foreground/70 hover:text-foreground"
          }`}
        >
          <i className="ri-heart-line" /> Wishlist ({wishlist?.length || 0})
        </button>

        {/* Products Tab — ONLY for Seller! */}
        {isSeller && (
          <button
            onClick={() => setActiveTab("products")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
              activeTab === "products" ? "bg-amber-500 text-black shadow-sm" : "text-amber-500 hover:text-amber-400"
            }`}
          >
            <i className="ri-store-2-line" /> Listed Products ({sellerProducts?.length || 0})
          </button>
        )}

        <button
          onClick={() => setActiveTab("reviews")}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-2 shrink-0 ${
            activeTab === "reviews" ? "bg-accent text-accent-content shadow-sm" : "text-foreground/70 hover:text-foreground"
          }`}
        >
          <i className="ri-star-line" /> Reviews ({reviews?.length || 0})
        </button>
      </div>

      {/* Tab 1: Orders View with View Receipt Modal support */}
      {activeTab === "orders" && (
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm animate-in fade-in">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Order History</h2>

          <div className="space-y-3">
            {orders?.length > 0 ? (
              orders.map((ord) => (
                <div
                  key={ord._id}
                  className="p-4 bg-background/50 border border-border-theme/40 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4"
                >
                  <div>
                    <p className="text-xs font-mono font-bold text-accent">
                      #{ord.orderId || ord._id.slice(-6).toUpperCase()}
                    </p>
                    <p className="text-[11px] text-foreground/50">
                      {new Date(ord.createdAt).toLocaleDateString()} • {ord.items?.length || ord.orderItems?.length || 0} items
                    </p>
                  </div>

                  <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                    <div className="text-right">
                      <p className="text-xs font-mono font-black text-foreground">
                        ₹{ord.totalPrice?.toLocaleString()}
                      </p>
                      <span
                        className={`text-[9px] font-black uppercase px-2 py-0.5 rounded-full ${
                          ord.status === "Delivered" ? "bg-emerald-500/10 text-emerald-500" : "bg-amber-500/10 text-amber-500"
                        }`}
                      >
                        {ord.status}
                      </span>
                    </div>

                    <button
                      onClick={() => setSelectedReceiptOrder(ord)}
                      className="px-3 py-1.5 rounded-xl bg-accent/10 text-accent border border-accent/20 text-xs font-bold hover:bg-accent hover:text-accent-content transition cursor-pointer flex items-center gap-1.5"
                    >
                      <i className="ri-receipt-line" /> View Receipt
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-xs text-foreground/40 italic py-8 text-center">No orders found for this user.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Cart Items */}
      {activeTab === "cart" && (
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm animate-in fade-in">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Cart Added Items</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {cart?.length > 0 ? (
              cart.map((item, idx) => {
                const p = item.product || {};
                const primaryImg = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;
                return (
                  <div
                    key={idx}
                    onClick={() => p._id && navigate(`/admin/products/${p._id}`)}
                    className="p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-accent transition"
                  >
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
                      <p className="text-xs font-mono font-black text-foreground mt-0.5">₹{(p.price?.salePrice || p.price?.mrp || 0).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-foreground/40 italic py-8 text-center sm:col-span-2 lg:col-span-3">User has no active cart items.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 3: Wishlist Items */}
      {activeTab === "wishlist" && (
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm animate-in fade-in">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Wishlist Saved Products</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {wishlist?.length > 0 ? (
              wishlist.map((p) => {
                const primaryImg = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;
                return (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/admin/products/${p._id}`)}
                    className="p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-accent transition"
                  >
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
                      <p className="text-xs font-mono font-black text-foreground mt-0.5">₹{(p.price?.salePrice || p.price?.mrp || 0).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-foreground/40 italic py-8 text-center sm:col-span-2 lg:col-span-3">User has no wishlist items.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 4: Listed Products (ONLY for Seller) */}
      {isSeller && activeTab === "products" && (
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm animate-in fade-in">
          <h2 className="text-sm font-black uppercase tracking-wider text-amber-500">Products Listed by Seller ({sellerProducts?.length || 0})</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {sellerProducts?.length > 0 ? (
              sellerProducts.map((p) => {
                const primaryImg = p.images?.find((i) => i.isPrimary)?.url || p.images?.[0]?.url;
                return (
                  <div
                    key={p._id}
                    onClick={() => navigate(`/admin/products/${p._id}`)}
                    className="p-3.5 bg-background/50 border border-border-theme/40 rounded-2xl flex items-center gap-3 cursor-pointer hover:border-accent transition"
                  >
                    <div className="w-12 h-14 rounded-xl overflow-hidden border border-border-theme shrink-0 bg-surface">
                      {primaryImg ? (
                        <img src={primaryImg} alt={p.title} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/30"><i className="ri-image-line" /></div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-extrabold text-xs text-foreground truncate">{p.title}</p>
                      <p className="text-[10px] font-mono text-accent">Stock: {p.stock}</p>
                      <p className="text-xs font-mono font-black text-foreground mt-0.5">₹{(p.price?.salePrice || p.price?.mrp || 0).toLocaleString()}</p>
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-xs text-foreground/40 italic py-8 text-center sm:col-span-2 lg:col-span-3">This seller has not created any products yet.</p>
            )}
          </div>
        </div>
      )}

      {/* Tab 5: Reviews */}
      {activeTab === "reviews" && (
        <div className="bg-surface border border-border-theme rounded-3xl p-6 space-y-4 shadow-sm animate-in fade-in">
          <h2 className="text-sm font-black uppercase tracking-wider text-foreground">Submitted Reviews</h2>

          <div className="space-y-3">
            {reviews?.length > 0 ? (
              reviews.map((rev) => (
                <div key={rev._id} className="p-4 bg-background/50 border border-border-theme/40 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-foreground truncate max-w-[200px]">
                      {rev.product?.title || "Product"}
                    </span>
                    <div className="flex items-center text-amber-500 text-xs font-mono font-black">
                      {"★".repeat(rev.rating)} ({rev.rating}/5)
                    </div>
                  </div>
                  <p className="text-xs font-bold text-foreground">{rev.title}</p>
                  <p className="text-[11px] text-foreground/70 italic">{rev.comment}</p>
                </div>
              ))
            ) : (
              <p className="text-xs text-foreground/40 italic py-8 text-center">No reviews submitted by this user.</p>
            )}
          </div>
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

export default AdminUserDetailPage;
