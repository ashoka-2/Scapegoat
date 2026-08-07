import React, { useState } from "react";
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

  const DEVICES = [
    { key: "desktop", label: "Desktop", icon: "ri-computer-line", w: 1200, h: 500 },
    { key: "tablet", label: "Tablet", icon: "ri-tablet-line", w: 768, h: 500 },
    { key: "mobile", label: "Mobile", icon: "ri-smartphone-line", w: 360, h: 640 },
  ];

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-black/85 backdrop-blur-md p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, y: 20 }}
          animate={{ scale: 1, y: 0 }}
          exit={{ scale: 0.9, y: 20 }}
          className="relative max-w-5xl w-full bg-background border border-border-theme/40 rounded-3xl overflow-hidden shadow-2xl p-6 space-y-4"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex items-center justify-between border-b border-border-theme/20 pb-4">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
              <h3 className="font-black text-base text-foreground">Exact Live User Simulation: {title || "Banner"}</h3>
            </div>
            <div className="flex items-center gap-3">
              {/* Device Selector */}
              <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-variant/20 border border-border-theme/20">
                {DEVICES.map((dev) => (
                  <button
                    key={dev.key}
                    type="button"
                    onClick={() => setActiveDevice(dev.key)}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                      activeDevice === dev.key ? "bg-accent text-accent-content shadow" : "text-foreground/50 hover:text-foreground"
                    }`}
                  >
                    <i className={dev.icon} /> {dev.label}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-xl bg-surface-variant/30 flex items-center justify-center text-foreground hover:text-red-400 cursor-pointer"
              >
                <i className="ri-close-line text-lg" />
              </button>
            </div>
          </div>

          {/* Exact Proportional Canvas Render */}
          <div className="flex items-center justify-center p-4 bg-black/40 rounded-2xl min-h-[350px]">
            <div
              className={`relative rounded-2xl overflow-hidden shadow-2xl border border-border-theme/20 transition-all duration-500 ${
                activeDevice === "mobile" ? "w-[340px]" : activeDevice === "tablet" ? "w-[560px]" : "w-full"
              }`}
              style={{
                aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                backgroundColor: getCanvasBackgroundCSS(backgroundColor),
              }}
            >
              {previewImageSrc && (
                <img src={previewImageSrc} alt={title} className="w-full h-full object-cover" />
              )}

              {elements.map((el) => (
                <div
                  key={el.id}
                  className="absolute"
                  style={{
                    left: `${el.x}px`,
                    top: `${el.y}px`,
                    width: `${el.width}px`,
                    height: `${el.height}px`,
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
                        fontSize: `${el.fontSize || 22}px`,
                        color: el.color || "#ffffff",
                      }}
                    >
                      {el.content}
                    </div>
                  )}

                  {el.type === "button" && (
                    <button
                      type="button"
                      onClick={() => alert(`Clicked CTA Button: ${el.content} -> Link: ${el.link || "#"}`)}
                      className="w-full h-full font-bold shadow-lg hover:scale-105 transition cursor-pointer"
                      style={{
                        backgroundColor: el.bgColor || "#ffffff",
                        color: el.textColor || "#000000",
                        borderRadius: `${el.borderRadius || 8}px`,
                        fontSize: `${el.fontSize || 14}px`,
                      }}
                    >
                      {el.content}
                    </button>
                  )}

                  {el.type === "timer" && (
                    <div
                      className="w-full h-full flex items-center justify-center gap-2 font-bold whitespace-nowrap border border-amber-400/50"
                      style={{
                        backgroundColor: el.bgColor || "rgba(0,0,0,0.75)",
                        color: el.textColor || "#ffffff",
                        borderRadius: `${el.borderRadius || 12}px`,
                        fontSize: `${el.fontSize || 14}px`,
                      }}
                    >
                      <i className="ri-time-line text-amber-400" />
                      <span>{el.label || "Offer ends in:"}</span>
                      <span className="font-mono text-amber-400 bg-amber-400/10 px-2 py-0.5 rounded border border-amber-400/30">
                        {countdownText}
                      </span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default BannerPreviewModal;
