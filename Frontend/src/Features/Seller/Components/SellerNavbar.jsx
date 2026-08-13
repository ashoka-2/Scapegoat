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

  const renderMenuItems = (closeOnClick = false) =>
    menuItems.map((item) => {
      const badgeCount = item.badgeKey ? unreadCounts?.[item.badgeKey] || 0 : 0;
      const active = isActive(item.path);

      return (
        <Link
          key={item.path}
          to={item.path}
          onClick={() => handleNavClick(item.badgeKey, closeOnClick)}
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
    });

  return (
    <>
      {/* Mobile Trigger — opens the slide-in drawer (same style as cart/filter) */}
      <div className="w-full lg:hidden">
        <button
          type="button"
          onClick={() => setDrawerOpen(true)}
          className="w-full flex items-center justify-between bg-surface border border-border-theme rounded-2xl px-4 py-3.5 shadow-md hover:bg-background/80 transition cursor-pointer"
        >
          <span className="flex items-center gap-2.5 text-xs font-black uppercase tracking-widest text-foreground">
            <i className="ri-menu-2-line text-accent text-base" />
            Seller Menu
          </span>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-accent">
            {currentSection}
            <i className="ri-arrow-right-s-line ml-1" />
          </span>
        </button>
      </div>

      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-surface border border-border-theme rounded-[24px] p-6 shrink-0 flex-col gap-6 lg:sticky top-24 z-40 backdrop-blur-md shadow-lg font-sans">
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
        <nav className="flex flex-col gap-1.5">{renderMenuItems()}</nav>
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
              transition={{ type: "spring", stiffness: 300, damping: 32 }}
              className="fixed top-0 right-0 z-[1201] bg-background w-[85%] max-w-sm h-full p-5 overflow-y-auto scrollbar-hide shadow-2xl border-l border-border-theme lg:hidden"
            >
              {/* Drawer Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full overflow-hidden border border-accent/30 bg-surface flex items-center justify-center font-extrabold text-accent text-sm">
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
                    <p className="text-[9px] font-extrabold text-accent uppercase tracking-widest">
                      SELLER PARTNER
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  className="w-9 h-9 rounded-full hover:bg-surface-variant/40 flex items-center justify-center cursor-pointer"
                  aria-label="Close seller menu"
                >
                  <i className="ri-close-line text-lg" />
                </button>
              </div>

              {/* Drawer Links */}
              <nav className="flex flex-col gap-1.5">{renderMenuItems(true)}</nav>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SellerNavbar;
