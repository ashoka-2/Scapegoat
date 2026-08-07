import React, { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import { Outlet } from "react-router-dom";
import SellerNavbar from "./SellerNavbar";
import Navbar from "../../../Shared/Navbar.jsx";
import Footer from "../../../Shared/Footer.jsx";
import CartDrawer from "../../../Features/Cart/Components/CartDrawer.jsx";
import ScrollToTop from "../../../Components/ScrollToTop.jsx";
import ScrollToTopButton from "../../../Components/ScrollToTopButton.jsx";
import { useLenis } from "../../../Hooks/useLenis.js";
import { useActiveHeartbeat } from "../../../Hooks/useActiveHeartbeat.js";
import { createAnimation, TRANSITION_CONFIG } from "../../../utils/themeTransition.js";

const STYLE_ID = "theme-transition-style";

const SellerLayout = () => {
  useLenis();
  useActiveHeartbeat();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return document.documentElement.classList.contains("dark");
  });

  const isTransitioning = useRef(false);

  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) root.classList.add("dark");
    else root.classList.remove("dark");
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const applyTransitionStyles = useCallback((css) => {
    let styleEl = document.getElementById(STYLE_ID);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = STYLE_ID;
      document.head.appendChild(styleEl);
    }
    styleEl.textContent = css;
  }, []);

  const toggleTheme = useCallback(() => {
    if (isTransitioning.current) return;

    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    if (!document.startViewTransition || prefersReducedMotion) {
      setIsDarkMode((prev) => !prev);
      return;
    }

    const animation = createAnimation(
      TRANSITION_CONFIG.variant,
      TRANSITION_CONFIG.start,
      TRANSITION_CONFIG.gifUrl
    );
    applyTransitionStyles(animation.css);

    isTransitioning.current = true;
    const transition = document.startViewTransition(() => {
      flushSync(() => {
        setIsDarkMode((prev) => !prev);
      });
    });

    transition.finished.finally(() => {
      isTransitioning.current = false;
      document.getElementById(STYLE_ID)?.remove();
    });
  }, [applyTransitionStyles]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans antialiased flex flex-col w-full overflow-x-clip">
      <ScrollToTop />

      {/* Full-width Top Navigation Header */}
      <div className="w-full px-4 md:px-8 py-4">
        <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
      </div>

      {/* 100% Full-width Seller Workspace Layout */}
      <div className="w-full px-4 md:px-8 flex flex-col lg:flex-row gap-6 items-start flex-grow pt-16 md:pt-20 pb-16">
        {/* Left Seller Sidebar */}
        <SellerNavbar />

        {/* Full Width Workspace Main Content Pane */}
        <main className="flex-1 w-full min-w-0 bg-surface/50 border border-border-theme rounded-[24px] p-6 md:p-8 backdrop-blur-md shadow-sm">
          <Outlet />
        </main>
      </div>

      <Footer />
      <CartDrawer />
      <ScrollToTopButton />
    </div>
  );
};

export default SellerLayout;
