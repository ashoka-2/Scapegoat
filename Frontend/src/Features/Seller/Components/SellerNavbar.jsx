import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import { clearUnread } from "../State/seller.slice";

const SellerNavbar = () => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { unreadCounts } = useSelector((state) => state.seller);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { name: "Dashboard", path: "/seller/dashboard", icon: "ri-dashboard-3-line" },
    { name: "Profit & Loss", path: "/seller/analytics", icon: "ri-line-chart-line" },
    { name: "Catalog", path: "/seller/catalog", icon: "ri-box-3-line" },
    { name: "User Directory", path: "/seller/users", icon: "ri-user-line" },
    { name: "Customers", path: "/seller/customers", icon: "ri-group-line", badgeKey: "customers" },
    { name: "User Carts", path: "/seller/carts", icon: "ri-shopping-bag-line", badgeKey: "carts" },
    { name: "Wishlists", path: "/seller/wishlists", icon: "ri-heart-line", badgeKey: "wishlists" },
    { name: "Orders", path: "/seller/orders", icon: "ri-receipt-line", badgeKey: "orders" },
    { name: "Categories & Brands", path: "/seller/metadata", icon: "ri-settings-4-line" },
  ];

  const isActive = (path) => location.pathname === path;
  const currentSection = menuItems.find((m) => isActive(m.path))?.name || "Menu";

  const handleNavClick = (badgeKey, closeDrawer = false) => {
    if (badgeKey) {
      dispatch(clearUnread(badgeKey));
    }
    if (closeDrawer) setDrawerOpen(false);
  };

  const renderMenuItems = (layoutScope = "desktop", closeOnClick = false) =>
    menuItems.map((item) => {
      const badgeCount = item.badgeKey ? unreadCounts?.[item.badgeKey] || 0 : 0;
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
            onClick={() => handleNavClick(item.badgeKey, closeOnClick)}
            className={`relative z-10 flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors duration-200 group ${
              active
                ? "text-accent-content"
                : "text-foreground/70 hover:text-foreground"
            }`}
          >
            <div className="flex items-center space-x-3">
              <i
                className={`${item.icon} text-base transition-transform duration-200 group-hover:scale-110 group-hover:text-accent ${
                  active ? "text-accent-content group-hover:text-accent-content" : ""
                }`}
              />
              <span>{item.name}</span>
            </div>

            {badgeCount > 0 && (
              <span className="bg-red-500 text-white font-mono text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm animate-pulse">
                +{badgeCount}
              </span>
            )}
          </Link>

          {/* Smooth Spring Active Indicator Bubble (Matched with AdminNavbar) */}
          {active && (
            <motion.div
              layoutId={`activeSellerNavIndicator_${layoutScope}`}
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
    });

  return (
    <>
      {/* Mobile Trigger — opens the slide-in drawer */}
      <div className="w-full lg:hidden">
        <motion.button
          type="button"
          whileTap={{ scale: 0.98 }}
          onClick={() => setDrawerOpen(true)}
          className="w-full flex items-center justify-between bg-surface border border-border-theme rounded-2xl px-4 py-3.5 shadow-md hover:bg-background/80 transition cursor-pointer"
        >
          <span className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-foreground">
            <i className="ri-menu-2-line text-accent text-base" />
            Seller Menu
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent flex items-center gap-1">
            {currentSection}
            <i className="ri-arrow-right-s-line" />
          </span>
        </motion.button>
      </div>

      {/* Desktop Sidebar with Smooth Floating Layout */}
      <aside className="hidden lg:flex w-64 bg-surface border border-border-theme rounded-[24px] p-6 shrink-0 flex-col gap-6 lg:sticky top-24 z-40 backdrop-blur-md shadow-lg font-sans">
        {/* Seller Profile Widget */}
        <div className="flex items-center justify-between p-3.5 bg-background/60 border border-border-theme rounded-2xl shadow-xs">
          <div className="flex items-center space-x-3 min-w-0">
            <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/30 shrink-0 bg-surface flex items-center justify-center font-extrabold text-accent shadow-inner">
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
              <p className="text-[9px] font-extrabold text-accent uppercase tracking-widest mt-0.5 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse inline-block" />
                SELLER PARTNER
              </p>
            </div>
          </div>
        </div>

        {/* Desktop Nav Links */}
        <nav className="flex flex-col gap-1.5 relative">
          {renderMenuItems("desktop", false)}
        </nav>
      </aside>

      {/* Mobile Drawer — slides in from the right with spring animation */}
      <AnimatePresence>
        {drawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setDrawerOpen(false)}
              className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-md lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 320, damping: 30 }}
              className="fixed top-0 right-0 z-[1201] bg-background w-[85%] max-w-sm h-full p-5 overflow-y-auto scrollbar-hide shadow-2xl border-l border-border-theme lg:hidden flex flex-col justify-between"
            >
              <div className="space-y-6">
                {/* Drawer Header */}
                <div className="flex items-center justify-between pb-4 border-b border-border-theme/60">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-full overflow-hidden border border-accent/30 bg-surface flex items-center justify-center font-extrabold text-accent text-sm shadow-inner">
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
                    <div>
                      <p className="font-extrabold text-xs text-foreground truncate max-w-[150px]">
                        {user?.fullname || user?.username}
                      </p>
                      <p className="text-[9px] font-extrabold text-accent uppercase tracking-widest flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
                        SELLER PARTNER
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setDrawerOpen(false)}
                    className="w-9 h-9 rounded-full bg-surface border border-border-theme hover:bg-surface-variant/40 flex items-center justify-center cursor-pointer text-foreground/70 hover:text-foreground transition"
                    aria-label="Close seller menu"
                  >
                    <i className="ri-close-line text-lg" />
                  </button>
                </div>

                {/* Drawer Links */}
                <nav className="flex flex-col gap-1.5 relative">
                  {renderMenuItems("mobile", true)}
                </nav>
              </div>

              {/* Drawer Footer */}
              <div className="pt-4 border-t border-border-theme/60 text-center">
                <p className="text-[10px] text-foreground/40 font-mono">
                  ScapeGoat Seller Workspace
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SellerNavbar;
