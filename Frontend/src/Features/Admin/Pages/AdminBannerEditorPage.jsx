import React, { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import html2canvas from "html2canvas-pro";
import {
  getBannerByIdApi,
  createBannerApi,
  updateBannerApi,
} from "../Services/banner.api.js";
import AdminBannerEditorSkeleton from "../Components/Skeletons/AdminBannerEditorSkeleton.jsx";
import CanvasElement from "../Components/Canvas/CanvasElement.jsx";
import ContextMenu from "../Components/Canvas/ContextMenu.jsx";
import BannerPreviewModal from "../Components/Canvas/BannerPreviewModal.jsx";
import {
  CANVAS_SIZES,
  TEXT_PRESETS,
} from "../Components/Canvas/CanvasPresets.js";
import {
  getCanvasBackgroundCSS,
  formatCountdown,
  loadGoogleFont,
} from "../Components/Canvas/canvasHelpers.js";

/* ─── Constants ─── */
const FONT_OPTIONS = [
  "Inter", "Outfit", "Montserrat", "Playfair Display",
  "Poppins", "Roboto", "Cinzel", "Bebas Neue",
];

const PRESET_BG_COLORS = [
  "#0f172a", "#111827", "#000000", "#18181b", "#1e293b",
  "#0284c7", "#7c3aed", "#db2777", "#059669", "#d97706",
  "#dc2626", "#ffffff",
];

const LINK_PRESETS = [
  { label: "Shop All", url: "/shop", icon: "ri-store-2-line" },
  { label: "Sale", url: "/category/sale", icon: "ri-price-tag-3-line" },
  { label: "Clothing", url: "/category/clothing", icon: "ri-shirt-line" },
  { label: "Electronics", url: "/category/electronics", icon: "ri-cpu-line" },
  { label: "Cart", url: "/cart", icon: "ri-shopping-cart-line" },
  { label: "Checkout", url: "/checkout", icon: "ri-bank-card-line" },
];

const DEVICE_OPTIONS = [
  { value: "desktop", label: "Desktop", icon: "ri-computer-line" },
  { value: "mobile", label: "Mobile", icon: "ri-smartphone-line" },
  { value: "tablet", label: "Tablet", icon: "ri-tablet-line" },
];

const PAGE_OPTIONS = [
  { value: "home", label: "Home Page" },
  { value: "shop", label: "Shop / Catalog Page" },
  { value: "product", label: "Single Product Detail Page" },
  { value: "cart", label: "Cart Page" },
  { value: "checkout", label: "Checkout Page" },
  { value: "my-orders", label: "My Orders Page" },
  { value: "about", label: "About Page" },
  { value: "contact", label: "Contact Page" },
];

/* ─── Top-Level Reusable Inspector & Layer Components (Prevents DOM Remounting & Jump) ─── */
const Section = React.memo(({ label, children, icon }) => (
  <div className="space-y-2 pb-3 border-b border-border-theme/10 last:border-0">
    <div className="text-[9px] font-black text-foreground/40 uppercase tracking-wider flex items-center gap-1.5">
      {icon && <i className={`${icon} text-[10px]`} />} {label}
    </div>
    {children}
  </div>
));

const InputField = React.memo(({ label, value, onChange, type = "text", ...rest }) => (
  <div className="space-y-0.5">
    <label className="text-[9px] font-bold text-foreground/40 uppercase">{label}</label>
    <input
      type={type} value={value} onChange={onChange}
      className="w-full px-2.5 py-1.5 bg-background border border-border-theme/30 rounded-lg text-xs font-mono text-foreground outline-none focus:border-accent/60 transition"
      {...rest}
    />
  </div>
));

const ColorRow = React.memo(({ value, onChange, label }) => (
  <div className="space-y-0.5">
    {label && <label className="text-[9px] font-bold text-foreground/40 uppercase">{label}</label>}
    <div className="flex items-center gap-2">
      <input type="color" value={value || "#ffffff"} onChange={e => onChange(e.target.value)} className="w-7 h-7 rounded-lg border-0 cursor-pointer flex-shrink-0" />
      <input type="text" value={value || "#FFFFFF"} onChange={e => onChange(e.target.value)} className="flex-1 px-2 py-1 bg-background border border-border-theme/30 rounded-lg text-[11px] font-mono text-foreground uppercase outline-none focus:border-accent/60 transition" />
    </div>
  </div>
));

const LayerItem = React.memo(({ el, isSelected, onSelect, onDuplicate, onToggleVisible, onToggleLock, onDelete }) => (
  <div
    onClick={onSelect}
    className={`group flex items-center justify-between p-2 rounded-xl text-[11px] font-bold transition cursor-pointer border ${
      isSelected
        ? "bg-accent/15 border-accent text-accent shadow-xs"
        : "bg-transparent border-border-theme/20 text-foreground/70 hover:border-border-theme/50 hover:text-foreground"
    }`}
  >
    <div className="flex items-center gap-2 truncate min-w-0">
      <i className={`text-sm flex-shrink-0 ${
        el.type === "text" ? "ri-text" : el.type === "button" ? "ri-cursor-fill" : el.type === "timer" ? "ri-time-line text-amber-400" : "ri-image-line"
      }`} />
      <span className="truncate">{el.content || el.name || el.type}</span>
      {el.type === "button" && el.link && (
        <span className="text-[9px] text-foreground/40 font-mono truncate max-w-[60px]" title={el.link}>
          {el.link}
        </span>
      )}
    </div>
    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
      <button type="button" onClick={e => { e.stopPropagation(); onDuplicate(); }} className="p-0.5 hover:text-accent" title="Duplicate"><i className="ri-file-copy-line text-xs" /></button>
      <button type="button" onClick={e => { e.stopPropagation(); onToggleVisible(); }} className="p-0.5 hover:text-foreground"><i className={`text-xs ${el.isVisible ?? true ? "ri-eye-line" : "ri-eye-off-line"}`} /></button>
      <button type="button" onClick={e => { e.stopPropagation(); onToggleLock(); }} className="p-0.5 hover:text-amber-400"><i className={`text-xs ${el.isLocked ? "ri-lock-line" : "ri-lock-unlock-line"}`} /></button>
      <button type="button" onClick={e => { e.stopPropagation(); onDelete(); }} className="p-0.5 hover:text-red-400"><i className="ri-delete-bin-line text-xs" /></button>
    </div>
  </div>
));

/* ─── Main Editor Component ─── */
const AdminBannerEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  /* ── Banner Meta ── */
  const [title, setTitle] = useState("Summer Collection Sale");
  const [subtitle, setSubtitle] = useState("Up to 50% Off Top Brands");
  const [placement, setPlacement] = useState("hero");
  const [position, setPosition] = useState(0);
  const [targetPages, setTargetPages] = useState(["home"]);
  const [deviceTargets, setDeviceTargets] = useState(["desktop", "mobile"]);
  const [altText, setAltText] = useState("Promotional banner");
  const [backgroundColor, setBackgroundColor] = useState("#0f172a");
  const [canvasWidth, setCanvasWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(500);
  const [aspectRatio, setAspectRatio] = useState("21:9");
  const [isActive, setIsActive] = useState(true);
  const [isDraft, setIsDraft] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  /* ── Promotional Rules ── */
  const [dismissible, setDismissible] = useState(true);
  const [popupDelay, setPopupDelay] = useState(3);
  const [autoCloseSeconds, setAutoCloseSeconds] = useState(0);
  const [showTimesPerDay, setShowTimesPerDay] = useState(1);

  /* ── Canvas State ── */
  const [zoomLevel, setZoomLevel] = useState(100);
  const [activeTool, setActiveTool] = useState("move");
  const [snapToGrid, setSnapToGrid] = useState(false);

  /* ── Elements (starts with header + CTA button only) ── */
  const [elements, setElements] = useState([
    {
      id: "txt-title-1", type: "text", name: "Header Title",
      content: "MEGA FESTIVAL SALE 50% OFF",
      x: 350, y: 160, width: 500, height: 60,
      fontFamily: "Inter", fontSize: 32, fontWeight: "900",
      textAlign: "center", color: "#ffffff", textColor: "#ffffff",
      zIndex: 1, opacity: 100, rotate: 0, isLocked: false, isVisible: true,
    },
    {
      id: "btn-cta-1", type: "button", name: "CTA Button",
      content: "SHOP NOW", link: "/category/sale",
      x: 510, y: 280, width: 180, height: 48,
      bgColor: "#ffffff", textColor: "#0f172a", fill: "#ffffff",
      borderRadius: 12, borderWidth: 0, borderColor: "#ffffff",
      fontSize: 14, fontWeight: "bold", fontFamily: "Inter",
      paddingX: 24, paddingY: 12, shadow: true,
      zIndex: 2, opacity: 100, rotate: 0, isLocked: false, isVisible: true,
    },
  ]);

  const elementsRef = useRef(elements);
  useEffect(() => { elementsRef.current = elements; }, [elements]);

  /* ── Selection ── */
  const [selectedId, setSelectedId] = useState("btn-cta-1");
  const [editingTextId, setEditingTextId] = useState(null);

  /* ── Undo / Redo ── */
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const pushHistory = useCallback((newElements) => {
    setPast(p => [...p.slice(-49), elementsRef.current]);
    setFuture([]);
    setElements(newElements);
  }, []);

  const handleUndo = useCallback(() => {
    if (!past.length) return;
    setFuture(f => [elementsRef.current, ...f]);
    setElements(past[past.length - 1]);
    setPast(p => p.slice(0, -1));
  }, [past]);

  const handleRedo = useCallback(() => {
    if (!future.length) return;
    setPast(p => [...p, elementsRef.current]);
    setElements(future[0]);
    setFuture(f => f.slice(1));
  }, [future]);

  /* ── UI State ── */
  const [activeLeftTab, setActiveLeftTab] = useState("layers");
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [loadingBanner, setLoadingBanner] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [compilingCanvas, setCompilingCanvas] = useState(false);
  const [countdownText, setCountdownText] = useState("01h 30m 00s");
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetId: null });
  const [desktopFile, setDesktopFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [tabletFile, setTabletFile] = useState(null);

  /* ── Refs ── */
  const artboardRef = useRef(null);   // The actual canvas artboard (for export)
  const viewportRef = useRef(null);   // The scrollable viewport area (for click-to-place coords)
  const dragInfo = useRef({ isDragging: false });

  /* ── Timer tick ── */
  useEffect(() => {
    const interval = setInterval(() => {
      const t = elements.find(el => el.type === "timer");
      if (t?.endDate || t?.timerEndDate) {
        setCountdownText(formatCountdown(t.endDate || t.timerEndDate));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [elements]);

  /* ── Keyboard shortcuts ── */
  useEffect(() => {
    const handler = (e) => {
      if (editingTextId) return;
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.key === "z") { e.preventDefault(); e.shiftKey ? handleRedo() : handleUndo(); }
      else if (mod && e.key === "y") { e.preventDefault(); handleRedo(); }
      else if (e.key === "Delete" && selectedId) { e.preventDefault(); removeElement(selectedId); }
      else if (mod && e.key === "d" && selectedId) { e.preventDefault(); duplicateElement(selectedId); }
      else if (mod && e.key === "0") { e.preventDefault(); setZoomLevel(100); }
      else if (e.key === "v" || e.key === "V") { if (!mod) setActiveTool("move"); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [selectedId, editingTextId, past, future]);

  /* ── Close context menu ── */
  useEffect(() => {
    const close = () => setContextMenu(p => p.visible ? { ...p, visible: false } : p);
    window.addEventListener("click", close);
    return () => window.removeEventListener("click", close);
  }, []);

  const handleCanvasContextMenu = (e, targetId = null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ visible: true, x: e.clientX, y: e.clientY, targetId });
  };

  /* ── Load banner for edit ── */
  useEffect(() => {
    if (!id) return;
    (async () => {
      setLoadingBanner(true);
      try {
        const data = await getBannerByIdApi(id);
        if (data.banner) {
          const b = data.banner;
          setTitle(b.title || ""); setSubtitle(b.subtitle || "");
          setPlacement(b.placement || "hero"); setPosition(b.position || 0);
          setTargetPages(b.targetPages || ["home"]);
          setDeviceTargets(b.deviceTargets || ["desktop", "mobile"]);
          setAltText(b.altText || ""); setBackgroundColor(b.backgroundColor || "#0f172a");
          setCanvasWidth(b.canvasWidth || 1200); setCanvasHeight(b.canvasHeight || 500);
          setAspectRatio(b.aspectRatio || "21:9");
          setIsActive(b.isActive ?? true); setIsDraft(b.isDraft ?? false);
          setStartDate(b.startDate ? new Date(b.startDate).toISOString().slice(0, 16) : "");
          setEndDate(b.endDate ? new Date(b.endDate).toISOString().slice(0, 16) : "");
          setDismissible(b.dismissible ?? true);
          setPopupDelay(b.popupDelay ?? 3);
          setAutoCloseSeconds(b.autoCloseSeconds ?? 0);
          setShowTimesPerDay(b.showTimesPerDay ?? 1);
          if (Array.isArray(b.elements) && b.elements.length > 0) {
            setElements(b.elements);
            setSelectedId(b.elements[0]?.id || null);
          }
        }
      } catch (err) { console.error("Failed to load banner:", err); }
      finally { setLoadingBanner(false); }
    })();
  }, [id]);

  /* ─── Derived: selected element ─── */
  const sel = selectedId ? elements.find(el => el.id === selectedId) || null : null;

  /* ─── Element helpers ─── */
  const updateElement = useCallback((elId, key, val) => {
    if (!elId) return;
    pushHistory(elementsRef.current.map(el => el.id === elId ? { ...el, [key]: val } : el));
  }, [pushHistory]);

  const updateSel = useCallback((key, val) => {
    if (sel?.id) updateElement(sel.id, key, val);
  }, [sel, updateElement]);

  const removeElement = useCallback((targetId) => {
    const updated = elementsRef.current.filter(el => el.id !== targetId);
    pushHistory(updated);
    if (selectedId === targetId) setSelectedId(updated[0]?.id || null);
  }, [pushHistory, selectedId]);

  const duplicateElement = useCallback((targetId = null) => {
    const elId = targetId || sel?.id;
    const el = elementsRef.current.find(item => item.id === elId);
    if (!el) return;
    const newId = `${el.type}-${Date.now()}`;
    const dup = {
      ...el, id: newId,
      name: `${el.name || el.type} (Copy)`,
      x: Math.min(canvasWidth - el.width, el.x + 30),
      y: Math.min(canvasHeight - el.height, el.y + 30),
      zIndex: elementsRef.current.length + 1,
    };
    pushHistory([...elementsRef.current, dup]);
    setSelectedId(newId);
  }, [sel, canvasWidth, canvasHeight, pushHistory]);

  const moveZIndex = useCallback((direction) => {
    if (!sel) return;
    let list = [...elementsRef.current].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const idx = list.findIndex(el => el.id === sel.id);
    if (idx === -1) return;
    if (direction === "front") { const [item] = list.splice(idx, 1); list.push(item); }
    else if (direction === "back") { const [item] = list.splice(idx, 1); list.unshift(item); }
    else if (direction === "forward" && idx < list.length - 1) { const [item] = list.splice(idx, 1); list.splice(idx + 1, 0, item); }
    else if (direction === "backward" && idx > 0) { const [item] = list.splice(idx, 1); list.splice(idx - 1, 0, item); }
    pushHistory(elementsRef.current.map(el => ({ ...el, zIndex: list.findIndex(i => i.id === el.id) + 1 })));
  }, [sel, pushHistory]);

  const handleAlign = useCallback((dir) => {
    if (!sel || sel.isLocked) return;
    let { x, y } = sel;
    if (dir === "left") x = 20;
    if (dir === "h_center") x = Math.round((canvasWidth - sel.width) / 2);
    if (dir === "right") x = canvasWidth - sel.width - 20;
    if (dir === "top") y = 20;
    if (dir === "v_center") y = Math.round((canvasHeight - sel.height) / 2);
    if (dir === "bottom") y = canvasHeight - sel.height - 20;
    pushHistory(elementsRef.current.map(el => el.id === sel.id ? { ...el, x, y } : el));
  }, [sel, canvasWidth, canvasHeight, pushHistory]);

  /* ─── Placement helper ─── */
  const getPlacement = (w, h, clickEv = null) => {
    if (clickEv && artboardRef.current) {
      const rect = artboardRef.current.getBoundingClientRect();
      const scale = zoomLevel / 100;
      return {
        x: Math.max(0, Math.min(canvasWidth - w, Math.round((clickEv.clientX - rect.left) / scale - w / 2))),
        y: Math.max(0, Math.min(canvasHeight - h, Math.round((clickEv.clientY - rect.top) / scale - h / 2))),
      };
    }
    return { x: Math.round((canvasWidth - w) / 2), y: Math.round((canvasHeight - h) / 2) };
  };

  /* ─── Add element handlers ─── */
  const handleAddText = (preset = null, clickEv = null) => {
    if (preset?.fontFamily) loadGoogleFont(preset.fontFamily);
    const w = 400, h = 50;
    const pos = getPlacement(w, h, clickEv);
    const newId = `text-${Date.now()}`;
    pushHistory([...elements, {
      id: newId, type: "text", name: preset?.name || "Text Layer",
      content: preset?.name || "Double Click to Edit",
      ...pos, width: w, height: h,
      fontFamily: preset?.fontFamily || "Inter",
      fontSize: preset?.fontSize || 28,
      fontWeight: preset?.fontWeight || "bold",
      textAlign: "center",
      color: preset?.color || "#ffffff",
      textColor: preset?.color || "#ffffff",
      shadowX: preset?.shadowX, shadowY: preset?.shadowY,
      shadowBlur: preset?.shadowBlur, shadowColor: preset?.shadowColor,
      isGradientText: preset?.isGradientText, textGradient: preset?.textGradient,
      zIndex: elements.length + 1, isVisible: true, isLocked: false,
    }]);
    setSelectedId(newId);
    setActiveTool("move");
  };

  const handleAddButton = (clickEv = null) => {
    const w = 200, h = 50;
    const pos = getPlacement(w, h, clickEv);
    const newId = `btn-${Date.now()}`;
    pushHistory([...elements, {
      id: newId, type: "button",
      name: `CTA Button ${elements.filter(e => e.type === "button").length + 1}`,
      content: "SHOP NOW", link: "/shop",
      ...pos, width: w, height: h,
      bgColor: "#ffffff", textColor: "#0f172a", fill: "#ffffff",
      borderRadius: 12, borderWidth: 0, borderColor: "#ffffff",
      fontSize: 14, fontWeight: "bold", fontFamily: "Inter",
      paddingX: 28, paddingY: 14, shadow: true,
      zIndex: elements.length + 1, isVisible: true, isLocked: false,
    }]);
    setSelectedId(newId);
    setActiveTool("move");
  };

  const handleAddTimer = (clickEv = null) => {
    const w = 300, h = 50;
    const pos = getPlacement(w, h, clickEv);
    const newId = `timer-${Date.now()}`;
    pushHistory([...elements, {
      id: newId, type: "timer", name: "Sale Countdown",
      label: "Offer ends in:",
      endDate: new Date(Date.now() + 86400000).toISOString().slice(0, 16),
      ...pos, width: w, height: h,
      bgColor: "rgba(15, 23, 42, 0.85)", textColor: "#ffffff",
      borderRadius: 12, fontSize: 14,
      zIndex: elements.length + 1, isVisible: true, isLocked: false,
    }]);
    setSelectedId(newId);
    setActiveTool("move");
  };

  const handleAddImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const w = 300, h = 200;
      const pos = getPlacement(w, h);
      const newId = `image-${Date.now()}`;
      pushHistory([...elements, {
        id: newId, type: "image", name: "Image",
        url: reader.result, ...pos, width: w, height: h,
        zIndex: elements.length + 1, isVisible: true, isLocked: false,
      }]);
      setSelectedId(newId);
      setActiveTool("move");
    };
    reader.readAsDataURL(file);
  };

  /* ─── Canvas click (place element at cursor) ─── */
  const handleCanvasClick = (e) => {
    if (activeTool === "move") return;
    e.stopPropagation();
    if (activeTool === "text") handleAddText(null, e);
    else if (activeTool === "button") handleAddButton(e);
    else if (activeTool === "timer") handleAddTimer(e);
  };

  /* ─── Drag engine ─── */
  const handleElementMouseDown = (e, item) => {
    e.stopPropagation();
    setSelectedId(item.id);
    setEditingTextId(null);
    if (item.isLocked) return;
    const scale = zoomLevel / 100;
    dragInfo.current = {
      isDragging: true, startX: e.clientX, startY: e.clientY,
      elementX: item.x, elementY: item.y, scale,
    };
    const onMove = (ev) => {
      const dx = (ev.clientX - dragInfo.current.startX) / scale;
      const dy = (ev.clientY - dragInfo.current.startY) / scale;
      const grid = snapToGrid ? 8 : 1;
      const newX = Math.round((dragInfo.current.elementX + dx) / grid) * grid;
      const newY = Math.round((dragInfo.current.elementY + dy) / grid) * grid;
      setElements(prev => prev.map(el => el.id === item.id ? { ...el, x: newX, y: newY } : el));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      pushHistory(elementsRef.current);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /* ─── Resize engine ─── */
  const handleResizeStart = (e, pin, item) => {
    e.stopPropagation(); e.preventDefault();
    if (item.isLocked) return;
    const scale = zoomLevel / 100;
    const sX = e.clientX, sY = e.clientY;
    const sW = item.width, sH = item.height, sXP = item.x, sYP = item.y;
    const onMove = (ev) => {
      const dx = (ev.clientX - sX) / scale, dy = (ev.clientY - sY) / scale;
      let w = sW, h = sH, x = sXP, y = sYP;
      if (pin.includes("e")) w = Math.max(30, sW + dx);
      if (pin.includes("w")) { w = Math.max(30, sW - dx); x = sXP + (sW - w); }
      if (pin.includes("s")) h = Math.max(20, sH + dy);
      if (pin.includes("n")) { h = Math.max(20, sH - dy); y = sYP + (sH - h); }
      setElements(prev => prev.map(el =>
        el.id === item.id ? { ...el, width: Math.round(w), height: Math.round(h), x: Math.round(x), y: Math.round(y) } : el
      ));
    };
    const onUp = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      pushHistory(elementsRef.current);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  /* ─── Export & Save ─── */
  const exportPNG = async () => {
    if (!artboardRef.current) return;
    setCompilingCanvas(true);
    const prevSel = selectedId;
    setSelectedId(null);
    await new Promise(r => setTimeout(r, 200));
    try {
      const canvas = await html2canvas(artboardRef.current, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
      const a = document.createElement("a");
      a.href = canvas.toDataURL("image/png");
      a.download = `banner_${title || "design"}_${canvasWidth}x${canvasHeight}.png`;
      a.click();
    } catch (err) { console.error("Export failed:", err); }
    finally { setSelectedId(prevSel); setCompilingCanvas(false); }
  };

  const handleSave = async (draft = false) => {
    if (!title.trim()) { alert("Please enter a banner title"); return; }
    setSaving(true); setCompilingCanvas(true);
    setSelectedId(null);
    await new Promise(r => setTimeout(r, 200));
    try {
      let blob = null;
      if (artboardRef.current) {
        try {
          const c = await html2canvas(artboardRef.current, { scale: 2, useCORS: true, backgroundColor: null, logging: false });
          blob = await new Promise(res => c.toBlob(b => res(b), "image/png"));
        } catch (e) { console.warn("Canvas compile fallback:", e); }
      }
      const fd = new FormData();
      fd.append("title", title); fd.append("subtitle", subtitle || "");
      fd.append("placement", placement); fd.append("position", position || 0);
      fd.append("targetPages", JSON.stringify(targetPages));
      fd.append("deviceTargets", JSON.stringify(deviceTargets));
      fd.append("altText", altText || ""); fd.append("backgroundColor", backgroundColor || "");
      fd.append("canvasWidth", canvasWidth); fd.append("canvasHeight", canvasHeight);
      fd.append("aspectRatio", aspectRatio);
      fd.append("isDraft", draft); fd.append("isActive", draft ? false : isActive);
      fd.append("startDate", startDate || ""); fd.append("endDate", endDate || "");
      fd.append("dismissible", dismissible);
      fd.append("popupDelay", popupDelay);
      fd.append("autoCloseSeconds", autoCloseSeconds);
      fd.append("showTimesPerDay", showTimesPerDay);
      fd.append("elements", JSON.stringify(elements));
      if (desktopFile) fd.append("image", desktopFile);
      else if (blob) fd.append("image", blob, `banner_${Date.now()}.png`);
      if (mobileFile) fd.append("mobileImage", mobileFile);
      if (tabletFile) fd.append("tabletImage", tabletFile);
      if (isEditing) await updateBannerApi(id, fd);
      else await createBannerApi(fd);
      navigate("/admin/banners");
    } catch (err) {
      console.error("Save failed:", err);
      alert(err.response?.data?.message || "Failed to save banner");
    } finally { setSaving(false); setCompilingCanvas(false); }
  };

  if (loadingBanner) return <AdminBannerEditorSkeleton />;

  return (
    <div className="flex flex-col h-[calc(100vh-3rem)] w-full overflow-hidden select-none bg-background font-sans text-foreground rounded-2xl border border-border-theme/30 shadow-2xl">

      {/* ═══ TOP BAR ═══ */}
      <div className="flex items-center justify-between px-5 py-2.5 bg-surface/80 border-b border-border-theme/30 backdrop-blur-xl flex-shrink-0 z-40">
        <div className="flex items-center gap-3">
          <Link to="/admin/banners" className="w-8 h-8 rounded-lg bg-surface-variant/20 border border-border-theme/30 flex items-center justify-center text-foreground/60 hover:text-accent transition cursor-pointer">
            <i className="ri-arrow-left-line" />
          </Link>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} placeholder="Banner Title…"
            className="bg-transparent text-sm font-black text-foreground outline-none border-b border-transparent focus:border-accent/60 w-56 transition" />
          <div className="flex items-center gap-1.5 text-[10px] bg-accent/10 text-accent font-mono px-2 py-0.5 rounded-md font-bold">
            <i className="ri-aspect-ratio-line" />
            {canvasWidth}×{canvasHeight} ({aspectRatio})
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={exportPNG} disabled={compilingCanvas}
            className="px-3 py-1.5 rounded-lg bg-surface-variant/20 border border-border-theme/30 text-[11px] font-bold text-foreground/70 hover:text-foreground hover:bg-surface-variant/40 transition cursor-pointer flex items-center gap-1.5">
            {compilingCanvas ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-download-2-line" />} Export
          </button>
          <button type="button" onClick={() => setShowLiveModal(true)}
            className="px-3 py-1.5 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] font-bold hover:bg-blue-500/20 transition cursor-pointer flex items-center gap-1.5">
            <i className="ri-eye-line" /> Preview
          </button>
          <button type="button" onClick={() => handleSave(true)} disabled={saving}
            className="px-3 py-1.5 rounded-lg border border-border-theme/30 text-[11px] font-bold text-foreground/60 hover:text-foreground hover:bg-surface-variant/20 transition cursor-pointer">
            Draft
          </button>
          <button type="button" onClick={() => handleSave(false)} disabled={saving}
            className="px-4 py-1.5 rounded-lg bg-accent text-accent-content text-[11px] font-black shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-1.5">
            {saving && <i className="ri-loader-4-line animate-spin" />} Publish
          </button>
        </div>
      </div>

      {/* ═══ BODY: 3-Column Layout ═══ */}
      <div className="flex flex-1 overflow-hidden">

        {/* ─── LEFT: Layers / Assets / Settings ─── */}
        <div className="w-64 bg-surface/80 border-r border-border-theme/20 flex flex-col h-full min-h-0 overflow-hidden flex-shrink-0">
          <div className="grid grid-cols-3 border-b border-border-theme/20 text-[9px] font-black uppercase tracking-widest text-center flex-shrink-0">
            {[
              { key: "layers", icon: "ri-stack-line", label: `Layers (${elements.length})` },
              { key: "assets", icon: "ri-shapes-line", label: "Presets" },
              { key: "settings", icon: "ri-settings-4-line", label: "Settings" },
            ].map(tab => (
              <button key={tab.key} type="button" onClick={() => setActiveLeftTab(tab.key)}
                className={`py-2.5 border-b-2 transition cursor-pointer flex flex-col items-center gap-0.5 ${
                  activeLeftTab === tab.key ? "border-accent text-accent" : "border-transparent text-foreground/40 hover:text-foreground/70"
                }`}>
                <i className={`${tab.icon} text-sm`} /> {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar" data-lenis-prevent>
            {activeLeftTab === "layers" && (
              <div className="space-y-1">
                {elements.length === 0
                  ? <p className="text-[11px] text-foreground/30 text-center py-8">No layers yet. Add elements from the toolbar below.</p>
                  : [...elements].sort((a, b) => b.zIndex - a.zIndex).map(el => (
                      <LayerItem
                        key={el.id}
                        el={el}
                        isSelected={sel?.id === el.id}
                        onSelect={() => setSelectedId(el.id)}
                        onDuplicate={() => duplicateElement(el.id)}
                        onToggleVisible={() => updateElement(el.id, "isVisible", !(el.isVisible ?? true))}
                        onToggleLock={() => updateElement(el.id, "isLocked", !el.isLocked)}
                        onDelete={() => removeElement(el.id)}
                      />
                    ))
                }
              </div>
            )}

            {activeLeftTab === "assets" && (
              <div className="space-y-4">
                <Section label="Quick Add" icon="ri-add-circle-line">
                  <div className="space-y-1.5">
                    <button type="button" onClick={() => handleAddButton()} className="w-full p-2.5 rounded-xl bg-accent/10 border border-accent/30 hover:bg-accent/20 text-[11px] font-extrabold text-accent transition cursor-pointer flex items-center justify-between">
                      <span className="flex items-center gap-2"><i className="ri-cursor-fill" /> CTA Button with Link</span>
                      <i className="ri-add-line" />
                    </button>
                    <button type="button" onClick={() => handleAddText()} className="w-full p-2.5 rounded-xl bg-surface-variant/20 border border-border-theme/20 hover:border-accent/30 text-[11px] font-bold text-foreground/70 transition cursor-pointer flex items-center justify-between">
                      <span className="flex items-center gap-2"><i className="ri-text" /> Text Layer</span>
                      <i className="ri-add-line" />
                    </button>
                    <button type="button" onClick={() => handleAddTimer()} className="w-full p-2.5 rounded-xl bg-amber-400/10 border border-amber-400/30 hover:bg-amber-400/15 text-[11px] font-bold text-amber-400 transition cursor-pointer flex items-center justify-between">
                      <span className="flex items-center gap-2"><i className="ri-time-line" /> Sale Countdown</span>
                      <i className="ri-add-line" />
                    </button>
                  </div>
                </Section>
                <Section label="Text Presets" icon="ri-font-size-2">
                  <div className="space-y-1">
                    {TEXT_PRESETS.map(p => (
                      <button key={p.name} type="button" onClick={() => handleAddText(p)}
                        className="w-full p-2 rounded-xl bg-surface-variant/10 border border-border-theme/15 hover:border-accent/30 text-left text-[11px] font-bold text-foreground/60 hover:text-foreground transition cursor-pointer">
                        {p.name}
                      </button>
                    ))}
                  </div>
                </Section>
              </div>
            )}

            {activeLeftTab === "settings" && (
              <div className="space-y-4">
                <Section label="Canvas Background" icon="ri-palette-line">
                  <ColorRow value={backgroundColor} onChange={setBackgroundColor} />
                  <div className="grid grid-cols-6 gap-1 pt-1">
                    {PRESET_BG_COLORS.map(c => (
                      <button key={c} type="button" onClick={() => setBackgroundColor(c)}
                        className={`w-full aspect-square rounded-lg border cursor-pointer transition hover:scale-110 ${backgroundColor === c ? "border-accent ring-1 ring-accent" : "border-border-theme/30"}`}
                        style={{ backgroundColor: c }} />
                    ))}
                  </div>
                </Section>
                <Section label="Canvas Size" icon="ri-ruler-line">
                  <div className="space-y-1.5">
                    {CANVAS_SIZES.map(size => (
                      <button key={size.name} type="button" onClick={() => { setCanvasWidth(size.width); setCanvasHeight(size.height); setAspectRatio(size.ratio); }}
                        className={`w-full p-2 rounded-xl text-left text-[11px] font-bold border transition cursor-pointer flex items-center gap-2.5 ${
                          canvasWidth === size.width && canvasHeight === size.height
                            ? "bg-accent/15 border-accent text-accent"
                            : "bg-transparent border-border-theme/15 text-foreground/60 hover:border-border-theme/40"
                        }`}>
                        <div className="flex-shrink-0 w-6 h-6 rounded border border-current/30 flex items-center justify-center" style={{
                          aspectRatio: `${size.width}/${size.height}`,
                          width: size.width > size.height ? "24px" : `${Math.round(24 * size.width / size.height)}px`,
                          height: size.height > size.width ? "24px" : `${Math.round(24 * size.height / size.width)}px`,
                        }}><span className="text-[7px] font-mono">{size.ratio}</span></div>
                        <span className="truncate">{size.name}</span>
                      </button>
                    ))}
                  </div>
                </Section>
                <Section label="Placement & Rules" icon="ri-layout-masonry-line">
                  <select
                    value={placement}
                    onChange={e => {
                      const val = e.target.value;
                      setPlacement(val);
                      if (val === "sidebar") { setCanvasWidth(480); setCanvasHeight(600); setAspectRatio("4:5"); }
                      else if (val === "hero") { setCanvasWidth(1200); setCanvasHeight(500); setAspectRatio("21:9"); }
                      else if (val === "inline") { setCanvasWidth(1200); setCanvasHeight(450); setAspectRatio("16:9"); }
                      else if (val === "promotional") { setCanvasWidth(800); setCanvasHeight(600); setAspectRatio("4:3"); }
                    }}
                    className="w-full px-2.5 py-1.5 bg-background border border-border-theme/30 rounded-lg text-[11px] font-bold text-foreground outline-none"
                  >
                    <option value="hero">Hero Carousel</option>
                    <option value="promotional">Popup Banner (Promotional)</option>
                    <option value="inline">Inline Grid</option>
                    <option value="sidebar">Sidebar Widget</option>
                  </select>

                  {placement === "promotional" && (
                    <div className="space-y-2 pt-2 border-t border-border-theme/20">
                      <InputField label="Show Delay (Seconds)" type="number" min={0} max={60} value={popupDelay} onChange={e => setPopupDelay(parseInt(e.target.value) || 0)} />
                      <InputField label="Auto-Close (Sec, 0 = Off)" type="number" min={0} max={120} value={autoCloseSeconds} onChange={e => setAutoCloseSeconds(parseInt(e.target.value) || 0)} />
                      <InputField label="Max Shows / Day / User" type="number" min={1} max={50} value={showTimesPerDay} onChange={e => setShowTimesPerDay(parseInt(e.target.value) || 1)} />
                      <label className="flex items-center gap-2 text-[11px] font-bold cursor-pointer text-foreground/80 pt-1">
                        <input type="checkbox" checked={dismissible} onChange={e => setDismissible(e.target.checked)} className="accent-accent w-3.5 h-3.5" />
                        Allow Manual Close (X & Backdrop)
                      </label>
                    </div>
                  )}

                  {placement === "hero" && (
                    <div className="pt-2 border-t border-border-theme/20">
                      <InputField label="Slide Position (0 = 1st)" type="number" min={0} max={20} value={position} onChange={e => setPosition(parseInt(e.target.value) || 0)} />
                    </div>
                  )}
                </Section>
                <Section label="Target Pages" icon="ri-pages-line">
                  <div className="space-y-1 bg-background/50 p-2 rounded-xl border border-border-theme/20">
                    {PAGE_OPTIONS.map(pg => (
                      <label key={pg.value} className="flex items-center gap-2 text-[11px] font-medium cursor-pointer text-foreground/70">
                        <input type="checkbox" checked={targetPages.includes(pg.value)}
                          onChange={e => setTargetPages(e.target.checked ? [...targetPages, pg.value] : targetPages.filter(p => p !== pg.value))}
                          className="accent-accent w-3.5 h-3.5" />
                        {pg.label}
                      </label>
                    ))}
                  </div>
                </Section>
                <Section label="Devices" icon="ri-device-line">
                  <div className="grid grid-cols-3 gap-1.5">
                    {DEVICE_OPTIONS.map(dev => (
                      <button key={dev.value} type="button" onClick={() => setDeviceTargets(deviceTargets.includes(dev.value) ? deviceTargets.filter(d => d !== dev.value) : [...deviceTargets, dev.value])}
                        className={`p-1.5 rounded-xl text-center text-[10px] font-bold border cursor-pointer flex flex-col items-center gap-0.5 transition ${
                          deviceTargets.includes(dev.value) ? "bg-accent/15 border-accent text-accent" : "bg-background/50 border-border-theme/20 text-foreground/40"
                        }`}>
                        <i className={dev.icon} /> {dev.label}
                      </button>
                    ))}
                  </div>
                </Section>
              </div>
            )}
          </div>
        </div>

        {/* ─── MIDDLE: Canvas Viewport ─── */}
        <div ref={viewportRef} className="flex-1 min-w-0 bg-background/40 flex flex-col items-center justify-center overflow-auto custom-scrollbar relative z-10" data-lenis-prevent
          style={{ backgroundImage: "radial-gradient(circle, var(--color-border-theme)/0.15 1px, transparent 1px)", backgroundSize: "20px 20px" }}>

          {/* Ratio badge */}
          <div className="mb-2 px-2.5 py-1 bg-surface/70 border border-border-theme/20 rounded-lg text-[10px] font-bold text-foreground/50 flex items-center gap-1.5 backdrop-blur-sm">
            <i className="ri-ruler-2-line" /> {aspectRatio} · {canvasWidth}×{canvasHeight}px
          </div>

          <div className="transition-transform duration-200" style={{ transform: `scale(${zoomLevel / 100})`, transformOrigin: "center center" }}>
            {/* The actual artboard — this is what gets exported */}
            <div
              ref={artboardRef}
              onClick={handleCanvasClick}
              className="relative overflow-hidden shadow-2xl touch-none cursor-crosshair"
              style={{
                width: `${canvasWidth}px`, height: `${canvasHeight}px`,
                background: getCanvasBackgroundCSS(backgroundColor),
                borderRadius: "12px",
              }}
            >
              {elements.filter(el => el.isVisible !== false && (!compilingCanvas || el.type !== "button")).map(el => (
                <CanvasElement
                  key={el.id} el={el}
                  selectedId={compilingCanvas ? null : selectedId} editingTextId={editingTextId}
                  setSelectedId={setSelectedId} setEditingTextId={setEditingTextId}
                  handleElementMouseDown={handleElementMouseDown}
                  handleResizeStart={handleResizeStart}
                  handleCanvasContextMenu={handleCanvasContextMenu}
                  updateSelectedElement={updateSel}
                  countdownText={countdownText}
                />
              ))}
            </div>
          </div>

          {/* Zoom Controls */}
          <div className="mt-3 flex items-center gap-1.5 bg-surface/70 border border-border-theme/20 rounded-lg px-2 py-1 backdrop-blur-sm">
            <button type="button" onClick={() => setZoomLevel(z => Math.max(25, z - 10))} className="w-6 h-6 rounded text-foreground/50 hover:text-foreground flex items-center justify-center cursor-pointer text-xs"><i className="ri-subtract-line" /></button>
            <span className="text-[10px] font-mono font-bold text-foreground/60 w-10 text-center">{zoomLevel}%</span>
            <button type="button" onClick={() => setZoomLevel(z => Math.min(200, z + 10))} className="w-6 h-6 rounded text-foreground/50 hover:text-foreground flex items-center justify-center cursor-pointer text-xs"><i className="ri-add-line" /></button>
            <span className="w-px h-4 bg-border-theme/20 mx-0.5" />
            <button type="button" onClick={() => setZoomLevel(100)} className="text-[9px] font-bold text-foreground/40 hover:text-accent cursor-pointer px-1">Reset</button>
          </div>
        </div>

        {/* ─── RIGHT: Design Inspector ─── */}
        <div className="w-72 bg-surface/80 border-l border-border-theme/20 flex flex-col h-full min-h-0 overflow-hidden flex-shrink-0">
          <div className="px-3 py-2.5 border-b border-border-theme/20 flex items-center justify-between flex-shrink-0">
            <span className="text-[10px] font-black text-foreground/60 uppercase tracking-wider">Inspector</span>
            {sel && <span className="text-[9px] text-accent font-mono uppercase font-bold bg-accent/10 px-1.5 py-0.5 rounded">{sel.type}</span>}
          </div>

          <div className="flex-1 min-h-0 overflow-y-auto p-3 space-y-3 custom-scrollbar" data-lenis-prevent>
            {/* Canvas BG always visible */}
            <Section label="Canvas Background" icon="ri-palette-line">
              <ColorRow value={backgroundColor} onChange={setBackgroundColor} />
            </Section>

            {sel ? (
              <>
                {/* Actions row */}
                <div className="flex items-center gap-1.5">
                  <button type="button" onClick={() => duplicateElement(sel.id)} className="flex-1 py-1.5 rounded-lg bg-accent/10 border border-accent/20 text-accent text-[10px] font-bold hover:bg-accent/20 transition cursor-pointer flex items-center justify-center gap-1">
                    <i className="ri-file-copy-line" /> Duplicate
                  </button>
                  <button type="button" onClick={() => removeElement(sel.id)} className="flex-1 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-[10px] font-bold hover:bg-red-500/20 transition cursor-pointer flex items-center justify-center gap-1">
                    <i className="ri-delete-bin-line" /> Delete
                  </button>
                </div>

                {/* Alignment */}
                <Section label="Alignment" icon="ri-layout-line">
                  <div className="grid grid-cols-6 gap-0.5 bg-background/50 p-0.5 rounded-lg border border-border-theme/20 text-foreground/50">
                    {[
                      { fn: "left", icon: "ri-align-left", t: "Left" },
                      { fn: "h_center", icon: "ri-align-center", t: "Center" },
                      { fn: "right", icon: "ri-align-right", t: "Right" },
                      { fn: "top", icon: "ri-align-top", t: "Top" },
                      { fn: "v_center", icon: "ri-align-vertically", t: "Middle" },
                      { fn: "bottom", icon: "ri-align-bottom", t: "Bottom" },
                    ].map(a => (
                      <button key={a.fn} type="button" onClick={() => handleAlign(a.fn)} title={a.t}
                        className="p-1.5 hover:text-accent text-center rounded cursor-pointer transition text-xs">
                        <i className={a.icon} />
                      </button>
                    ))}
                  </div>
                </Section>

                {/* Position & Size */}
                <Section label="Position & Size" icon="ri-drag-move-line">
                  <div className="grid grid-cols-2 gap-1.5">
                    <InputField label="X" type="number" value={sel.x} onChange={e => updateSel("x", parseInt(e.target.value) || 0)} />
                    <InputField label="Y" type="number" value={sel.y} onChange={e => updateSel("y", parseInt(e.target.value) || 0)} />
                    <InputField label="W" type="number" value={sel.width} onChange={e => updateSel("width", parseInt(e.target.value) || 50)} />
                    <InputField label="H" type="number" value={sel.height} onChange={e => updateSel("height", parseInt(e.target.value) || 20)} />
                  </div>
                </Section>

                {/* Fill */}
                <Section label="Fill" icon="ri-paint-fill">
                  <ColorRow value={sel.bgColor || sel.fill || "#ffffff"} onChange={v => { updateSel("fill", v); updateSel("bgColor", v); }} />
                </Section>

                {/* Typography (text/button/timer) */}
                {(sel.type === "text" || sel.type === "button" || sel.type === "timer") && (
                  <Section label="Typography" icon="ri-font-size-2">
                    <InputField label="Content" value={sel.content || sel.label || ""} onChange={e => sel.type === "timer" ? updateSel("label", e.target.value) : updateSel("content", e.target.value)} />
                    <ColorRow label="Text Color" value={sel.textColor || sel.color || "#ffffff"} onChange={v => { updateSel("textColor", v); updateSel("color", v); }} />
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-foreground/40 uppercase">Font</label>
                      <select value={sel.fontFamily || "Inter"} onChange={e => { loadGoogleFont(e.target.value); updateSel("fontFamily", e.target.value); }}
                        className="w-full px-2.5 py-1.5 bg-background border border-border-theme/30 rounded-lg text-[11px] font-bold text-foreground outline-none">
                        {FONT_OPTIONS.map(f => <option key={f} value={f}>{f}</option>)}
                      </select>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-foreground/40 uppercase">Size ({sel.fontSize || 14}px)</label>
                      <input type="range" min={10} max={80} value={sel.fontSize || 14} onChange={e => updateSel("fontSize", parseInt(e.target.value))} className="w-full accent-accent h-1.5" />
                    </div>
                  </Section>
                )}

                {/* Button: Link + Corner Radius */}
                {sel.type === "button" && (
                  <Section label="Button Link & Style" icon="ri-link">
                    <InputField label="Redirect URL" value={sel.link || ""} onChange={e => updateSel("link", e.target.value)} placeholder="/shop or https://..." />
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-foreground/40 uppercase">Quick Links</label>
                      <div className="flex flex-wrap gap-1">
                        {LINK_PRESETS.map(p => (
                          <button key={p.label} type="button" onClick={() => updateSel("link", p.url)}
                            className={`px-2 py-0.5 rounded-md text-[9px] font-bold border cursor-pointer transition flex items-center gap-1 ${
                              sel.link === p.url ? "bg-accent/15 border-accent text-accent" : "bg-surface-variant/15 border-border-theme/20 text-foreground/50 hover:text-accent hover:border-accent/30"
                            }`}>
                            <i className={`${p.icon} text-[10px]`} /> {p.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-0.5">
                      <label className="text-[9px] font-bold text-foreground/40 uppercase">Corner Radius ({sel.borderRadius || 12}px)</label>
                      <input type="range" min={0} max={40} value={sel.borderRadius || 12} onChange={e => updateSel("borderRadius", parseInt(e.target.value))} className="w-full accent-accent h-1.5" />
                    </div>
                    <button type="button" onClick={() => duplicateElement(sel.id)}
                      className="w-full py-2 rounded-lg bg-accent/10 border border-accent/25 text-accent font-bold text-[10px] hover:bg-accent/20 transition cursor-pointer flex items-center justify-center gap-1.5">
                      <i className="ri-file-copy-line" /> Duplicate This Button
                    </button>
                  </Section>
                )}

                {/* Timer controls */}
                {sel.type === "timer" && (
                  <Section label="Countdown" icon="ri-time-line">
                    <InputField label="End Date & Time" type="datetime-local" value={sel.endDate || sel.timerEndDate || ""} onChange={e => { updateSel("endDate", e.target.value); updateSel("timerEndDate", e.target.value); }} />
                  </Section>
                )}
              </>
            ) : (
              <div className="py-10 text-center text-foreground/30 text-[11px] space-y-2">
                <i className="ri-cursor-line text-2xl block text-accent/40" />
                <p>Select an element on canvas</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ═══ BOTTOM TOOLBAR ═══ */}
      <div className="flex items-center justify-center gap-1 px-4 py-2 border-t border-border-theme/20 bg-surface/60 backdrop-blur-xl flex-shrink-0">
        <button type="button" onClick={() => setActiveTool("move")}
          className={`px-3 py-1.5 rounded-lg cursor-pointer transition text-[11px] font-bold flex items-center gap-1.5 ${activeTool === "move" ? "bg-accent text-accent-content shadow" : "text-foreground/50 hover:text-foreground hover:bg-surface-variant/20"}`}>
          <i className="ri-cursor-line" /> Select
        </button>
        <span className="w-px h-5 bg-border-theme/20 mx-1" />
        <button type="button" onClick={() => handleAddText()} className="px-3 py-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-surface-variant/20 cursor-pointer transition text-[11px] font-bold flex items-center gap-1.5">
          <i className="ri-text text-accent" /> Text
        </button>
        <button type="button" onClick={() => handleAddButton()} className="px-3 py-1.5 rounded-lg text-foreground/50 hover:text-accent hover:bg-surface-variant/20 cursor-pointer transition text-[11px] font-bold flex items-center gap-1.5">
          <i className="ri-cursor-fill text-accent" /> Button
        </button>
        <button type="button" onClick={() => duplicateElement()} className="px-3 py-1.5 rounded-lg text-foreground/50 hover:text-accent hover:bg-surface-variant/20 cursor-pointer transition text-[11px] font-bold flex items-center gap-1.5">
          <i className="ri-file-copy-line text-accent" /> Duplicate
        </button>
        <button type="button" onClick={() => handleAddTimer()} className="px-3 py-1.5 rounded-lg text-foreground/50 hover:text-amber-400 hover:bg-surface-variant/20 cursor-pointer transition text-[11px] font-bold flex items-center gap-1.5">
          <i className="ri-time-line text-amber-400" /> Timer
        </button>
        <label className="px-3 py-1.5 rounded-lg text-foreground/50 hover:text-foreground hover:bg-surface-variant/20 cursor-pointer transition text-[11px] font-bold flex items-center gap-1.5">
          <i className="ri-image-add-line" /> Image
          <input type="file" accept="image/*" onChange={handleAddImage} className="hidden" />
        </label>
        <span className="w-px h-5 bg-border-theme/20 mx-1" />
        <button type="button" onClick={handleUndo} disabled={!past.length} className="px-2 py-1.5 rounded-lg text-foreground/40 hover:text-foreground disabled:opacity-30 cursor-pointer transition text-xs" title="Undo (Ctrl+Z)"><i className="ri-arrow-go-back-line" /></button>
        <button type="button" onClick={handleRedo} disabled={!future.length} className="px-2 py-1.5 rounded-lg text-foreground/40 hover:text-foreground disabled:opacity-30 cursor-pointer transition text-xs" title="Redo (Ctrl+Y)"><i className="ri-arrow-go-forward-line" /></button>
      </div>

      {/* ═══ Overlays ═══ */}
      {contextMenu.visible && (
        <ContextMenu x={contextMenu.x} y={contextMenu.y} targetId={contextMenu.targetId} elements={elements}
          moveZIndex={moveZIndex} updateSelectedElement={updateSel}
          handleDuplicateElement={duplicateElement} handleDeleteElementById={removeElement}
          handleAddText={handleAddText} handleAddButton={handleAddButton} handleAddTimer={handleAddTimer} handleAlign={handleAlign} />
      )}

      <BannerPreviewModal show={showLiveModal} onClose={() => setShowLiveModal(false)} title={title}
        elements={elements} backgroundColor={backgroundColor} canvasWidth={canvasWidth} canvasHeight={canvasHeight}
        previewImageSrc={null} countdownText={countdownText} />
    </div>
  );
};

export default AdminBannerEditorPage;
