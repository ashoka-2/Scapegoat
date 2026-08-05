import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useSeller } from "../Hooks/useSeller";
import SellerTableSkeleton from "../Components/Skeletons/SellerTableSkeleton";

const SellerUserDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { handleFetchUserDetail } = useSeller();

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("wishlist");

  useEffect(() => {
    if (id) {
      setLoading(true);
      handleFetchUserDetail(id)
        .then((data) => setUser(data))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return <SellerTableSkeleton />;
  }

  if (!user) {
    return (
      <div className="bg-surface border border-border-theme p-12 rounded-3xl text-center space-y-4 font-sans">
        <i className="ri-user-unfollow-line text-6xl text-foreground/30" />
        <h1 className="text-xl font-black uppercase text-foreground">User Not Found</h1>
        <button
          onClick={() => navigate(-1)}
          className="px-6 py-2.5 bg-accent text-accent-content font-bold text-xs uppercase rounded-full cursor-pointer"
        >
          Go Back
        </button>
      </div>
    );
  }

  const tabs = [
    { id: "wishlist", label: "Wishlist", icon: "ri-heart-line", count: user.wishlist?.products?.length || 0 },
    { id: "cart", label: "Cart", icon: "ri-shopping-bag-line", count: user.cart?.items?.length || 0 },
    { id: "orders", label: "Orders", icon: "ri-receipt-line", count: user.orders?.length || 0 },
    ...(user.role === "seller"
      ? [{ id: "products", label: "Products", icon: "ri-store-2-line", count: user.products?.length || 0 }]
      : []),
  ];

  return (
    <div className="space-y-6 font-sans">
      {/* Top Header */}
      <div className="flex items-center gap-4 bg-surface border border-border-theme p-6 rounded-3xl shadow-lg">
        <button
          onClick={() => navigate(-1)}
          className="w-10 h-10 rounded-2xl border border-border-theme flex items-center justify-center text-foreground/70 hover:text-accent hover:border-accent cursor-pointer transition"
        >
          <i className="ri-arrow-left-line text-lg" />
        </button>
        <div>
          <span className="text-[10px] font-mono font-black text-accent uppercase tracking-widest">
            Client Profile
          </span>
          <h1 className="text-2xl font-black uppercase text-foreground">{user.fullname || "User Profile"}</h1>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Info Box */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-surface border border-border-theme p-6 rounded-3xl space-y-5 shadow-lg">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-accent/40 bg-background flex items-center justify-center text-2xl font-black text-accent">
                {user.profilePic ? (
                  <img src={user.profilePic} alt={user.fullname} className="w-full h-full object-cover" />
                ) : (
                  <span>{(user.fullname || "U")[0].toUpperCase()}</span>
                )}
              </div>
              <div>
                <h2 className="text-lg font-black text-foreground">{user.fullname}</h2>
                <p className="text-xs font-bold text-foreground/60">{user.email}</p>
              </div>
              <span className="text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full border bg-accent/10 text-accent border-accent/20">
                {user.role}
              </span>
            </div>

            <div className="space-y-3 pt-4 border-t border-border-theme text-xs">
              <div>
                <span className="font-bold text-foreground/50 uppercase text-[10px]">Contact</span>
                <p className="font-semibold text-foreground">{user.contact || "No contact saved"}</p>
              </div>
              <div>
                <span className="font-bold text-foreground/50 uppercase text-[10px]">Shipping Address</span>
                <p className="font-semibold text-foreground">
                  {user.address ? (
                    `${user.address.street || ""}, ${user.address.city || ""}, ${user.address.state || ""} - ${
                      user.address.pincode || ""
                    }`
                  ) : (
                    <span className="italic text-foreground/40">No address saved</span>
                  )}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Tabbed Information */}
        <div className="lg:col-span-8 space-y-4">
          {/* Tabs header */}
          <div className="flex gap-2 overflow-x-auto bg-surface border border-border-theme p-1.5 rounded-2xl">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase transition cursor-pointer flex-1 justify-center ${
                  activeTab === t.id
                    ? "bg-accent text-accent-content shadow-sm"
                    : "text-foreground/70 hover:bg-background/50"
                }`}
              >
                <i className={t.icon} />
                <span>{t.label}</span>
                <span className="bg-background/40 px-2 py-0.5 rounded-full text-[10px]">{t.count}</span>
              </button>
            ))}
          </div>

          {/* Tab Content Box */}
          <div className="bg-surface border border-border-theme p-6 rounded-3xl shadow-lg min-h-[300px]">
            {activeTab === "wishlist" && (
              <div className="space-y-3">
                {user.wishlist?.products?.length === 0 ? (
                  <p className="text-xs text-foreground/40 text-center py-10">No wishlisted products.</p>
                ) : (
                  user.wishlist?.products?.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => navigate(`/product/${p._id}`)}
                      className="flex items-center justify-between gap-3 p-3 bg-background/50 rounded-2xl border border-border-theme/40 hover:border-accent/40 cursor-pointer transition"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images?.[0]?.url || p.images?.[0]}
                          alt={p.title}
                          className="w-10 h-12 object-cover rounded-xl border border-border-theme shrink-0"
                        />
                        <div>
                          <p className="text-xs font-bold text-foreground">{p.title}</p>
                          <p className="text-[11px] font-mono text-accent">
                            ₹{(p.sellingPrice?.amount || p.maxPrice?.amount || 0).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <i className="ri-arrow-right-s-line text-foreground/40 text-lg" />
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "cart" && (
              <div className="space-y-3">
                {user.cart?.items?.length === 0 ? (
                  <p className="text-xs text-foreground/40 text-center py-10">Shopping cart is empty.</p>
                ) : (
                  user.cart?.items?.map((item, idx) => {
                    const p = item.product || {};
                    return (
                      <div
                        key={idx}
                        onClick={() => p._id && navigate(`/product/${p._id}`)}
                        className="flex items-center justify-between gap-3 p-3 bg-background/50 rounded-2xl border border-border-theme/40 hover:border-accent/40 cursor-pointer transition"
                      >
                        <div className="flex items-center gap-3">
                          <img
                            src={p.images?.[0]?.url || p.images?.[0]}
                            alt={p.title}
                            className="w-10 h-12 object-cover rounded-xl border border-border-theme shrink-0"
                          />
                          <div>
                            <p className="text-xs font-bold text-foreground">{p.title}</p>
                            <p className="text-[11px] text-foreground/60">Qty: {item.quantity}</p>
                          </div>
                        </div>
                        <i className="ri-arrow-right-s-line text-foreground/40 text-lg" />
                      </div>
                    );
                  })
                )}
              </div>
            )}

            {activeTab === "orders" && (
              <div className="space-y-3">
                {user.orders?.length === 0 ? (
                  <p className="text-xs text-foreground/40 text-center py-10">No orders placed yet.</p>
                ) : (
                  user.orders?.map((o) => (
                    <div key={o._id} className="p-4 bg-background/50 rounded-2xl border border-border-theme/40 space-y-2 text-xs">
                      <div className="flex justify-between font-mono font-bold text-accent">
                        <span>#{o.orderId || o._id.slice(-6).toUpperCase()}</span>
                        <span>₹{o.totalPrice?.toLocaleString()}</span>
                      </div>
                      <p className="text-[11px] text-foreground/60">Status: {o.status}</p>
                    </div>
                  ))
                )}
              </div>
            )}

            {activeTab === "products" && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {user.products?.length === 0 ? (
                  <p className="text-xs text-foreground/40 text-center py-10 col-span-2">No listed products.</p>
                ) : (
                  user.products?.map((p) => (
                    <div
                      key={p._id}
                      onClick={() => navigate(`/product/${p._id}`)}
                      className="flex items-center gap-3 p-3 bg-background/50 rounded-2xl border border-border-theme/40 hover:border-accent/40 cursor-pointer transition"
                    >
                      <img
                        src={p.images?.[0]?.url || p.images?.[0]}
                        alt={p.title}
                        className="w-10 h-12 object-cover rounded-xl border border-border-theme shrink-0"
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-foreground truncate">{p.title}</p>
                        <p className="text-[11px] font-mono text-accent">
                          ₹{(p.sellingPrice?.amount || p.maxPrice?.amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerUserDetailPage;
