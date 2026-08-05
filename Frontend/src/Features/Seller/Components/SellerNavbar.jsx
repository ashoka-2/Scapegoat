import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { clearUnread } from "../State/seller.slice";

const SellerNavbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { unreadCounts } = useSelector((state) => state.seller);

  const menuItems = [
    { name: "Dashboard", path: "/seller/dashboard", icon: "ri-dashboard-3-line" },
    { name: "Catalog", path: "/seller/catalog", icon: "ri-box-3-line" },
    { name: "User Directory", path: "/seller/users", icon: "ri-user-line" },
    { name: "Customers", path: "/seller/customers", icon: "ri-group-line", badgeKey: "customers" },
    { name: "User Carts", path: "/seller/carts", icon: "ri-shopping-bag-line", badgeKey: "carts" },
    { name: "Wishlists", path: "/seller/wishlists", icon: "ri-heart-line", badgeKey: "wishlists" },
    { name: "Orders", path: "/seller/orders", icon: "ri-receipt-line", badgeKey: "orders" },
    { name: "Categories & Brands", path: "/seller/metadata", icon: "ri-settings-4-line" },
  ];

  const isActive = (path) => location.pathname === path;

  const handleNavClick = (badgeKey) => {
    if (badgeKey) {
      dispatch(clearUnread(badgeKey));
    }
  };

  return (
    <aside className="w-full lg:w-64 bg-surface border border-border-theme rounded-[24px] p-6 shrink-0 flex flex-col gap-6 lg:sticky top-24 z-40 backdrop-blur-md shadow-lg font-sans">
      {/* Seller Profile Widget */}
      <div className="flex items-center justify-between p-3.5 bg-background/60 border border-border-theme rounded-2xl">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/30 shrink-0 bg-surface flex items-center justify-center font-extrabold text-accent">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.fullname || user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{(user?.fullname || user?.username || "S")[0].toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-xs text-foreground truncate">
              {user?.fullname || user?.username}
            </p>
            <p className="text-[9px] font-extrabold text-accent uppercase tracking-widest mt-0.5">
              SELLER PARTNER
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1.5">
        {menuItems.map((item) => {
          const badgeCount = item.badgeKey ? unreadCounts?.[item.badgeKey] || 0 : 0;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={() => handleNavClick(item.badgeKey)}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                active
                  ? "bg-accent text-accent-content shadow-md shadow-accent/20 scale-[1.02]"
                  : "text-foreground/70 hover:text-foreground hover:bg-background/80 hover:translate-x-1"
              }`}
            >
              <div className="flex items-center space-x-3">
                <i className={`${item.icon} text-base`} />
                <span>{item.name}</span>
              </div>

              {badgeCount > 0 && (
                <span className="bg-red-500 text-white font-mono text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                  +{badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};

export default SellerNavbar;
