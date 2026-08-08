import React, { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAdmin } from "../Hooks/useAdmin";
import ThemeToggle from "../../../Components/ThemeToggle";

const AdminNavbar = ({ onLogout, isCollapsed = false, setIsCollapsed }) => {
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
      name: "Banners",
      path: "/admin/banners",
      icon: "ri-image-2-line",
    },
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

      {/* Left Floating/Attached Sidebar with top spacing & collapse toggle */}
      <aside
        className={`fixed top-0 lg:top-3.5 left-0 lg:left-3.5 bottom-0 lg:bottom-3.5 z-50 ${
          isCollapsed ? "lg:w-20 w-64" : "w-64"
        } lg:h-[calc(100vh-1.75rem)] bg-surface/95 border-r lg:border border-border-theme/60 backdrop-blur-2xl p-4 flex flex-col justify-between shrink-0 shadow-[4px_0_30px_rgba(0,0,0,0.06)] rounded-none lg:rounded-3xl transition-all duration-300 ease-in-out font-sans ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="flex flex-col gap-5 overflow-y-auto scrollbar-hide pr-0.5" data-lenis-prevent>
          {/* Brand Header & Collapse Toggle */}
          <div className="flex items-center justify-between pb-3.5 border-b border-border-theme/60">
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-10 h-10 rounded-xl bg-accent/20 border border-accent/40 flex items-center justify-center font-black text-accent text-sm shadow-md shrink-0">
                SG
              </div>
              {!isCollapsed && (
                <div className="truncate">
                  <h1 className="font-extrabold text-xs text-foreground tracking-wide flex items-center gap-1.5 truncate">
                    ScapeGoat
                  </h1>
                  <span className="text-[9px] font-black uppercase text-red-500 tracking-wider block">
                    Control Center
                  </span>
                </div>
              )}
            </div>

            {/* Collapse Arrow Button for Desktop & Theme Toggle */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setIsCollapsed(!isCollapsed)}
                className="hidden lg:flex w-8 h-8 rounded-xl bg-surface-variant/30 border border-border-theme/40 text-foreground/60 hover:text-accent hover:bg-surface-variant/60 items-center justify-center text-base transition cursor-pointer"
                title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar (Icon Only)"}
              >
                <i className={isCollapsed ? "ri-arrow-right-s-line" : "ri-arrow-left-s-line"} />
              </button>
              {!isCollapsed && <ThemeToggle />}
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="flex flex-col gap-1.5 relative">
            {menuItems.map((item) => {
              const active = isActive(item.path);

              return (
                <motion.div
                  key={item.path}
                  whileHover={{ x: isCollapsed ? 0 : 3 }}
                  whileTap={{ scale: 0.98 }}
                  className="relative"
                >
                  <Link
                    to={item.path}
                    title={isCollapsed ? item.name : undefined}
                    className={`relative z-10 flex items-center ${
                      isCollapsed ? "justify-center px-0 py-3" : "justify-between px-3.5 py-2.5"
                    } rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 group ${
                      active
                        ? "text-accent-content"
                        : "text-foreground/70 hover:text-foreground"
                    }`}
                  >
                    <div className={`flex items-center ${isCollapsed ? "justify-center" : "space-x-3"}`}>
                      <i
                        className={`${item.icon} text-lg transition-transform duration-200 group-hover:scale-110`}
                      />
                      {!isCollapsed && <span>{item.name}</span>}
                    </div>

                    {!isCollapsed && item.badgeCount > 0 && (
                      <span className="bg-red-500 text-white font-mono text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                        +{item.badgeCount}
                      </span>
                    )}

                    {isCollapsed && item.badgeCount > 0 && (
                      <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                    )}
                  </Link>

                  {/* Active Indicator */}
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
