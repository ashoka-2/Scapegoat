// 🎨 Reusable Canvas Helper Functions & Utilities

// Google Fonts Loader Helper
export const loadGoogleFont = (fontFamily) => {
  if (!fontFamily || fontFamily === "Inter" || fontFamily === "Roboto" || fontFamily === "sans-serif") return;
  const fontId = `google-font-${fontFamily.replace(/\s+/g, "-").toLowerCase()}`;
  if (!document.getElementById(fontId)) {
    const link = document.createElement("link");
    link.id = fontId;
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?family=${encodeURIComponent(fontFamily)}:wght@400;600;700;900&display=swap`;
    document.head.appendChild(link);
  }
};

// Compute Background CSS (Solid, Linear, Radial, Conic, Mesh)
export const getCanvasBackgroundCSS = (bg) => {
  if (!bg) return "#111827";
  if (typeof bg === "string") return bg;
  if (bg.type === "solid") return bg.color1 || bg.color || "#111827";
  
  const stopsStr = (
    bg.stops || [
      { color: bg.color1 || "#111827", offset: 0 },
      { color: bg.color2 || "#374151", offset: 100 },
    ]
  )
    .map((s) => `${s.color} ${s.offset}%`)
    .join(", ");

  if (bg.type === "linear") {
    const dir = bg.direction === "to-b" ? "to bottom" : bg.direction === "to-tr" ? "to top right" : "to right";
    return `linear-gradient(${dir}, ${stopsStr})`;
  }
  if (bg.type === "radial") return `radial-gradient(circle, ${stopsStr})`;
  if (bg.type === "conic") return `conic-gradient(from ${bg.conicAngle || "0deg"} at 50% 50%, ${stopsStr})`;
  if (bg.type === "mesh") {
    const pts = bg.meshPoints || [];
    return pts.map((p) => `radial-gradient(at ${p.x}% ${p.y}%, ${p.color} 0px, transparent ${p.radius || 65}%)`).join(", ");
  }
  return bg.color1 || "#111827";
};

// Shape Fill CSS Generator
export const getShapeFillCSS = (el) => {
  if (el.fillType === "gradient" && el.fillGradient) {
    const fg = el.fillGradient;
    const stops = (fg.stops || [{ color: fg.color1 || el.fill || "#4f46e5", offset: 0 }, { color: fg.color2 || "#db2777", offset: 100 }])
      .map((s) => `${s.color} ${s.offset}%`)
      .join(", ");
    if (fg.type === "radial") return `radial-gradient(circle, ${stops})`;
    if (fg.type === "conic") return `conic-gradient(from ${fg.conicAngle || "0deg"} at 50% 50%, ${stops})`;
    const dir = fg.direction === "to-b" ? "to bottom" : fg.direction === "to-tr" ? "to top right" : "to right";
    return `linear-gradient(${dir}, ${stops})`;
  }
  return el.fill || "transparent";
};

// Image Filter CSS Generator
export const getImageFilterStyle = (f) => {
  if (!f) return {};
  return {
    filter: `blur(${f.blur || 0}px) brightness(${f.brightness || 100}%) contrast(${f.contrast || 100}%) grayscale(${f.grayscale || 0}%) sepia(${f.sepia || 0}%)`,
  };
};

// Format Countdown Timer Text
export const formatCountdown = (targetDate) => {
  if (!targetDate) return "01h 30m 00s";
  const diff = new Date(targetDate).getTime() - Date.now();
  if (diff <= 0) return "Offer Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const mins = Math.floor((diff / (1000 * 60)) % 60);
  const secs = Math.floor((diff / 1000) % 60);

  if (days > 0) return `${days}d ${hours}h ${mins}m ${secs}s`;
  return `${hours}h ${mins}m ${secs}s`;
};
