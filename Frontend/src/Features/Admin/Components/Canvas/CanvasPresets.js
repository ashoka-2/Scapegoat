// 🎨 Design Workspace Presets & Configuration Templates

export const CANVAS_SIZES = [
  { name: "Wide Hero (21:9) - 1200x500", width: 1200, height: 500, ratio: "21:9", icon: "ri-layout-top-line" },
  { name: "Standard HD (16:9) - 1280x720", width: 1280, height: 720, ratio: "16:9", icon: "ri-tv-line" },
  { name: "Landscape Banner (16:9) - 800x450", width: 800, height: 450, ratio: "16:9", icon: "ri-rectangle-line" },
  { name: "Square Banner (1:1) - 600x600", width: 600, height: 600, ratio: "1:1", icon: "ri-checkbox-blank-line" },
  { name: "Portrait Card (4:5) - 480x600", width: 480, height: 600, ratio: "4:5", icon: "ri-layout-3-line" },
  { name: "Mobile Story (9:16) - 360x640", width: 360, height: 640, ratio: "9:16", icon: "ri-smartphone-line" },
  { name: "Custom Canvas Size", width: 1000, height: 500, ratio: "custom", icon: "ri-equalizer-line" },
];

export const PRESET_SHAPES = {
  rect: { name: "Rectangle", type: "shape", shapeType: "rect" },
  circle: { name: "Circle", type: "shape", shapeType: "circle" },
  triangle: { name: "Triangle", type: "shape", shapeType: "polygon", points: "50,0 100,100 0,100" },
  rhombus: { name: "Rhombus", type: "shape", shapeType: "polygon", points: "50,0 100,50 50,100 0,50" },
  hexagon: { name: "Hexagon", type: "shape", shapeType: "polygon", points: "50,0 93,25 93,75 50,100 7,75 7,25" },
  pentagon: { name: "Pentagon", type: "shape", shapeType: "polygon", points: "50,0 98,35 80,90 20,90 2,35" },
  star_4: { name: "4-Pt Star", type: "shape", shapeType: "path", path: "M50,0 L60,40 L100,50 L60,60 L50,100 L40,60 L0,50 L40,40 Z" },
  star_5: { name: "5-Pt Star", type: "shape", shapeType: "path", path: "M50,0 L63,38 L100,38 L70,61 L82,100 L50,75 L18,100 L30,61 L0,38 L37,38 Z" },
  heart: { name: "Heart", type: "shape", shapeType: "path", path: "M50,18 C35,0 0,0 0,35 C0,65 50,95 50,95 C50,95 100,65 100,35 C100,0 65,0 50,18 Z" },
  arrow_r: { name: "Arrow Right", type: "shape", shapeType: "polygon", points: "0,35 60,35 60,10 100,50 60,90 60,65 0,65" },
  arrow_l: { name: "Arrow Left", type: "shape", shapeType: "polygon", points: "40,10 40,35 100,35 100,65 40,65 40,90 0,50" },
  speech: { name: "Speech Bubble", type: "shape", shapeType: "path", path: "M10,0 L90,0 C95,0 100,5 100,10 L100,60 C100,65 95,70 90,70 L45,70 L25,90 L25,70 L10,70 C5,70 0,65 0,60 L0,10 C0,5 5,0 10,0 Z" },
  shield: { name: "Shield", type: "shape", shapeType: "path", path: "M0,15 L50,0 L100,15 L100,60 C100,85 50,100 50,100 C50,100 0,85 0,60 Z" },
  badge: { name: "Burst Badge", type: "shape", shapeType: "polygon", points: "50,0 60,10 70,0 80,10 90,0 100,10 90,20 100,30 90,40 100,50 90,60 100,70 90,80 100,90 90,100 80,90 70,100 60,90 50,100 40,90 30,100 20,90 10,100 0,90 10,80 0,70 10,60 0,50 10,40 0,30 10,20 0,10 10,0 20,10 30,0 40,10" },
  tag: { name: "Price Tag", type: "shape", shapeType: "polygon", points: "0,20 0,80 60,80 100,50 60,20" },
};

export const PRESET_GRADIENTS = [
  {
    name: "Cyberpunk Neon",
    type: "mesh",
    color1: "#ff007f",
    color2: "#7f00ff",
    color3: "#00f0ff",
    color4: "#121214",
    meshPoints: [
      { id: "m-1", x: 15, y: 15, color: "#ff007f", radius: 75 },
      { id: "m-2", x: 85, y: 20, color: "#7f00ff", radius: 75 },
      { id: "m-3", x: 80, y: 80, color: "#00f0ff", radius: 75 },
      { id: "m-4", x: 20, y: 85, color: "#121214", radius: 75 },
    ],
  },
  {
    name: "Aurora Borealis",
    type: "linear",
    direction: "to-tr",
    stops: [
      { color: "#050b14", offset: 0 },
      { color: "#0d9488", offset: 50 },
      { color: "#22c55e", offset: 100 },
    ],
  },
  {
    name: "Sunset Glow",
    type: "linear",
    direction: "to-r",
    stops: [
      { color: "#f97316", offset: 0 },
      { color: "#ec4899", offset: 50 },
      { color: "#8b5cf6", offset: 100 },
    ],
  },
  {
    name: "Ocean Breeze",
    type: "linear",
    direction: "to-b",
    stops: [
      { color: "#0ea5e9", offset: 0 },
      { color: "#22d3ee", offset: 50 },
      { color: "#047857", offset: 100 },
    ],
  },
  {
    name: "Dark Velvet",
    type: "solid",
    color1: "#111827",
  },
];

export const TEXT_PRESETS = [
  { name: "Big Headline", fontSize: 32, fontWeight: "black", fontFamily: "Inter", color: "#ffffff" },
  { name: "Neon Glow", fontSize: 26, fontWeight: "bold", fontFamily: "Inter", color: "#ff007f", shadowX: 0, shadowY: 0, shadowBlur: 15, shadowColor: "#ff007f" },
  { name: "Gold Metallic", fontSize: 28, fontWeight: "black", fontFamily: "Inter", color: "#bf953f", isGradientText: true, textGradient: { start: "#bf953f", end: "#fcf6ba", dir: "to-r" }, shadowX: 2, shadowY: 2, shadowBlur: 4, shadowColor: "rgba(0,0,0,0.6)" },
  { name: "Cyber Glitch", fontSize: 28, fontWeight: "black", fontFamily: "Inter", color: "#00ffff", isGradientText: true, textGradient: { start: "#00ffff", end: "#ff00ff", dir: "to-r" }, shadowX: 3, shadowY: -3, shadowBlur: 10, shadowColor: "#ff0000" },
  { name: "3D Blocky", fontSize: 24, fontWeight: "black", fontFamily: "Inter", color: "#ffffff", shadowX: 6, shadowY: 6, shadowBlur: 0, shadowColor: "#111111" },
  { name: "Romantic Rose", fontSize: 24, fontWeight: "normal", fontFamily: "Inter", color: "#fda4af", isGradientText: true, textGradient: { start: "#fda4af", end: "#f43f5e", dir: "to-b" } },
];
