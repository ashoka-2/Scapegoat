import React from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";

const SellerNavbar = () => {
  const { user } = useSelector((state) => state.auth);
  const location = useLocation();

  const menuItems = [
    { name: "Dashboard", path: "/seller/dashboard", icon: "📊" },
    { name: "Catalog", path: "/seller/catalog", icon: "📦" },
    { name: "User Directory", path: "/seller/users", icon: "👤" },
    { name: "Customers", path: "/seller/customers", icon: "👥" },
    { name: "User Carts", path: "/seller/carts", icon: "🛒" },
    { name: "Wishlists", path: "/seller/wishlists", icon: "❤️" },
    { name: "Orders", path: "/seller/orders", icon: "📑" },
    { name: "Categories & Brands", path: "/seller/metadata", icon: "⚙️" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-full lg:w-64 bg-surface border border-border-theme rounded-[24px] p-6 shrink-1 flex flex-col gap-6 lg:sticky top-24 z-40 backdrop-blur-md shadow-lg">
      {/* Brand Header */}
      {/* <div className="flex items-center space-x-3 px-2">
        <span className="w-3 h-3 bg-accent rounded-full animate-pulse" />
        <span className="text-base font-extrabold tracking-[0.2em] text-foreground uppercase">
          SCAPEGOAT
        </span>
      </div> */}

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
        {menuItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={`flex items-center space-x-3 px-3 py-2 rounded-xl text-xs font-semibold capitalize tracking-wider transition-all duration-300 ${
              isActive(item.path)
                ? "bg-accent text-accent-content shadow-md shadow-accent/20 scale-[1.02]"
                : "text-foreground/70 hover:text-foreground hover:bg-background/80 hover:translate-x-1"
            }`}
          >
            <span className="text-sm">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        ))}
      </nav>
    </aside>
  );
};

export default SellerNavbar;
