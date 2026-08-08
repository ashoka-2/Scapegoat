import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { getActiveBannersApi } from "../Features/Admin/Services/banner.api.js";
import { loadGoogleFont } from "../Features/Admin/Components/Canvas/canvasHelpers.js";

// ─── Helpers ────────────────────────────────────────────────────────────────

const STORAGE_KEY = "sg_popup_banner_log";

/**
 * Check if a popup banner should be shown based on frequency and times-per-day
 */
const shouldShowPopup = (bannerId, showTimesPerDay = 1) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const log = raw ? JSON.parse(raw) : {};
    const entry = log[bannerId];
    if (!entry) return true;

    const today = new Date().toDateString();
    if (entry.date !== today) return true;
    if (entry.count < showTimesPerDay) return true;

    return false;
  } catch {
    return true;
  }
};

/**
 * Record that the popup was shown to the user
 */
const recordPopupShown = (bannerId) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const log = raw ? JSON.parse(raw) : {};
    const today = new Date().toDateString();
    const entry = log[bannerId];

    if (!entry || entry.date !== today) {
      log[bannerId] = { date: today, count: 1 };
    } else {
      log[bannerId] = { date: today, count: entry.count + 1 };
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(log));
  } catch {
    // silent
  }
};

const formatCountdown = (targetDate) => {
  if (!targetDate) return "12h 45m 30s";
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return "Offer Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m`;
  return `${hours}h ${mins}m ${secs}s`;
};

/**
 * Get the current "page" name from pathname
 */
const getPageFromPath = (pathname) => {
  if (pathname === "/") return "home";
  const segment = pathname.split("/").filter(Boolean)[0];
  return segment || "home";
};

const getCurrentDevice = () => {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
};

const isDeviceEligible = (b, device) => {
  if (!b.deviceTargets || !Array.isArray(b.deviceTargets) || b.deviceTargets.length === 0) {
    return true;
  }
  return b.deviceTargets.includes(device);
};

// ─── Component ──────────────────────────────────────────────────────────────

const PopupBanner = () => {
  const [banner, setBanner] = useState(null);
  const [isVisible, setIsVisible] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [autoCloseCountdown, setAutoCloseCountdown] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  const overlayRef = useRef(null);
  const contentRef = useRef(null);
  const autoCloseTimerRef = useRef(null);
  const countdownRef = useRef(null);

  // Fetch promotional banners for the current page
  useEffect(() => {
    const currentPage = getPageFromPath(location.pathname);
    const device = getCurrentDevice();

    const fetchPopup = async () => {
      try {
        const data = await getActiveBannersApi({ placement: "promotional", page: currentPage });
        if (data.banners && data.banners.length > 0) {
          // Find first banner that passes device target & frequency check
          const eligible = data.banners.find((b) =>
            isDeviceEligible(b, device) && shouldShowPopup(b._id, b.showTimesPerDay || 1)
          );
          if (eligible) {
            setBanner(eligible);
            setImageLoaded(false);
          } else {
            setBanner(null);
          }
        } else {
          setBanner(null);
        }
      } catch (err) {
        console.error("Failed to fetch popup banners:", err);
      }
    };

    // Reset on page change
    setIsVisible(false);
    setBanner(null);
    fetchPopup();

    return () => {
      clearTimeout(autoCloseTimerRef.current);
      clearInterval(countdownRef.current);
    };
  }, [location.pathname]);

  // Load Google Fonts for active popup banner
  useEffect(() => {
    if (banner?.elements && Array.isArray(banner.elements)) {
      banner.elements.forEach((el) => {
        if (el.fontFamily) {
          loadGoogleFont(el.fontFamily);
        }
      });
    }
  }, [banner]);

  // Show the popup after the image is loaded + popupDelay
  useEffect(() => {
    if (!banner || !imageLoaded) return;

    const delay = (banner.popupDelay || 0) * 1000;
    const timer = setTimeout(() => {
      setIsVisible(true);
      recordPopupShown(banner._id);

      // GSAP entrance animation
      if (contentRef.current) {
        gsap.fromTo(
          contentRef.current,
          { opacity: 0, scale: 0.9, y: 40 },
          { opacity: 1, scale: 1, y: 0, duration: 0.5, ease: "back.out(1.7)" }
        );
      }

      // Auto-close logic
      if (banner.autoCloseSeconds > 0) {
        setAutoCloseCountdown(banner.autoCloseSeconds);

        countdownRef.current = setInterval(() => {
          setAutoCloseCountdown((prev) => {
            if (prev <= 1) {
              clearInterval(countdownRef.current);
              return 0;
            }
            return prev - 1;
          });
        }, 1000);

        autoCloseTimerRef.current = setTimeout(() => {
          handleClose();
        }, banner.autoCloseSeconds * 1000);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [banner, imageLoaded]);

  const handleClose = useCallback(() => {
    clearTimeout(autoCloseTimerRef.current);
    clearInterval(countdownRef.current);

    if (contentRef.current) {
      gsap.to(contentRef.current, {
        opacity: 0,
        scale: 0.9,
        y: 20,
        duration: 0.3,
        ease: "power2.in",
        onComplete: () => setIsVisible(false),
      });
    } else {
      setIsVisible(false);
    }
  }, []);

  const handleBannerClick = useCallback(() => {
    if (banner?.link && banner.link !== "#") {
      handleClose();
      if (banner.link.startsWith("http")) {
        window.open(banner.link, "_blank");
      } else {
        navigate(banner.link);
      }
    }
  }, [banner, navigate, handleClose]);

  const handleButtonClick = useCallback((e, btn) => {
    e.stopPropagation();
    handleClose();
    if (btn.link && btn.link !== "#") {
      if (btn.link.startsWith("http")) {
        window.open(btn.link, "_blank");
      } else {
        navigate(btn.link);
      }
    }
  }, [navigate, handleClose]);

  // Preload the banner image
  useEffect(() => {
    if (!banner) return;
    const img = new Image();
    const width = window.innerWidth;
    let src = banner.image;
    if (width < 640 && banner.mobileImage) src = banner.mobileImage;
    else if (width < 1024 && banner.tabletImage) src = banner.tabletImage;

    img.src = src;
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true);
  }, [banner]);

  if (!banner || !isVisible) return null;

  // Get device-appropriate image
  const width = window.innerWidth;
  let displayImage = banner.image;
  if (width < 640 && banner.mobileImage) displayImage = banner.mobileImage;
  else if (width < 1024 && banner.tabletImage) displayImage = banner.tabletImage;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          ref={overlayRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-md px-4"
          onClick={(e) => {
            if (e.target === overlayRef.current && banner.dismissible) handleClose();
          }}
        >
          <div
            ref={contentRef}
            className="relative max-w-2xl w-full rounded-3xl overflow-hidden shadow-[0_40px_120px_rgba(0,0,0,0.6)] border border-white/10"
          >
            {/* Close Button */}
            {banner.dismissible && (
              <button
                onClick={handleClose}
                className="absolute top-3 right-3 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center text-white hover:bg-black/70 transition cursor-pointer border border-white/20"
              >
                <i className="ri-close-line text-lg" />
              </button>
            )}

            {/* Auto-close countdown ring */}
            {autoCloseCountdown > 0 && (
              <div className="absolute top-3 left-3 z-30 w-9 h-9 rounded-full bg-black/50 backdrop-blur-xl flex items-center justify-center border border-white/20">
                <span className="text-white text-xs font-bold">{autoCloseCountdown}</span>
                <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 36 36">
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="rgba(255,255,255,0.3)"
                    strokeWidth="2"
                  />
                  <circle
                    cx="18" cy="18" r="15"
                    fill="none"
                    stroke="white"
                    strokeWidth="2"
                    strokeDasharray={`${(autoCloseCountdown / (banner.autoCloseSeconds || 1)) * 94.25} 94.25`}
                    strokeLinecap="round"
                    className="transition-all duration-1000 ease-linear"
                  />
                </svg>
              </div>
            )}

            {/* Banner Image */}
            <div
              className="relative cursor-pointer select-none [container-type:inline-size]"
              onClick={handleBannerClick}
              style={{ backgroundColor: banner.backgroundColor || "transparent" }}
            >
              <img
                src={displayImage}
                alt={banner.altText || banner.title}
                className="w-full h-auto object-cover"
                draggable={false}
              />

              {/* Offer Countdown Timer Overlay */}
              {banner.timerOverlay?.showTimer && (
                <div
                  className="absolute shadow-xl z-20"
                  style={{
                    left: `${banner.timerOverlay.positionX}%`,
                    top: `${banner.timerOverlay.positionY}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: banner.timerOverlay.bgColor || "rgba(0,0,0,0.75)",
                    color: banner.timerOverlay.textColor || "#ffffff",
                    borderRadius: `${banner.timerOverlay.borderRadius || 12}px`,
                    fontSize: `${banner.timerOverlay.fontSize || 14}px`,
                    padding: `${banner.timerOverlay.paddingY || 10}px ${banner.timerOverlay.paddingX || 18}px`,
                  }}
                >
                  <div className="flex items-center gap-2 font-bold whitespace-nowrap">
                    <i className="ri-time-line text-amber-400" />
                    <span>{banner.timerOverlay.label}</span>
                  </div>
                </div>
              )}

              {/* Studio Elements: Text Layers, Interactive CTA Buttons & Live Countdown Timers */}
              {Array.isArray(banner.elements) && banner.elements.length > 0 ? (
                banner.elements
                  .filter(el => (el.type === "text" || el.type === "button" || el.type === "timer") && el.isVisible !== false)
                  .map(el => {
                    const cWidth = banner.canvasWidth || 1200;
                    const cHeight = banner.canvasHeight || 500;
                    const leftPct = (el.x / cWidth) * 100;
                    const topPct = (el.y / cHeight) * 100;
                    const widthPct = (el.width / cWidth) * 100;
                    const heightPct = (el.height / cHeight) * 100;
                    const fontSizeCqw = ((el.fontSize || 24) / cWidth) * 100;

                    if (el.type === "text") {
                      return (
                        <div
                          key={el.id}
                          className="absolute z-20 flex items-center select-none leading-tight pointer-events-none"
                          style={{
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            width: `${widthPct}%`,
                            height: `${heightPct}%`,
                            fontFamily: el.fontFamily || "Inter",
                            fontSize: `${fontSizeCqw}cqw`,
                            fontWeight: el.fontWeight || "bold",
                            textAlign: el.textAlign || "left",
                            justifyContent: el.textAlign === "center" ? "center" : el.textAlign === "right" ? "flex-end" : "flex-start",
                            color: el.textColor || el.color || "#ffffff",
                            letterSpacing: el.letterSpacing ? `${el.letterSpacing}px` : "normal",
                            lineHeight: el.lineHeight ? `${el.lineHeight}` : "normal",
                            textShadow: el.shadowColor ? `${el.shadowX || 0}px ${el.shadowY || 2}px ${el.shadowBlur || 4}px ${el.shadowColor}` : "none",
                          }}
                        >
                          <span
                            style={el.isGradientText ? {
                              backgroundImage: el.textGradient || "linear-gradient(to right, #4facfe, #00f2fe)",
                              WebkitBackgroundClip: "text",
                              WebkitTextFillColor: "transparent",
                            } : {}}
                          >
                            {el.content}
                          </span>
                        </div>
                      );
                    }

                    if (el.type === "timer") {
                      return (
                        <div
                          key={el.id}
                          className="absolute z-20 flex items-center justify-center font-bold shadow-lg select-none"
                          style={{
                            left: `${leftPct}%`,
                            top: `${topPct}%`,
                            width: `${widthPct}%`,
                            height: `${heightPct}%`,
                            backgroundColor: el.bgColor || "rgba(0,0,0,0.75)",
                            color: el.textColor || "#ffffff",
                            borderColor: el.borderColor || "#ffffff",
                            borderWidth: `${el.borderWidth || 0}px`,
                            borderRadius: `${el.borderRadius || 12}px`,
                            fontSize: `${((el.fontSize || 14) / cWidth) * 100}cqw`,
                          }}
                        >
                          <div className="flex items-center gap-1.5 whitespace-nowrap px-2 font-bold">
                            <i className="ri-time-line text-amber-400" />
                            <span>{el.label || el.content || "OFFER ENDS IN:"}</span>
                            <span className="font-mono text-amber-400 tracking-wider bg-amber-400/10 px-1.5 py-0.5 rounded border border-amber-400/30">
                              {formatCountdown(el.endDate || banner.timerOverlay?.endDate || banner.endDate)}
                            </span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <a
                        key={el.id}
                        href={el.link || "#"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleClose();
                          if (el.link && el.link !== "#") {
                            if (el.link.startsWith("http")) window.open(el.link, "_blank");
                            else navigate(el.link);
                          }
                        }}
                        className="absolute z-20 flex items-center justify-center font-bold no-underline shadow-lg hover:shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
                        style={{
                          left: `${leftPct}%`,
                          top: `${topPct}%`,
                          width: `${widthPct}%`,
                          height: `${heightPct}%`,
                          backgroundColor: el.bgColor || "#ffffff",
                          color: el.textColor || "#000000",
                          borderColor: el.borderColor || "#ffffff",
                          borderWidth: `${el.borderWidth || 0}px`,
                          borderRadius: `${el.borderRadius || 12}px`,
                          fontSize: `${((el.fontSize || 14) / cWidth) * 100}cqw`,
                        }}
                      >
                        {el.content || "SHOP NOW"}
                      </a>
                    );
                  })
              ) : (
                banner.buttons?.map((btn, idx) => (
                  <button
                    key={idx}
                    onClick={(e) => handleButtonClick(e, btn)}
                    className="absolute shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer font-bold"
                    style={{
                      left: `${btn.positionX}%`,
                      top: `${btn.positionY}%`,
                      transform: "translate(-50%, -50%)",
                      backgroundColor: btn.bgColor || "#ffffff",
                      color: btn.textColor || "#000000",
                      borderRadius: `${btn.borderRadius || 8}px`,
                      fontSize: `${btn.fontSize || 14}px`,
                      padding: `${btn.paddingY || 12}px ${btn.paddingX || 24}px`,
                    }}
                  >
                    {btn.text}
                  </button>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default PopupBanner;
