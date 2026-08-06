import React, { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useAdmin } from "../Hooks/useAdmin";

const AdminNavbar = () => {
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { stats, fetchDashboardStats } = useAdmin();

  useEffect(() => {
    if (!stats) {
      fetchDashboardStats();
    }
  }, []);

  const menuItems = [
    { name: "Dashboard", path: "/admin/dashboard", icon: "ri-dashboard-3-line" },
    { name: "User Directory", path: "/admin/users", icon: "ri-user-settings-line" },
    { name: "Catalog Products", path: "/admin/products", icon: "ri-box-3-line" },
    { name: "All Orders", path: "/admin/orders", icon: "ri-receipt-line" },
    { name: "Categories", path: "/admin/categories", icon: "ri-folders-line" },
    { name: "Brands", path: "/admin/brands", icon: "ri-price-tag-3-line" },
    { name: "Units", path: "/admin/units", icon: "ri-ruler-line" },
    {
      name: "Inbox / Messages",
      path: "/admin/inbox",
      icon: "ri-mail-line",
      badgeCount: stats?.inbox?.unread || 0,
    },
    { name: "Site Settings", path: "/admin/settings", icon: "ri-settings-4-line" },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <aside className="w-full lg:w-64 bg-surface border border-border-theme rounded-[24px] p-6 shrink-0 flex flex-col gap-6 lg:sticky top-6 z-40 backdrop-blur-md shadow-lg font-sans">
      {/* Admin Profile Header Widget */}
      <div className="flex items-center justify-between p-3.5 bg-background/60 border border-border-theme rounded-2xl">
        <div className="flex items-center space-x-3 min-w-0">
          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-accent shrink-0 bg-surface flex items-center justify-center font-extrabold text-accent">
            {user?.profilePic ? (
              <img
                src={user.profilePic}
                alt={user.fullname || user.username}
                className="w-full h-full object-cover"
              />
            ) : (
              <span>{(user?.fullname || user?.username || "A")[0].toUpperCase()}</span>
            )}
          </div>
          <div className="min-w-0">
            <p className="font-extrabold text-xs text-foreground truncate">
              {user?.fullname || user?.username}
            </p>
            <p className="text-[9px] font-black text-red-500 uppercase tracking-widest mt-0.5 flex items-center gap-1">
              <i className="ri-shield-flash-line text-xs" /> SUPER ADMIN
            </p>
          </div>
        </div>
      </div>

      {/* Nav Links */}
      <nav className="flex flex-col gap-1.5">
        {menuItems.map((item) => {
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
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

              {item.badgeCount > 0 && (
                <span className="bg-red-500 text-white font-mono text-[10px] font-black px-2 py-0.5 rounded-full animate-bounce">
                  +{item.badgeCount}
                </span>
              )}
            </Link>
          );
        })}
      </nav>

      <div className="pt-4 border-t border-border-theme text-[10px] font-bold text-foreground/40 text-center uppercase tracking-widest">
        SCAPEGOAT ADMIN v2.0
      </div>
    </aside>
  );
};

export default AdminNavbar;
