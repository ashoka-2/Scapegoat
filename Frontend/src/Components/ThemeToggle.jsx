import React, { useState, useEffect, useRef, useCallback } from "react";
import { flushSync } from "react-dom";
import { createAnimation, TRANSITION_CONFIG } from "../utils/themeTransition.js";

const STYLE_ID = "theme-transition-style";

const ThemeToggle = ({ className = "", showLabel = false }) => {
  const [isDarkMode, setIsDarkMode] = useState(() => {
    const saved = localStorage.getItem("theme");
    if (saved) return saved === "dark";
    return document.documentElement.classList.contains("dark");
  });

  const isTransitioning = useRef(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDarkMode);
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
   <button
            onClick={toggleTheme}
            className="hidden md:flex hover:text-accent transition-all hover:rotate-90 p-2 text-foreground items-center justify-center w-10 h-10 rounded-full hover:bg-surface-variant/30 cursor-pointer"
            aria-label="Toggle Theme"
          >
            {isDarkMode ? <i className="ri-sun-fill text-xl"></i> : <i className="ri-moon-fill text-xl"></i>}
          </button>
  );
};

export default ThemeToggle;
