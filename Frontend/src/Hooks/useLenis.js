import { useEffect, useRef } from "react";
import Lenis from "lenis";
import gsap from "gsap";
import { useLocation } from "react-router-dom";
import "lenis/dist/lenis.css";

/**
 * Custom hook for ultra-smooth inertia scrolling powered by Lenis.
 * Synchronizes seamlessly with GSAP ticker, ScrollTrigger, and React Router navigation.
 */
export const useLenis = () => {
  const lenisRef = useRef(null);
  const location = useLocation();

  useEffect(() => {
    // 1. Initialize Lenis Smooth Scroll Instance
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)), // Exponential smooth deceleration
      orientation: "vertical",
      gestureOrientation: "vertical",
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });

    lenisRef.current = lenis;

    // 2. Synchronize Lenis RAF with GSAP Ticker for 60/120fps fluid animations
    const updateRaf = (time) => {
      lenis.raf(time * 1000);
    };

    gsap.ticker.add(updateRaf);
    gsap.ticker.lagSmoothing(0);

    // 3. Clean up on unmount
    return () => {
      gsap.ticker.remove(updateRaf);
      lenis.destroy();
      lenisRef.current = null;
    };
  }, []);

  // 4. Reset scroll position instantly to top on Route Changes
  useEffect(() => {
    if (lenisRef.current) {
      lenisRef.current.scrollTo(0, { immediate: true });
    } else {
      window.scrollTo(0, 0);
    }
  }, [location.pathname]);

  return lenisRef;
};
