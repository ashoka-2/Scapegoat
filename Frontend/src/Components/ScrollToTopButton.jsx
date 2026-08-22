import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";

const EXCLUDED_ROUTES = ["/login", "/register"];

/**
 * ScrollToTopButton Component
 * Floating scroll-to-top button at bottom right (fixed bottom-6 right-6 z-40).
 * Hidden when user is at the top of the page (scrollY <= 100).
 * Shows single <i className="ri-arrow-up-s-line"></i> by default,
 * and switches to double filled <i className="ri-arrow-up-double-fill"></i> on click with dynamic GSAP rocket animation.
 */
const ScrollToTopButton = () => {
  const { pathname } = useLocation();
  const [isVisible, setIsVisible] = useState(false);
  const [isClicked, setIsClicked] = useState(false);

  const buttonRef = useRef(null);
  const iconRef = useRef(null);
  const flashRingRef = useRef(null);

  // Hide on excluded pages like login and register
  const isExcluded = EXCLUDED_ROUTES.includes(pathname);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 100) {
        setIsVisible(true);
      } else {
        setIsVisible(false);
      }
    };

    // Check scroll position on mount
    handleScroll();

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleClick = () => {
    setIsClicked(true);

    if (buttonRef.current && iconRef.current) {
      const tl = gsap.timeline({
        onComplete: () => {
          setTimeout(() => setIsClicked(false), 600);
        },
      });

      // 1. Flash Shockwave Ring Expansion
      if (flashRingRef.current) {
        gsap.fromTo(
          flashRingRef.current,
          { scale: 0.8, opacity: 0.9 },
          { scale: 2.2, opacity: 0, duration: 0.5, ease: "power2.out" }
        );
      }

      // 2. High-energy Haptic Shake & Launch Kick
      tl.to(buttonRef.current, {
        x: () => (Math.random() - 0.5) * 14,
        y: () => (Math.random() - 0.5) * 14,
        rotation: () => (Math.random() - 0.5) * 10,
        scale: 1.15,
        duration: 0.04,
        repeat: 5,
        yoyo: true,
        ease: "rough",
      })
      .to(buttonRef.current, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: 0.15,
        ease: "power2.out",
      });

      // 3. Icon Rocket Shoot Up & Re-entry Loop
      gsap.timeline()
        .to(iconRef.current, {
          y: -40,
          opacity: 0,
          scale: 1.4,
          duration: 0.25,
          ease: "power3.in",
        })
        .fromTo(
          iconRef.current,
          { y: 40, opacity: 0, scale: 0.8 },
          { y: 0, opacity: 1, scale: 1, duration: 0.35, ease: "back.out(1.7)" }
        );
    }

    // 4. Smooth Scroll to Top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  if (isExcluded) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0, scale: 0.5, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.5, y: 20 }}
          transition={{ type: "spring", stiffness: 300, damping: 22 }}
          className="fixed bottom-24 right-7.5 z-40 flex items-center justify-center"
        >
          {/* Flash Aura Shockwave Ring */}
          <span
            ref={flashRingRef}
            className="absolute inset-0 rounded-full bg-accent border-2 border-accent opacity-0 pointer-events-none"
          />

          <button
            ref={buttonRef}
            type="button"
            onClick={handleClick}
            className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-accent text-accent-content shadow-[0_10px_30px_rgba(0,0,0,0.35)] dark:shadow-[0_10px_30px_rgba(250,106,101,0.4)] flex items-center justify-center cursor-pointer group hover:scale-110 active:scale-90 transition-all overflow-hidden border-2 border-accent-content/20 relative z-10"
            aria-label="Scroll to top"
            title="Scroll to top"
          >
            {/* Dynamic Arrow Icon: Single by default, Double Filled on click */}
            <div ref={iconRef} className="flex items-center justify-center">
              {isClicked ? (
                <i className="ri-arrow-up-double-fill text-2xl font-black drop-shadow-md" />
              ) : (
                <i className="ri-arrow-up-s-line text-2xl font-black transition-transform group-hover:-translate-y-1" />
              )}
            </div>

            {/* Subtle Sheen Light Effect */}
            <span className="absolute inset-0 bg-gradient-to-t from-transparent via-white/25 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ScrollToTopButton;
