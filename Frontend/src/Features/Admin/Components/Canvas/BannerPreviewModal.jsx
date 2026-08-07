import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getCanvasBackgroundCSS, formatCountdown } from "./canvasHelpers";

const BannerPreviewModal = ({
  show,
  onClose,
  title,
  elements = [],
  backgroundColor,
  canvasWidth = 1200,
  canvasHeight = 500,
  previewImageSrc,
  countdownText = "01h 30m 00s",
}) => {
  const [activeDevice, setActiveDevice] = useState("desktop");
  const containerRef = useRef(null);
  const [scale, setScale] = useState(1);

  const DEVICES = [
    { key: "desktop", label: "Desktop", icon: "ri-computer-line", maxW: 1100 },
    { key: "tablet", label: "Tablet", icon: "ri-tablet-line", maxW: 680 },
    { key: "mobile", label: "Mobile", icon: "ri-smartphone-line", maxW: 380 },
  ];

  // Calculate scale factor so elements render proportionally
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver(entries => {
      for (const entry of entries) {
        const renderedW = entry.contentRect.width;
        setScale(renderedW / canvasWidth);
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [canvasWidth, activeDevice, show]);

  if (!show) return null;

  const dev = DEVICES.find(d => d.key === activeDevice);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-6"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.92, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.92, y: 20 }}
          className="relative max-w-6xl w-full bg-background border border-border-theme/30 rounded-2xl overflow-hidden shadow-2xl p-5 space-y-4"
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border-theme/15 pb-3">
            <div className="flex items-center gap-2.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-black text-sm text-foreground">Live Preview — {title || "Banner"}</h3>
              <span className="text-[9px] font-mono text-foreground/40 bg-surface-variant/20 px-2 py-0.5 rounded">
                {canvasWidth}×{canvasHeight}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-0.5 p-0.5 rounded-lg bg-surface-variant/15 border border-border-theme/15">
                {DEVICES.map(d => (
                  <button key={d.key} type="button" onClick={() => setActiveDevice(d.key)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-bold transition cursor-pointer ${
                      activeDevice === d.key ? "bg-accent text-accent-content shadow" : "text-foreground/40 hover:text-foreground"
                    }`}>
                    <i className={d.icon} /> {d.label}
                  </button>
                ))}
              </div>
              <button type="button" onClick={onClose}
                className="w-7 h-7 rounded-lg bg-surface-variant/20 flex items-center justify-center text-foreground/60 hover:text-red-400 cursor-pointer transition">
                <i className="ri-close-line text-lg" />
              </button>
            </div>
          </div>

          {/* Canvas Preview */}
          <div className="flex items-center justify-center p-6 bg-black/30 rounded-xl min-h-[300px]">
            <div
              ref={containerRef}
              className="relative rounded-xl overflow-hidden shadow-2xl border border-border-theme/15 transition-all duration-500"
              style={{
                width: "100%",
                maxWidth: `${dev.maxW}px`,
                aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                background: getCanvasBackgroundCSS(backgroundColor),
              }}
            >
              {previewImageSrc && (
                <img src={previewImageSrc} alt={title} className="w-full h-full object-cover absolute inset-0" />
              )}

              {/* Render elements proportionally scaled */}
              {elements.filter(el => el.isVisible !== false).map(el => (
                <div
                  key={el.id}
                  className="absolute"
                  style={{
                    left: `${el.x * scale}px`,
                    top: `${el.y * scale}px`,
                    width: `${el.width * scale}px`,
                    height: `${el.height * scale}px`,
                    zIndex: el.zIndex || 1,
                    transform: `rotate(${el.rotate || 0}deg)`,
                    opacity: (el.opacity ?? 100) / 100,
                  }}
                >
                  {el.type === "text" && (
                    <div
                      className="w-full h-full flex items-center justify-center font-bold whitespace-nowrap"
                      style={{
                        fontFamily: el.fontFamily || "Inter",
                        fontSize: `${(el.fontSize || 22) * scale}px`,
                        fontWeight: el.fontWeight || "bold",
                        color: el.isGradientText ? "transparent" : el.color || "#ffffff",
                        background: el.isGradientText
                          ? `linear-gradient(${el.textGradient?.dir === "to-b" ? "180deg" : "90deg"}, ${el.textGradient?.start || "#ff007f"}, ${el.textGradient?.end || "#7f00ff"})`
                          : "none",
                        WebkitBackgroundClip: el.isGradientText ? "text" : "unset",
                        backgroundClip: el.isGradientText ? "text" : "unset",
                      }}
                    >
                      {el.content}
                    </div>
                  )}

                  {el.type === "button" && (
                    <button
                      type="button"
                      onClick={() => {
                        if (el.link && el.link !== "#") window.open(el.link, "_blank");
                      }}
                      className="w-full h-full font-bold shadow-lg hover:scale-105 transition cursor-pointer"
                      style={{
                        backgroundColor: el.bgColor || "#ffffff",
                        color: el.textColor || "#000000",
                        borderRadius: `${(el.borderRadius || 8) * scale}px`,
                        fontSize: `${(el.fontSize || 14) * scale}px`,
                      }}
                    >
                      {el.content}
                    </button>
                  )}

                  {el.type === "timer" && (
                    <div
                      className="w-full h-full flex items-center justify-center gap-1 font-bold whitespace-nowrap border border-amber-400/50"
                      style={{
                        backgroundColor: el.bgColor || "rgba(0,0,0,0.75)",
                        color: el.textColor || "#ffffff",
                        borderRadius: `${(el.borderRadius || 12) * scale}px`,
                        fontSize: `${(el.fontSize || 14) * scale}px`,
                      }}
                    >
                      <i className="ri-time-line text-amber-400" />
                      <span>{el.label || "Offer ends in:"}</span>
                      <span className="font-mono text-amber-400 bg-amber-400/10 px-1 rounded border border-amber-400/30">
                        {countdownText}
                      </span>
                    </div>
                  )}

                  {el.type === "image" && el.url && (
                    <img src={el.url} alt={el.name || "Image"} className="w-full h-full object-cover" style={{
                      borderRadius: `${(el.borderRadius || 0) * scale}px`,
                    }} />
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* CTA Links info bar */}
          {elements.filter(el => el.type === "button" && el.link).length > 0 && (
            <div className="flex items-center gap-2 text-[10px] text-foreground/40 font-mono px-2">
              <i className="ri-link text-accent" />
              {elements.filter(el => el.type === "button" && el.link).map(el => (
                <span key={el.id} className="bg-surface-variant/15 px-2 py-0.5 rounded border border-border-theme/15">
                  {el.content}: {el.link}
                </span>
              ))}
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BannerPreviewModal;
