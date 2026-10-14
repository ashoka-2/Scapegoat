import { useState, useEffect, useRef, useCallback } from "react";
import Navbar from "../Shared/Navbar.jsx";
import { Link, Outlet, useNavigate } from "react-router";
import { flushSync } from "react-dom";
import { useSelector } from "react-redux";
import Footer from "../Shared/Footer.jsx";
import { createAnimation, TRANSITION_CONFIG } from "../utils/themeTransition.js";

import CartDrawer from "../Features/Cart/Components/CartDrawer.jsx";
import PopupBanner from "../Components/PopupBanner.jsx";
import MobileBottomNav from "../Shared/MobileBottomNav.jsx";

import socket from "../utils/socket.js";
import { useDispatch } from "react-redux";
import { getAllProductsApi } from "../Features/Products/Services/product.api.js";
import { setProducts } from "../Features/Products/State/product.slice.js";
import { useWishlist } from "../Features/Wishlist/Hooks/useWishlist.js";
import { useCart } from "../Features/Cart/Hooks/useCart.js";
import { clearWishlist } from "../Features/Wishlist/State/wishlist.slice.js";
import { clearCart } from "../Features/Cart/State/cart.slice.js";
import ScrollToTop from "../Components/ScrollToTop.jsx";
import ScrollToTopButton from "../Components/ScrollToTopButton.jsx";
import { useActiveHeartbeat } from "../Hooks/useActiveHeartbeat.js";
import { useLenis } from "../Hooks/useLenis.js";
import FloatingAIWidget from "../Features/AI/Components/FloatingAIWidget.jsx";

const COOKIE_CONSENT_KEY = "scapegoat_cookie_consent";

const PrivacyChoices = () => {
  const [visible, setVisible] = useState(() => !localStorage.getItem(COOKIE_CONSENT_KEY));
  const choose = (choice) => {
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify({ choice, updatedAt: new Date().toISOString() }));
    setVisible(false);
  };
  if (!visible) return null;

  return (
    <aside role="dialog" aria-label="Cookie preferences" className="fixed z-[120] bottom-4 left-4 right-4 md:left-auto md:right-6 md:w-[440px] bg-surface/95 backdrop-blur-xl border border-border-theme shadow-2xl rounded-3xl p-5 sm:p-6">
      <div className="flex gap-3">
        <i className="ri-shield-check-line text-2xl text-accent" aria-hidden="true" />
        <div className="space-y-3">
          <h2 className="font-black text-sm uppercase tracking-wide">Your cookie choices</h2>
          <p className="text-xs leading-relaxed text-foreground/70">Essential cookies keep sign-in, carts, and security working. Optional cookies help us improve ScapeGoat.</p>
          <Link to="/cookie-policy" className="text-xs font-bold text-accent underline underline-offset-4">Read the cookie policy</Link>
          <div className="flex flex-wrap gap-2 pt-1">
            <button onClick={() => choose("essential")} className="px-4 py-2 rounded-full border border-border-theme text-xs font-black uppercase tracking-wide hover:bg-background cursor-pointer">Essential only</button>
            <button onClick={() => choose("all")} className="px-4 py-2 rounded-full bg-accent text-accent-content text-xs font-black uppercase tracking-wide hover:opacity-90 cursor-pointer">Accept all</button>
          </div>
        </div>
      </div>
    </aside>
  );
};

const STYLE_ID = "theme-transition-style";

const MainLayout = () => {
  useLenis();
  useActiveHeartbeat();
  const dispatch = useDispatch();
  const user = useSelector((state) => state.auth.user);
  const navigate = useNavigate();
  const { getWishlist } = useWishlist();
  const { handleGetCart } = useCart();

  const userId = user?._id || user?.id;

  useEffect(() => {
    const token = localStorage.getItem("scapegoat_token");
    socket.auth = token ? { token } : {};
    if (socket.connected) {
      socket.disconnect();
      socket.connect();
    }
  }, [userId]);

  useEffect(() => {
    if (userId) {
      getWishlist();
      handleGetCart();
    } else {
      dispatch(clearWishlist());
      dispatch(clearCart());
    }
  }, [userId]);

  useEffect(() => {
    const handleLiveProductUpdate = async (data) => {
      try {
        const res = await getAllProductsApi();
        if (res) dispatch(setProducts(res));
      } catch (e) {
        console.error("Socket product sync error:", e);
      }
    };

    socket.on("product_published", handleLiveProductUpdate);
    socket.on("product_updated", handleLiveProductUpdate);
    socket.on("product_deleted", handleLiveProductUpdate);

    return () => {
      socket.off("product_published", handleLiveProductUpdate);
      socket.off("product_updated", handleLiveProductUpdate);
      socket.off("product_deleted", handleLiveProductUpdate);
    };
  }, [dispatch]);

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
      <ScrollToTop />
      <div className="max-w-[1440px] w-full mx-auto px-4 md:px-6 py-4 md:py-6 flex-grow">
        <Navbar toggleTheme={toggleTheme} isDarkMode={isDarkMode} />
        <main className="pt-16 md:pt-20 w-full relative z-10 pb-20">
          <Outlet />
        </main>
      </div>
      <Footer />
      <CartDrawer />
      <PopupBanner />
      <ScrollToTopButton />
      <FloatingAIWidget />
      <PrivacyChoices />
      <MobileBottomNav />
    </div>
  );
};

export default MainLayout;
