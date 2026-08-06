import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "../Hooks/useAdmin";
import ThemeToggle from "../../../Components/ThemeToggle";

const AdminNavbar = ({ onLogout }) => {
  const location = useLocation();
  const { stats, fetchDashboardStats } = useAdmin();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!stats) {
      fetchDashboardStats();
    }
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: "ri-dashboard-3-line",
    },
    {
      name: "User Directory",
      path: "/admin/users",
      icon: "ri-user-settings-line",
    },
    {
      name: "Catalog Products",
      path: "/admin/products",
      icon: "ri-box-3-line",
    },
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
    {
      name: "Site Settings",
      path: "/admin/settings",
      icon: "ri-settings-4-line",
    },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Mobile Top Header Bar (Visible on screens < lg) */}
      <div className="lg:hidden fixed top-0 left-0 right-0 z-40 bg-surface/90 border-b border-border-theme backdrop-blur-xl px-4 py-3 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-3">
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-2 rounded-xl bg-background/80 border border-border-theme/60 text-foreground hover:text-accent transition cursor-pointer shadow-xs"
            aria-label="Toggle Sidebar"
          >
            <i
              className={
                mobileOpen ? "ri-close-line text-xl" : "ri-menu-unfold-line text-xl"
              }
            />
          </motion.button>
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-accent/20 border border-accent/40 flex items-center justify-center font-black text-accent text-xs shadow-inner">
              SG
            </span>
            <span className="font-extrabold text-xs text-foreground tracking-wide">
              ScapeGoat Dashboard
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onLogout}
            className="p-2 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 text-xs font-bold transition cursor-pointer"
            title="Logout"
          >
            <i className="ri-logout-box-r-line text-base" />
          </motion.button>
        </div>
      </div>

      {/* Backdrop overlay for mobile sidebar */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileOpen(false)}
            className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-xs z-45"
          />
        )}
      </AnimatePresence>

      {/* Left Floating/Attached Sidebar with top spacing */}
      <aside
        className={`fixed top-0 lg:top-3.5 left-0 lg:left-3.5 bottom-0 lg:bottom-3.5 z-50 w-64 lg:h-[calc(100vh-1.75rem)] bg-surface/95 border-r lg:border border-border-theme/60 backdrop-blur-2xl p-5 flex flex-col justify-between shrink-0 shadow-[4px_0_30px_rgba(0,0,0,0.06)] rounded-none lg:rounded-3xl transition-transform duration-300 ease-in-out font-sans ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col gap-6 overflow-y-auto scrollbar-none pr-1">
          {/* Brand Header & Theme Toggle in Top Right of Sidebar */}
          <div className="flex items-center justify-between pb-4 border-b border-border-theme/60">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center font-black text-accent text-sm shadow-md">
                  SG
                </div>
              <div>
                <h1 className="font-extrabold text-xs text-foreground tracking-wide flex items-center gap-1.5">
                  ScapeGoat
                </h1>
                <span className="text-[9px] font-black uppercase text-red-500 tracking-wider">
                  Control Center
                </span>
              </div>
            </div>

            {/* Theme Toggle located in Top Right of Left Sidebar */}
            <div className="flex items-center gap-2">
              <ThemeToggle />
              <button
                onClick={() => setMobileOpen(false)}
                className="lg:hidden text-foreground/40 hover:text-foreground text-lg cursor-pointer transition"
              >
                <i className="ri-close-line" />
              </button>
            </div>
          </div>

          {/* Navigation Links with Sliding Active Pill */}
          <nav className="flex flex-col gap-1.5 relative">
            {menuItems.map((item) => {
              const active = isActive(item.path);

              return (
                <motion.div
                  key={item.path}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  <Link
                    to={item.path}
                    className={`relative z-10 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 group ${
                      active
                        ? "text-accent-content"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <i
                        className={`${item.icon} text-base transition-transform duration-200 group-hover:scale-110`}
                      />
                      <span>{item.name}</span>
                    </div>

                    {item.badgeCount > 0 && (
                      <span className="bg-red-500 text-white font-mono text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        +{item.badgeCount}
                      </span>
                    )}
                  </Link>

                  {/* Smooth Sliding Pill Indicator */}
                  {active && (
                    <motion.div
                      layoutId="activeAdminNavIndicator"
                      className="absolute inset-0 bg-accent rounded-xl shadow-md shadow-accent/25 z-0"
                      transition={{
                        type: "spring",
                        stiffness: 450,
                        damping: 35,
                      }}
                    />
                  )}
                </motion.div>
              );
            })}
          </nav>
        </div>

        {/* Footer Actions: Logout */}
        <div className="pt-4 border-t border-border-theme/60 flex flex-col gap-3 shrink-0">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.97 }}
            onClick={onLogout}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white border border-red-500/20 text-xs font-bold transition-all shadow-xs cursor-pointer"
          >
            <i className="ri-logout-box-r-line text-sm" />
            Logout
          </motion.button>
        </div>
      </aside>
    </>
  );
};

export default AdminNavbar;
