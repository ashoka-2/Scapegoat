import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { useSelector } from "react-redux";

const MobileBottomNav = () => {
  const location = useLocation();
  const user = useSelector((state) => state.auth?.user);
  const totalCartCount = useSelector((state) =>
    state.cart?.items
      ? state.cart.items.reduce((sum, item) => sum + (item.quantity || 1), 0)
      : 0
  );

  const pathname = location.pathname;

  // Define the 5 core tabs with AI in the center
  const navItems = [
    {
      id: "home",
      label: "Home",
      path: "/",
      iconOutline: "ri-home-5-line",
      iconFill: "ri-home-5-fill",
      isActive: pathname === "/",
    },
    {
      id: "shop",
      label: "Shop",
      path: "/shop",
      iconOutline: "ri-store-2-line",
      iconFill: "ri-store-2-fill",
      isActive: pathname.startsWith("/shop") || pathname.startsWith("/categories"),
    },
    {
      id: "ai",
      label: "AI Stylist",
      path: "/ai-assistant",
      iconOutline: "ri-sparkling-2-line",
      iconFill: "ri-sparkling-2-fill",
      isAi: true,
      isActive: pathname.startsWith("/ai-assistant") || pathname.startsWith("/ai-stylist"),
    },
    {
      id: "cart",
      label: "Cart",
      path: "/cart",
      iconOutline: "ri-shopping-bag-3-line",
      iconFill: "ri-shopping-bag-3-fill",
      badgeCount: totalCartCount,
      isActive: pathname.startsWith("/cart"),
    },
    {
      id: "account",
      label: "Account",
      path: user ? "/profile" : "/login",
      iconOutline: "ri-user-3-line",
      iconFill: "ri-user-3-fill",
      isActive:
        pathname.startsWith("/profile") ||
        pathname.startsWith("/my-orders") ||
        pathname.startsWith("/login") ||
        pathname.startsWith("/register"),
    },
  ];

  // Don't render on desktop or on admin dashboard
  if (pathname.startsWith("/admin")) return null;

  return (
    <>
      {/* SVG Filter for Organic Gooey Blur & Morph Effect */}
      <svg className="absolute w-0 h-0 pointer-events-none" aria-hidden="true">
        <defs>
          <filter id="mobile-nav-gooey-effect">
            <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
            <feColorMatrix
              in="blur"
              mode="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -9"
              result="goo"
            />
            <feComposite in="SourceGraphic" in2="goo" operator="atop" />
          </filter>
        </defs>
      </svg>

      {/* Floating Bottom Nav Island (Mobile Only) */}
      <nav
        aria-label="Mobile Navigation"
        className="md:hidden fixed bottom-4 sm:bottom-5 left-1/2 -translate-x-1/2 z-[1000] max-w-[360px] sm:max-w-[380px] w-[94%] select-none"
      >
        <div className="relative flex items-center justify-around px-2 py-1.5 rounded-full bg-surface/90 dark:bg-[#141414]/90 backdrop-blur-2xl border border-white/20 dark:border-white/10 shadow-[0_12px_36px_rgba(0,0,0,0.35)] ring-1 ring-black/5">
          {navItems.map((item) => {
            const active = item.isActive;

            return (
              <Link
                key={item.id}
                to={item.path}
                className="relative flex flex-col items-center justify-center w-12 h-12 rounded-full cursor-pointer group focus:outline-none"
                aria-label={item.label}
              >
                {/* Gooey Animated Active Indicator Background */}
                {active && (
                  <motion.div
                    layoutId="mobile-nav-active-bubble"
                    transition={{
                      type: "spring",
                      stiffness: 450,
                      damping: 30,
                    }}
                    className="absolute inset-1 rounded-full bg-accent shadow-md shadow-accent/30"
                    style={{
                      filter: "url(#mobile-nav-gooey-effect)",
                    }}
                  />
                )}

                {/* Animated Icon */}
                <motion.div
                  whileTap={{ scale: 0.82 }}
                  animate={{
                    scale: active ? 1.12 : 1,
                    y: active ? -1 : 0,
                  }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  className={`relative z-10 flex items-center justify-center transition-colors duration-200 ${
                    active
                      ? "text-accent-content font-black"
                      : "text-foreground/50 group-hover:text-foreground"
                  }`}
                >
                  <i
                    className={`${
                      active ? item.iconFill : item.iconOutline
                    } text-xl leading-none`}
                  />

                  {/* Cart Notification Badge */}
                  {item.id === "cart" && item.badgeCount > 0 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`absolute -top-1.5 -right-2 min-w-[17px] h-[17px] px-1 rounded-full text-[9px] font-black flex items-center justify-center shadow-md border ${
                        active
                          ? "bg-background text-foreground border-border-theme"
                          : "bg-accent text-accent-content border-background"
                      }`}
                    >
                      {item.badgeCount > 99 ? "99+" : item.badgeCount}
                    </motion.span>
                  )}
                </motion.div>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};

export default MobileBottomNav;
