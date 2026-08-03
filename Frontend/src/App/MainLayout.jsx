import React, { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../Components/Navbar.jsx";
import { Outlet, useNavigate } from "react-router";
import { flushSync } from "react-dom";
import { useSelector } from "react-redux";
import Footer from "../Components/Footer.jsx";
import { createAnimation, TRANSITION_CONFIG } from "../utils/themeTransition.js";

import CartDrawer from "../Components/CartDrawer.jsx";

const STYLE_ID = "theme-transition-style";

const MainLayout = () => {
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();

  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return true;
  });

  // Guard: prevents a second click from firing a new transition
  // while one is still animating — this is what was causing the blink.
  const isTransitioning = useRef(false);

  useEffect(() => {
    if (user?.role === "admin") navigate("/admin");
  }, [user, navigate]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
    localStorage.setItem("theme", isDarkMode ? "dark" : "light");
  }, [isDarkMode]);

  const applyTransitionStyles = useCallback((css) => {
    // Reuse a single <style> tag instead of creating/removing a new
    // element every click — avoids duplicate-id / ordering races.
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

    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

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
    <div className="flex flex-col min-h-screen bg-background text-foreground transition-colors duration-500 overflow-x-clip">
      <div className="max-w-[1440px] w-full mx-auto px-4 md:px-6 py-4 md:py-6 flex-grow">
        <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
        <main className="pt-16 md:pt-20 w-full relative z-10 pb-20">
          <Outlet />
        </main>
      </div>
      <Footer />
      <CartDrawer />
    </div>
  );
};

export default MainLayout;