import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import { getActiveBannersApi } from "../../Admin/Services/banner.api.js";

// Helper for countdown display
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

const BannerCarousel = ({ page = "home", placement = "hero" }) => {
  const [banners, setBanners] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [countdownText, setCountdownText] = useState("");
  const [currentDevice, setCurrentDevice] = useState(getCurrentDevice());
  const navigate = useNavigate();
  const timerRef = useRef(null);
  const containerRef = useRef(null);

  // Device resize listener
  useEffect(() => {
    const handleResize = () => setCurrentDevice(getCurrentDevice());
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Fetch active banners for target page & placement
  useEffect(() => {
    const fetchBanners = async () => {
      try {
        const query = { page };
        if (placement) query.placement = placement;
        const data = await getActiveBannersApi(query);
        if (data.banners && data.banners.length > 0) {
          // Strictly filter by placement if placement prop is provided
          const matchedPlacement = placement
            ? data.banners.filter((b) => b.placement === placement)
            : data.banners;

          const eligible = matchedPlacement.filter((b) => isDeviceEligible(b, currentDevice));
          if (eligible.length > 0) {
            setBanners(eligible);
            const img = new Image();
            img.src = eligible[0].image;
            img.onload = () => setLoaded(true);
            img.onerror = () => setLoaded(true);
          } else {
            setBanners([]);
            setLoaded(false);
          }
        } else {
          setBanners([]);
          setLoaded(false);
        }
      } catch (err) {
        console.error(`Failed to fetch banners for page ${page}:`, err);
      }
    };
    fetchBanners();

    const handleRealtimeUpdate = (event) => {
      const { type } = event.detail || {};
      if (type?.startsWith("BANNER_")) {
        fetchBanners();
      }
    };
    window.addEventListener("banner_update", handleRealtimeUpdate);
    return () => window.removeEventListener("banner_update", handleRealtimeUpdate);
  }, [page, placement, currentDevice]);

  // Ticking offer timer
  useEffect(() => {
    const currentBanner = banners[currentIndex];
    if (currentBanner?.timerOverlay?.showTimer) {
      setCountdownText(formatCountdown(currentBanner.timerOverlay.endDate));
      const interval = setInterval(() => {
        setCountdownText(formatCountdown(currentBanner.timerOverlay.endDate));
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [banners, currentIndex]);

  // Auto-advance slider
  useEffect(() => {
    if (banners.length <= 1 || isPaused) return;
    timerRef.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % banners.length);
    }, 5000);
    return () => clearInterval(timerRef.current);
  }, [banners.length, isPaused]);

  // GSAP entrance animation
  useEffect(() => {
    if (loaded && containerRef.current) {
      gsap.fromTo(
        containerRef.current,
        { opacity: 0, y: 20, scale: 0.99 },
        { opacity: 1, y: 0, scale: 1, duration: 0.6, ease: "power3.out" }
      );
    }
  }, [loaded]);

  const goTo = useCallback((index) => {
    setCurrentIndex(index);
  }, []);

  const goNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % banners.length);
  }, [banners.length]);

  const goPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
  }, [banners.length]);

  const handleBannerClick = useCallback((banner) => {
    if (banner.link && banner.link !== "#") {
      if (banner.link.startsWith("http")) {
        window.open(banner.link, "_blank");
      } else {
        navigate(banner.link);
      }
    }
  }, [navigate]);

  const handleButtonClick = useCallback((e, btn) => {
    e.stopPropagation();
    if (btn.link && btn.link !== "#") {
      if (btn.link.startsWith("http")) {
        window.open(btn.link, "_blank");
      } else {
        navigate(btn.link);
      }
    }
  }, [navigate]);

  // Get device-appropriate image
  const getBannerImage = useCallback((banner) => {
    const width = window.innerWidth;
    if (width < 640 && banner.mobileImage) return banner.mobileImage;
    if (width < 1024 && banner.tabletImage) return banner.tabletImage;
    return banner.image;
  }, []);

  if (banners.length === 0 || !loaded) return null;

  const currentBanner = banners[currentIndex];

  const containerClass =
    placement === "sidebar"
      ? "w-full max-w-[360px] mx-auto px-2 mb-6"
      : placement === "inline"
      ? "w-full max-w-[1300px] mx-auto px-2 sm:px-6 my-6"
      : "w-full max-w-[1300px] mx-auto px-2 sm:px-6 mb-8";

  const calcAspect = currentBanner.aspectRatio
    ? currentBanner.aspectRatio.replace(":", "/")
    : placement === "sidebar"
    ? "4/5"
    : "21/5";

  return (
    <div
      ref={containerRef}
      className={containerClass}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      style={{ opacity: 0 }}
    >
      <motion.div
        layout
        className="relative w-full rounded-[24px] sm:rounded-[36px] overflow-hidden shadow-2xl border border-border-theme/20"
        style={{ aspectRatio: calcAspect }}
      >
        {/* Banner Slide */}
        <AnimatePresence mode="popLayout">
          <motion.div
            key={currentIndex}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
            className="absolute inset-0 w-full h-full cursor-pointer select-none"
            onClick={() => handleBannerClick(currentBanner)}
            style={{ backgroundColor: currentBanner.backgroundColor || "transparent" }}
          >
            <img
              src={getBannerImage(currentBanner)}
              alt={currentBanner.altText || currentBanner.title}
              className="w-full h-auto object-cover"
              draggable={false}
            />

            {/* Offer Countdown Timer Overlay */}
            {currentBanner.timerOverlay?.showTimer && (
              <div
                className="absolute shadow-xl z-20"
                style={{
                  left: `${currentBanner.timerOverlay.positionX}%`,
                  top: `${currentBanner.timerOverlay.positionY}%`,
                  transform: "translate(-50%, -50%)",
                  backgroundColor: currentBanner.timerOverlay.bgColor || "rgba(0,0,0,0.75)",
                  color: currentBanner.timerOverlay.textColor || "#ffffff",
                  borderRadius: `${currentBanner.timerOverlay.borderRadius || 12}px`,
                  fontSize: `${currentBanner.timerOverlay.fontSize || 14}px`,
                  padding: `${currentBanner.timerOverlay.paddingY || 10}px ${currentBanner.timerOverlay.paddingX || 18}px`,
                }}
              >
                <div className="flex items-center gap-2 font-bold whitespace-nowrap">
                  <i className="ri-time-line text-amber-400" />
                  <span>{currentBanner.timerOverlay.label}</span>
                  <span className="font-mono text-amber-400 tracking-wider bg-amber-400/10 px-2 py-0.5 rounded-lg border border-amber-400/30">
                    {countdownText}
                  </span>
                </div>
              </div>
            )}

            {/* Studio Elements: Interactive CTA Buttons with Link Redirection */}
            {Array.isArray(currentBanner.elements) && currentBanner.elements.length > 0 ? (
              currentBanner.elements
                .filter(el => el.type === "button" && el.isVisible !== false)
                .map(el => {
                  const cWidth = currentBanner.canvasWidth || 1200;
                  const cHeight = currentBanner.canvasHeight || 500;
                  const leftPct = (el.x / cWidth) * 100;
                  const topPct = (el.y / cHeight) * 100;
                  const widthPct = (el.width / cWidth) * 100;
                  const heightPct = (el.height / cHeight) * 100;

                  return (
                    <a
                      key={el.id}
                      href={el.link || "#"}
                      onClick={(e) => {
                        e.stopPropagation();
                        if (el.link && el.link !== "#") {
                          if (el.link.startsWith("http")) window.open(el.link, "_blank");
                          else navigate(el.link);
                        }
                      }}
                      title={el.link ? `Redirect to ${el.link}` : "CTA Button"}
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
                        fontSize: `clamp(11px, 1.2vw, ${el.fontSize || 14}px)`,
                      }}
                    >
                      {el.content || "SHOP NOW"}
                    </a>
                  );
                })
            ) : (
              currentBanner.buttons?.map((btn, idx) => (
                <button
                  key={idx}
                  onClick={(e) => handleButtonClick(e, btn)}
                  className="absolute shadow-lg hover:shadow-xl transition-all hover:scale-105 active:scale-95 cursor-pointer font-bold z-20"
                  style={{
                    left: `${btn.positionX}%`,
                    top: `${btn.positionY}%`,
                    transform: "translate(-50%, -50%)",
                    backgroundColor: btn.bgColor || "#ffffff",
                    color: btn.textColor || "#000000",
                    borderColor: btn.borderColor || "#ffffff",
                    borderWidth: `${btn.borderWidth || 0}px`,
                    borderRadius: `${btn.borderRadius || 8}px`,
                    fontSize: `${btn.fontSize || 14}px`,
                    padding: `${btn.paddingY || 12}px ${btn.paddingX || 24}px`,
                  }}
                >
                  {btn.text}
                </button>
              ))
            )}

            {/* Gradient overlays for text readability */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-black/40 to-transparent pointer-events-none" />
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {banners.length > 1 && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); goPrev(); }}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition cursor-pointer z-30"
            >
              <i className="ri-arrow-left-s-line text-xl sm:text-2xl" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); goNext(); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-white/15 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white hover:bg-white/30 transition cursor-pointer z-30"
            >
              <i className="ri-arrow-right-s-line text-xl sm:text-2xl" />
            </button>
          </>
        )}

        {/* Dot Indicators */}
        {banners.length > 1 && (
          <div className="absolute bottom-4 sm:bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-2 z-30">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={(e) => { e.stopPropagation(); goTo(idx); }}
                className={`rounded-full transition-all duration-300 cursor-pointer ${idx === currentIndex ? "w-8 h-2.5 bg-white shadow-lg" : "w-2.5 h-2.5 bg-white/40 hover:bg-white/70"}`}
              />
            ))}
          </div>
        )}

        {/* Progress Bar */}
        {banners.length > 1 && !isPaused && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10 z-30">
            <motion.div
              key={currentIndex}
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 5, ease: "linear" }}
              className="h-full bg-white/60 rounded-full"
            />
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default BannerCarousel;
