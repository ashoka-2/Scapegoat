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
  PRESET_SHAPES,
  PRESET_GRADIENTS,
  TEXT_PRESETS,
} from "../Components/Canvas/CanvasPresets.js";
import {
  getCanvasBackgroundCSS,
  formatCountdown,
  loadGoogleFont,
} from "../Components/Canvas/canvasHelpers.js";

const DEVICE_OPTIONS = [
  { value: "desktop", label: "Desktop", icon: "ri-computer-line" },
  { value: "mobile", label: "Mobile", icon: "ri-smartphone-line" },
  { value: "tablet", label: "Tablet", icon: "ri-tablet-line" },
];

const AdminBannerEditorPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEditing = Boolean(id);

  // Main Banner Form States
  const [title, setTitle] = useState("");
  const [subtitle, setSubtitle] = useState("");
  const [placement, setPlacement] = useState("hero");
  const [position, setPosition] = useState(0);
  const [targetPages, setTargetPages] = useState(["home"]);
  const [deviceTargets, setDeviceTargets] = useState([]);
  const [altText, setAltText] = useState("Promotional banner");
  const [backgroundColor, setBackgroundColor] = useState("#111827");
  const [canvasWidth, setCanvasWidth] = useState(1200);
  const [canvasHeight, setCanvasHeight] = useState(500);
  const [aspectRatio, setAspectRatio] = useState("21:9");
  const [isActive, setIsActive] = useState(true);
  const [isDraft, setIsDraft] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Infinite Canvas Zoom & Pan
  const [zoomLevel, setZoomLevel] = useState(100);
  const [panOffset, setPanOffset] = useState({ x: 0, y: 0 });
  const [isPanMode, setIsPanMode] = useState(false);
  const [snapToGrid, setSnapToGrid] = useState(false);

  // Snitch Elements Engine Array
  const [elements, setElements] = useState([
    {
      id: "txt-title-1",
      type: "text",
      content: "MEGA FESTIVAL SALE 50% OFF",
      x: 350,
      y: 120,
      width: 500,
      height: 60,
      fontFamily: "Inter",
      fontSize: 28,
      fontWeight: "black",
      textAlign: "center",
      color: "#ffffff",
      isGradientText: false,
      textGradient: { start: "#ff007f", end: "#7f00ff", dir: "to-r" },
      zIndex: 1,
      opacity: 100,
      rotate: 0,
      isLocked: false,
    },
    {
      id: "btn-cta-1",
      type: "button",
      content: "SHOP NOW",
      link: "/category/sale",
      x: 525,
      y: 340,
      width: 160,
      height: 48,
      bgColor: "#ffffff",
      textColor: "#000000",
      borderColor: "#ffffff",
      borderWidth: 0,
      borderRadius: 8,
      fontSize: 14,
      paddingX: 24,
      paddingY: 12,
      shadow: true,
      zIndex: 2,
      opacity: 100,
      rotate: 0,
      isLocked: false,
    },
  ]);

  // Undo / Redo History Stacks
  const [past, setPast] = useState([]);
  const [future, setFuture] = useState([]);

  const pushToHistoryState = (newElements) => {
    setPast((prev) => [...prev.slice(-49), elements]);
    setFuture([]);
    setElements(newElements);
  };

  const handleUndo = () => {
    if (past.length === 0) return;
    const previous = past[past.length - 1];
    const newPast = past.slice(0, past.length - 1);
    setFuture((prev) => [elements, ...prev]);
    setElements(previous);
    setPast(newPast);
  };

  const handleRedo = () => {
    if (future.length === 0) return;
    const next = future[0];
    const newFuture = future.slice(1);
    setPast((prev) => [...prev, elements]);
    setElements(next);
    setFuture(newFuture);
  };

  const [selectedId, setSelectedId] = useState(null);
  const [editingTextId, setEditingTextId] = useState(null);
  const [activeLeftTab, setActiveLeftTab] = useState("assets"); // assets | canvas | layers
  const [previewDevice, setPreviewDevice] = useState("desktop");
  const [showLiveModal, setShowLiveModal] = useState(false);
  const [loadingBanner, setLoadingBanner] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [compilingCanvas, setCompilingCanvas] = useState(false);
  const [countdownText, setCountdownText] = useState("01h 30m 00s");
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, targetId: null });

  // Files
  const [desktopFile, setDesktopFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [tabletFile, setTabletFile] = useState(null);
  const [existingImages, setExistingImages] = useState({ desktop: "", mobile: "", tablet: "" });

  const canvasRef = useRef(null);
  const workspaceRef = useRef(null);
  const dragInfo = useRef({ isDragging: false, isResizing: false, isRotating: false });

  // Live timer tick
  useEffect(() => {
    const interval = setInterval(() => {
      const timerEl = elements.find((el) => el.type === "timer");
      if (timerEl?.endDate) {
        setCountdownText(formatCountdown(timerEl.endDate));
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [elements]);

  // Keyboard Shortcuts (Ctrl+Z, Ctrl+Y, Delete, Ctrl+D, Ctrl+0, H, V)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (editingTextId) return;
      if ((e.ctrlKey || e.metaKey) && e.key === "z") {
        e.preventDefault();
        if (e.shiftKey) handleRedo();
        else handleUndo();
      } else if ((e.ctrlKey || e.metaKey) && e.key === "y") {
        e.preventDefault();
        handleRedo();
      } else if (e.key === "Delete" && selectedId) {
        e.preventDefault();
        removeElementById(selectedId);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "d" && selectedId) {
        e.preventDefault();
        duplicateElement(selectedId);
      } else if ((e.ctrlKey || e.metaKey) && e.key === "0") {
        e.preventDefault();
        setZoomLevel(100);
        setPanOffset({ x: 0, y: 0 });
      } else if (e.key === "h" || e.key === "H") {
        setIsPanMode((prev) => !prev);
      } else if (e.key === "v" || e.key === "V") {
        setIsPanMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [selectedId, editingTextId, past, future]);

  // Context Menu listener to close on click
  useEffect(() => {
    const closeMenu = () => setContextMenu((prev) => (prev.visible ? { ...prev, visible: false } : prev));
    window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, []);

  const handleCanvasContextMenu = (e, targetId = null) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      targetId,
    });
  };

  // Load banner data if editing
  useEffect(() => {
    if (!id) return;
    const loadBanner = async () => {
      setLoadingBanner(true);
      try {
        const data = await getBannerByIdApi(id);
        if (data.banner) {
          const b = data.banner;
          setTitle(b.title || "");
          setSubtitle(b.subtitle || "");
          setPlacement(b.placement || "hero");
          setPosition(b.position || 0);
          setTargetPages(b.targetPages || ["home"]);
          setDeviceTargets(b.deviceTargets || []);
          setAltText(b.altText || "Promotional banner");
          setBackgroundColor(b.backgroundColor || "#111827");
          setCanvasWidth(b.canvasWidth || 1200);
          setCanvasHeight(b.canvasHeight || 500);
          setAspectRatio(b.aspectRatio || "21:9");
          setIsActive(b.isActive ?? true);
          setIsDraft(b.isDraft ?? false);
          setStartDate(b.startDate ? new Date(b.startDate).toISOString().slice(0, 16) : "");
          setEndDate(b.endDate ? new Date(b.endDate).toISOString().slice(0, 16) : "");

          if (Array.isArray(b.elements) && b.elements.length > 0) {
            setElements(b.elements);
          }
          setExistingImages({
            desktop: b.image || "",
            mobile: b.mobileImage || "",
            tablet: b.tabletImage || "",
          });
        }
      } catch (err) {
        console.error("Failed to load banner:", err);
      } finally {
        setLoadingBanner(false);
      }
    };
    loadBanner();
  }, [id]);

  // Selected element helper
  const selectedElement = elements.find((el) => el.id === selectedId);

  const updateSelectedElement = (key, val) => {
    if (!selectedId) return;
    const updated = elements.map((el) => (el.id === selectedId ? { ...el, [key]: val } : el));
    pushToHistoryState(updated);
  };

  const removeElementById = (targetId) => {
    const updated = elements.filter((el) => el.id !== targetId);
    pushToHistoryState(updated);
    if (selectedId === targetId) setSelectedId(null);
  };

  const duplicateElement = (targetId) => {
    const el = elements.find((item) => item.id === targetId);
    if (!el) return;
    const newId = `${el.type}-${Date.now()}`;
    const duplicated = {
      ...el,
      id: newId,
      x: Math.min(canvasWidth - el.width, el.x + 20),
      y: Math.min(canvasHeight - el.height, el.y + 20),
      zIndex: elements.length + 1,
    };
    pushToHistoryState([...elements, duplicated]);
    setSelectedId(newId);
  };

  // Move Z-Index ordering (Front / Back / Forward / Backward)
  const moveZIndex = (direction) => {
    if (!selectedId) return;
    let list = [...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
    const itemIdx = list.findIndex((el) => el.id === selectedId);
    if (itemIdx === -1) return;

    if (direction === "front") {
      const [item] = list.splice(itemIdx, 1);
      list.push(item);
    } else if (direction === "back") {
      const [item] = list.splice(itemIdx, 1);
      list.unshift(item);
    } else if (direction === "forward" && itemIdx < list.length - 1) {
      const [item] = list.splice(itemIdx, 1);
      list.splice(itemIdx + 1, 0, item);
    } else if (direction === "backward" && itemIdx > 0) {
      const [item] = list.splice(itemIdx, 1);
      list.splice(itemIdx - 1, 0, item);
    }

    const updated = elements.map((el) => {
      const newListIdx = list.findIndex((item) => item.id === el.id);
      return { ...el, zIndex: newListIdx + 1 };
    });
    pushToHistoryState(updated);
  };

  // Align elements relative to canvas bounds
  const handleAlign = (direction) => {
    if (!selectedId) return;
    const el = elements.find((item) => item.id === selectedId);
    if (!el || el.isLocked) return;

    let newX = el.x;
    let newY = el.y;

    if (direction === "left") newX = 20;
    if (direction === "h_center") newX = Math.round((canvasWidth - el.width) / 2);
    if (direction === "right") newX = canvasWidth - el.width - 20;
    if (direction === "top") newY = 20;
    if (direction === "v_center") newY = Math.round((canvasHeight - el.height) / 2);
    if (direction === "bottom") newY = canvasHeight - el.height - 20;

    const updated = elements.map((item) => (item.id === selectedId ? { ...item, x: newX, y: newY } : item));
    pushToHistoryState(updated);
  };

  // Add Element Handlers
  const handleAddText = (preset = null) => {
    if (preset?.fontFamily) loadGoogleFont(preset.fontFamily);
    const newId = `text-${Date.now()}`;
    const newEl = {
      id: newId,
      type: "text",
      content: preset ? preset.name : "Double Click to Edit",
      x: Math.round((canvasWidth - 260) / 2),
      y: Math.round((canvasHeight - 50) / 2),
      width: 260,
      height: 50,
      fontFamily: preset?.fontFamily || "Inter",
      fontSize: preset?.fontSize || 22,
      fontWeight: preset?.fontWeight || "bold",
      textAlign: "center",
      color: preset?.color || "#ffffff",
      isGradientText: preset?.isGradientText || false,
      textGradient: preset?.textGradient || { start: "#ff007f", end: "#7f00ff", dir: "to-r" },
      shadowX: preset?.shadowX || 0,
      shadowY: preset?.shadowY || 0,
      shadowBlur: preset?.shadowBlur || 0,
      shadowColor: preset?.shadowColor || "rgba(0,0,0,0.5)",
      zIndex: elements.length + 1,
      opacity: 100,
      rotate: 0,
      isLocked: false,
    };
    pushToHistoryState([...elements, newEl]);
    setSelectedId(newId);
  };

  const handleAddButton = () => {
    const newId = `btn-${Date.now()}`;
    const newEl = {
      id: newId,
      type: "button",
      content: "SHOP NOW",
      link: "#",
      x: Math.round((canvasWidth - 160) / 2),
      y: Math.round((canvasHeight - 48) / 2 + 50),
      width: 160,
      height: 48,
      bgColor: "#ffffff",
      textColor: "#000000",
      borderColor: "#ffffff",
      borderWidth: 0,
      borderRadius: 8,
      fontSize: 14,
      paddingX: 24,
      paddingY: 12,
      shadow: true,
      zIndex: elements.length + 1,
      opacity: 100,
      rotate: 0,
      isLocked: false,
    };
    pushToHistoryState([...elements, newEl]);
    setSelectedId(newId);
  };

  const handleAddTimer = () => {
    const newId = `timer-${Date.now()}`;
    const newEl = {
      id: newId,
      type: "timer",
      label: "Offer ends in:",
      endDate: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 16),
      x: Math.round((canvasWidth - 260) / 2),
      y: Math.round((canvasHeight - 48) / 2),
      width: 260,
      height: 48,
      bgColor: "rgba(0, 0, 0, 0.75)",
      textColor: "#ffffff",
      accentColor: "#f59e0b",
      fontSize: 14,
      borderRadius: 12,
      paddingX: 18,
      paddingY: 10,
      zIndex: elements.length + 1,
      opacity: 100,
      rotate: 0,
      isLocked: false,
    };
    pushToHistoryState([...elements, newEl]);
    setSelectedId(newId);
  };

  const handleAddShape = (shapeKey) => {
    const template = PRESET_SHAPES[shapeKey];
    if (!template) return;
    const newId = `shape-${Date.now()}`;
    const newEl = {
      id: newId,
      type: "shape",
      shapeType: template.shapeType,
      points: template.points,
      path: template.path,
      name: template.name,
      x: Math.round((canvasWidth - 140) / 2),
      y: Math.round((canvasHeight - 140) / 2),
      width: 140,
      height: 140,
      fill: "#4f46e5",
      stroke: "#312e81",
      strokeWidth: 0,
      zIndex: elements.length + 1,
      opacity: 100,
      rotate: 0,
      isLocked: false,
    };
    pushToHistoryState([...elements, newEl]);
    setSelectedId(newId);
  };

  const handleAddImageFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const newId = `image-${Date.now()}`;
      const newEl = {
        id: newId,
        type: "image",
        url: reader.result,
        x: Math.round((canvasWidth - 280) / 2),
        y: Math.round((canvasHeight - 180) / 2),
        width: 280,
        height: 180,
        zIndex: elements.length + 1,
        opacity: 100,
        rotate: 0,
        borderRadius: 0,
        isLocked: false,
      };
      pushToHistoryState([...elements, newEl]);
      setSelectedId(newId);
    };
    reader.readAsDataURL(file);
  };

  // ── Infinite Canvas Hand Pan Mode ──
  const handleWorkspacePointerDown = (e) => {
    if (!isPanMode) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const initialPanX = panOffset.x;
    const initialPanY = panOffset.y;

    const handlePanMove = (moveEv) => {
      const dx = moveEv.clientX - startX;
      const dy = moveEv.clientY - startY;
      setPanOffset({ x: initialPanX + dx, y: initialPanY + dy });
    };

    const handlePanUp = () => {
      window.removeEventListener("pointermove", handlePanMove);
      window.removeEventListener("pointerup", handlePanUp);
    };

    window.addEventListener("pointermove", handlePanMove);
    window.addEventListener("pointerup", handlePanUp);
  };

  // ── Snitch Mouse Dragging Engine ──
  const handleElementMouseDown = (e, item) => {
    if (isPanMode) return;
    e.stopPropagation();
    setSelectedId(item.id);
    setEditingTextId(null);
    if (item.isLocked) return;

    const canvasNode = canvasRef.current;
    const rect = canvasNode?.getBoundingClientRect();
    const scaleX = (rect ? rect.width / canvasWidth : 1) * (zoomLevel / 100);
    const scaleY = (rect ? rect.height / canvasHeight : 1) * (zoomLevel / 100);

    dragInfo.current = {
      isDragging: true,
      startX: e.clientX,
      startY: e.clientY,
      elementX: item.x,
      elementY: item.y,
      scaleX,
      scaleY,
    };

    const handleGlobalDragMouseMove = (moveEv) => {
      const dx = (moveEv.clientX - dragInfo.current.startX) / dragInfo.current.scaleX;
      const dy = (moveEv.clientY - dragInfo.current.startY) / dragInfo.current.scaleY;

      const grid = snapToGrid ? 8 : 1;
      const newX = Math.round((dragInfo.current.elementX + dx) / grid) * grid;
      const newY = Math.round((dragInfo.current.elementY + dy) / grid) * grid;

      setElements((prev) =>
        prev.map((el) => (el.id === item.id ? { ...el, x: newX, y: newY } : el))
      );
    };

    const handleGlobalDragMouseUp = () => {
      window.removeEventListener("pointermove", handleGlobalDragMouseMove);
      window.removeEventListener("pointerup", handleGlobalDragMouseUp);
      pushToHistoryState(elementsRef.current);
    };

    window.addEventListener("pointermove", handleGlobalDragMouseMove);
    window.addEventListener("pointerup", handleGlobalDragMouseUp);
  };

  // ── 8-Pin 2D Resizing Engine ──
  const handleResizeStart = (e, pin, item) => {
    e.stopPropagation();
    e.preventDefault();
    if (item.isLocked) return;

    const canvasNode = canvasRef.current;
    const rect = canvasNode?.getBoundingClientRect();
    const scaleX = (rect ? rect.width / canvasWidth : 1) * (zoomLevel / 100);
    const scaleY = (rect ? rect.height / canvasHeight : 1) * (zoomLevel / 100);

    const startX = e.clientX;
    const startY = e.clientY;
    const startW = item.width;
    const startH = item.height;
    const startXPos = item.x;
    const startYPos = item.y;

    const handleResizeMove = (moveEv) => {
      const dx = (moveEv.clientX - startX) / scaleX;
      const dy = (moveEv.clientY - startY) / scaleY;

      let newW = startW;
      let newH = startH;
      let newX = startXPos;
      let newY = startYPos;

      if (pin.includes("e")) newW = Math.max(30, startW + dx);
      if (pin.includes("w")) {
        newW = Math.max(30, startW - dx);
        newX = startXPos + (startW - newW);
      }
      if (pin.includes("s")) newH = Math.max(20, startH + dy);
      if (pin.includes("n")) {
        newH = Math.max(20, startH - dy);
        newY = startYPos + (startH - newH);
      }

      setElements((prev) =>
        prev.map((el) =>
          el.id === item.id ? { ...el, width: Math.round(newW), height: Math.round(newH), x: Math.round(newX), y: Math.round(newY) } : el
        )
      );
    };

    const handleResizeUp = () => {
      window.removeEventListener("pointermove", handleResizeMove);
      window.removeEventListener("pointerup", handleResizeUp);
      pushToHistoryState(elementsRef.current);
    };

    window.addEventListener("pointermove", handleResizeMove);
    window.addEventListener("pointerup", handleResizeUp);
  };

  // ── html2canvas-pro Compile & PNG Export ──
  const exportCanvasAsPNG = async () => {
    if (!canvasRef.current) return;
    setCompilingCanvas(true);

    const prevSel = selectedId;
    setSelectedId(null);
    await new Promise((r) => setTimeout(r, 150));

    try {
      const canvas = await html2canvas(canvasRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: backgroundColor || null,
        logging: false,
      });

      const dataUrl = canvas.toDataURL("image/png");
      const a = document.createElement("a");
      a.href = dataUrl;
      a.download = `banner_${title || "design"}_${canvasWidth}x${canvasHeight}.png`;
      a.click();
    } catch (err) {
      console.error("Failed compiling canvas:", err);
    } finally {
      setSelectedId(prevSel);
      setCompilingCanvas(false);
    }
  };

  // Save handler
  const handleSave = async (saveAsDraft = false) => {
    if (!title.trim()) {
      alert("Please enter a banner title");
      return;
    }

    setSaving(true);
    setCompilingCanvas(true);

    setSelectedId(null);
    await new Promise((r) => setTimeout(r, 150));

    try {
      let compiledImageBlob = null;
      if (canvasRef.current) {
        try {
          const compiledCanvas = await html2canvas(canvasRef.current, {
            scale: 2,
            useCORS: true,
            backgroundColor: backgroundColor || "#111827",
            logging: false,
          });
          compiledImageBlob = await new Promise((resolve) =>
            compiledCanvas.toBlob((blob) => resolve(blob), "image/png")
          );
        } catch (e) {
          console.warn("Canvas compile fallback:", e);
        }
      }

      const formData = new FormData();
      formData.append("title", title);
      formData.append("subtitle", subtitle || "");
      formData.append("placement", placement);
      formData.append("position", position || 0);
      formData.append("targetPages", JSON.stringify(targetPages));
      formData.append("deviceTargets", JSON.stringify(deviceTargets));
      formData.append("altText", altText || "");
      formData.append("backgroundColor", backgroundColor || "");
      formData.append("canvasWidth", canvasWidth);
      formData.append("canvasHeight", canvasHeight);
      formData.append("aspectRatio", aspectRatio);
      formData.append("isDraft", saveAsDraft);
      formData.append("isActive", saveAsDraft ? false : isActive);
      formData.append("startDate", startDate || "");
      formData.append("endDate", endDate || "");
      formData.append("elements", JSON.stringify(elements));

      if (desktopFile) {
        formData.append("image", desktopFile);
      } else if (compiledImageBlob) {
        formData.append("image", compiledImageBlob, `compiled_banner_${Date.now()}.png`);
      }

      if (mobileFile) formData.append("mobileImage", mobileFile);
      if (tabletFile) formData.append("tabletImage", tabletFile);

      if (isEditing) {
        await updateBannerApi(id, formData);
      } else {
        await createBannerApi(formData);
      }
      navigate("/admin/banners");
    } catch (err) {
      console.error("Failed to save banner:", err);
      alert(err.response?.data?.message || "Failed to save banner");
    } finally {
      setSaving(false);
      setCompilingCanvas(false);
    }
  };

  const getActivePreviewImage = () => {
    if (previewDevice === "mobile") {
      if (mobileFile) return URL.createObjectURL(mobileFile);
      if (existingImages.mobile) return existingImages.mobile;
    } else if (previewDevice === "tablet") {
      if (tabletFile) return URL.createObjectURL(tabletFile);
      if (existingImages.tablet) return existingImages.tablet;
    }
    if (desktopFile) return URL.createObjectURL(desktopFile);
    return existingImages.desktop || null;
  };

  const previewImageSrc = getActivePreviewImage();

  if (loadingBanner) return <AdminBannerEditorSkeleton />;

  return (
    <div className="flex flex-col h-[calc(100vh-80px)] overflow-hidden select-none bg-background">
      {/* Top Figma Floating Toolbar */}
      <div className="flex items-center justify-between px-6 py-2.5 bg-surface/90 border-b border-border-theme/30 backdrop-blur-md flex-shrink-0 z-40">
        <div className="flex items-center gap-3">
          <Link
            to="/admin/banners"
            className="w-9 h-9 rounded-xl bg-surface-variant/30 border border-border-theme/40 flex items-center justify-center text-foreground hover:text-accent transition cursor-pointer"
          >
            <i className="ri-arrow-left-line text-lg" />
          </Link>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Untitled Banner Design..."
              className="bg-transparent text-sm font-black text-foreground outline-none border-b border-transparent focus:border-accent"
            />
            <span className="text-[10px] px-2 py-0.5 rounded bg-accent/15 text-accent font-mono">
              {canvasWidth}×{canvasHeight}px
            </span>
          </div>
        </div>

        {/* Figma Interactive Toolset */}
        <div className="flex items-center gap-1 bg-surface-variant/20 p-1 rounded-2xl border border-border-theme/30">
          <button
            type="button"
            onClick={() => setIsPanMode(false)}
            className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              !isPanMode ? "bg-accent text-accent-content shadow" : "text-foreground/60 hover:text-foreground"
            }`}
            title="Select Tool (V)"
          >
            <i className="ri-cursor-line text-sm" />
          </button>
          <button
            type="button"
            onClick={() => setIsPanMode(true)}
            className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              isPanMode ? "bg-accent text-accent-content shadow" : "text-foreground/60 hover:text-foreground"
            }`}
            title="Hand / Pan Tool (H)"
          >
            <i className="ri-hand-line text-sm" />
          </button>

          <span className="w-px h-4 bg-border-theme/30 mx-1" />

          <button onClick={() => handleAddText()} className="p-2 rounded-xl text-xs font-bold text-foreground/70 hover:text-accent hover:bg-surface-variant/30 cursor-pointer" title="Text Tool (T)">
            <i className="ri-text text-sm" />
          </button>
          <button onClick={handleAddButton} className="p-2 rounded-xl text-xs font-bold text-foreground/70 hover:text-accent hover:bg-surface-variant/30 cursor-pointer" title="CTA Button Tool (B)">
            <i className="ri-cursor-fill text-sm" />
          </button>
          <button onClick={() => handleAddShape("rect")} className="p-2 rounded-xl text-xs font-bold text-foreground/70 hover:text-accent hover:bg-surface-variant/30 cursor-pointer" title="Rectangle Tool (R)">
            <i className="ri-checkbox-blank-line text-sm" />
          </button>
          <button onClick={handleAddTimer} className="p-2 rounded-xl text-xs font-bold text-foreground/70 hover:text-amber-400 hover:bg-surface-variant/30 cursor-pointer" title="Sale Timer Tool">
            <i className="ri-time-line text-sm text-amber-400" />
          </button>
          <label className="p-2 rounded-xl text-xs font-bold text-foreground/70 hover:text-accent hover:bg-surface-variant/30 cursor-pointer" title="Import Graphic (I)">
            <i className="ri-image-add-line text-sm" />
            <input type="file" accept="image/*" onChange={handleAddImageFile} className="hidden" />
          </label>

          <span className="w-px h-4 bg-border-theme/30 mx-1" />

          <button
            onClick={() => setSnapToGrid(!snapToGrid)}
            className={`p-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              snapToGrid ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "text-foreground/60 hover:text-foreground"
            }`}
            title="Snap to Grid (8px)"
          >
            <i className="ri-grid-line text-sm" />
          </button>

          {/* Undo / Redo */}
          <button onClick={handleUndo} disabled={past.length === 0} className="p-2 rounded-xl text-xs text-foreground/70 hover:text-accent disabled:opacity-30 cursor-pointer" title="Undo (Ctrl+Z)">
            <i className="ri-arrow-go-back-line text-sm" />
          </button>
          <button onClick={handleRedo} disabled={future.length === 0} className="p-2 rounded-xl text-xs text-foreground/70 hover:text-accent disabled:opacity-30 cursor-pointer" title="Redo (Ctrl+Y)">
            <i className="ri-arrow-go-forward-line text-sm" />
          </button>
        </div>

        {/* Studio Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={exportCanvasAsPNG}
            disabled={compilingCanvas}
            className="px-3.5 py-1.5 rounded-xl bg-surface-variant/30 border border-border-theme/40 text-xs font-bold text-foreground hover:bg-surface-variant/50 transition cursor-pointer flex items-center gap-1.5"
          >
            {compilingCanvas ? <i className="ri-loader-4-line animate-spin" /> : <i className="ri-download-2-line" />} Export PNG
          </button>
          <button
            onClick={() => setShowLiveModal(true)}
            className="px-3.5 py-1.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/30 text-xs font-bold hover:bg-blue-500/20 transition cursor-pointer flex items-center gap-1.5"
          >
            <i className="ri-eye-line" /> View Modal
          </button>
          <button
            onClick={() => handleSave(true)}
            disabled={saving}
            className="px-3.5 py-1.5 rounded-xl border border-border-theme/40 text-xs font-bold text-foreground hover:bg-surface-variant/20 transition cursor-pointer"
          >
            Save Draft
          </button>
          <button
            onClick={() => handleSave(false)}
            disabled={saving}
            className="px-5 py-1.5 rounded-xl bg-accent text-accent-content text-xs font-black shadow hover:shadow-lg transition cursor-pointer flex items-center gap-1.5"
          >
            {saving && <i className="ri-loader-4-line animate-spin" />}
            Publish
          </button>
        </div>
      </div>

      {/* Main Figma Studio Body */}
      <div className="flex flex-1 overflow-hidden">
        {/* LEFT FIGMA PANEL: Layers & Assets Drawer */}
        <div className="w-72 bg-surface/60 border-r border-border-theme/30 flex flex-col h-full overflow-hidden flex-shrink-0">
          <div className="grid grid-cols-3 border-b border-border-theme/20 text-[10px] font-black uppercase tracking-wider text-center">
            <button
              onClick={() => setActiveLeftTab("assets")}
              className={`py-3 border-b-2 transition cursor-pointer ${
                activeLeftTab === "assets" ? "border-accent text-accent bg-accent/5" : "border-transparent text-foreground/50 hover:text-foreground"
              }`}
            >
              <i className="ri-shapes-line text-sm block mb-0.5" /> Assets
            </button>
            <button
              onClick={() => setActiveLeftTab("canvas")}
              className={`py-3 border-b-2 transition cursor-pointer ${
                activeLeftTab === "canvas" ? "border-accent text-accent bg-accent/5" : "border-transparent text-foreground/50 hover:text-foreground"
              }`}
            >
              <i className="ri-palette-line text-sm block mb-0.5" /> Canvas
            </button>
            <button
              onClick={() => setActiveLeftTab("layers")}
              className={`py-3 border-b-2 transition cursor-pointer ${
                activeLeftTab === "layers" ? "border-accent text-accent bg-accent/5" : "border-transparent text-foreground/50 hover:text-foreground"
              }`}
            >
              <i className="ri-stack-line text-sm block mb-0.5" /> Layers ({elements.length})
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            {activeLeftTab === "assets" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-foreground/60 uppercase tracking-wider">Typography Presets</span>
                  <div className="grid grid-cols-1 gap-1.5">
                    {TEXT_PRESETS.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => handleAddText(preset)}
                        className="p-2.5 rounded-xl bg-surface-variant/10 border border-border-theme/20 hover:border-accent/40 text-left text-xs font-bold text-foreground transition cursor-pointer"
                      >
                        {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-foreground/60 uppercase tracking-wider">Vector Shapes</span>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.keys(PRESET_SHAPES).map((shapeKey) => (
                      <button
                        key={shapeKey}
                        onClick={() => handleAddShape(shapeKey)}
                        className="p-2.5 rounded-xl bg-surface-variant/10 border border-border-theme/20 hover:border-accent/40 text-center text-xs font-bold text-foreground transition cursor-pointer flex flex-col items-center gap-1"
                      >
                        <i className="ri-checkbox-blank-line text-base text-accent" />
                        <span className="text-[10px] truncate w-full">{PRESET_SHAPES[shapeKey].name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {activeLeftTab === "canvas" && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-foreground/60 uppercase tracking-wider">Preset Aspect Ratios</span>
                  <div className="grid grid-cols-1 gap-2">
                    {CANVAS_SIZES.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => {
                          setCanvasWidth(preset.width);
                          setCanvasHeight(preset.height);
                          setAspectRatio(preset.ratio);
                        }}
                        className={`p-2.5 rounded-xl border text-left text-xs font-bold transition cursor-pointer ${
                          canvasWidth === preset.width ? "bg-accent/15 border-accent text-accent" : "bg-surface-variant/10 border-border-theme/20 text-foreground/70"
                        }`}
                      >
                        <i className={`${preset.icon} mr-1`} /> {preset.name}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <span className="text-[10px] font-black text-foreground/60 uppercase tracking-wider">Canvas Fill Color</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={typeof backgroundColor === "string" ? backgroundColor : "#111827"}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="w-10 h-10 rounded-xl border-0 cursor-pointer"
                    />
                    <input
                      type="text"
                      value={typeof backgroundColor === "string" ? backgroundColor : "#111827"}
                      onChange={(e) => setBackgroundColor(e.target.value)}
                      className="flex-1 px-3 py-2 rounded-xl bg-surface-variant/20 border border-border-theme/30 text-xs font-mono text-foreground"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeLeftTab === "layers" && (
              <div className="space-y-2">
                <span className="text-[10px] font-black text-foreground/60 uppercase tracking-wider">Figma Layer Tree</span>
                {elements.length === 0 ? (
                  <p className="text-xs text-foreground/40 text-center py-6">No layers active.</p>
                ) : (
                  <div className="space-y-1.5">
                    {[...elements]
                      .sort((a, b) => b.zIndex - a.zIndex)
                      .map((el) => (
                        <div
                          key={el.id}
                          onClick={() => setSelectedId(el.id)}
                          className={`flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                            selectedId === el.id ? "bg-accent/15 border-accent text-accent" : "bg-surface-variant/10 border-border-theme/20 text-foreground/70"
                          }`}
                        >
                          <span className="truncate">{el.type.toUpperCase()}: {el.content || el.name || el.id}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                updateSelectedElement("isLocked", !el.isLocked);
                              }}
                              className="p-1 hover:text-amber-400"
                            >
                              <i className={el.isLocked ? "ri-lock-line" : "ri-lock-unlock-line"} />
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeElementById(el.id);
                              }}
                              className="p-1 hover:text-red-400"
                            >
                              <i className="ri-delete-bin-line" />
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* MIDDLE: Zoomable & Pannable Infinite Canvas Workspace */}
        <div
          ref={workspaceRef}
          onPointerDown={handleWorkspacePointerDown}
          className={`flex-1 bg-background/60 p-8 flex items-center justify-center overflow-hidden relative ${
            isPanMode ? "cursor-grab active:cursor-grabbing" : "cursor-default"
          }`}
        >
          {/* Target Device Switcher */}
          <div className="absolute top-4 left-6 flex items-center gap-1 p-1 rounded-2xl bg-surface/80 border border-border-theme/30 shadow-sm backdrop-blur-md z-30">
            {DEVICE_OPTIONS.map((dev) => (
              <button
                key={dev.value}
                onClick={() => setPreviewDevice(dev.value)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition cursor-pointer ${
                  previewDevice === dev.value ? "bg-accent text-accent-content shadow" : "text-foreground/50 hover:text-foreground"
                }`}
              >
                <i className={dev.icon} /> {dev.label}
              </button>
            ))}
          </div>

          {/* Floating Canvas Zoom Controls (Bottom Right) */}
          <div className="absolute bottom-6 right-6 flex items-center gap-1.5 p-1.5 rounded-2xl bg-surface/90 border border-border-theme/40 shadow-xl backdrop-blur-md z-30">
            <button
              onClick={() => setZoomLevel((z) => Math.max(30, z - 15))}
              className="p-2 rounded-xl text-xs font-bold text-foreground/70 hover:text-accent hover:bg-surface-variant/30 cursor-pointer"
              title="Zoom Out"
            >
              <i className="ri-zoom-out-line text-sm" />
            </button>
            <span className="text-xs font-mono font-bold text-foreground px-2">{zoomLevel}%</span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(250, z + 15))}
              className="p-2 rounded-xl text-xs font-bold text-foreground/70 hover:text-accent hover:bg-surface-variant/30 cursor-pointer"
              title="Zoom In"
            >
              <i className="ri-zoom-in-line text-sm" />
            </button>
            <button
              onClick={() => {
                setZoomLevel(100);
                setPanOffset({ x: 0, y: 0 });
              }}
              className="px-2.5 py-1 rounded-xl text-[10px] font-bold bg-surface-variant/30 text-foreground/80 hover:text-accent cursor-pointer"
              title="Fit Screen (Ctrl+0)"
            >
              100%
            </button>
          </div>

          {/* Scaled & Panned Canvas Viewport */}
          <div
            className={`transition-all duration-300 relative ${
              previewDevice === "mobile" ? "w-[340px]" : previewDevice === "tablet" ? "w-[560px]" : "w-full max-w-[900px]"
            }`}
            style={{
              transform: `scale(${zoomLevel / 100}) translate(${panOffset.x}px, ${panOffset.y}px)`,
              transformOrigin: "center center",
            }}
          >
            <div
              ref={canvasRef}
              onClick={() => setSelectedId(null)}
              className="relative w-full rounded-2xl overflow-hidden border border-border-theme/40 shadow-2xl touch-none"
              style={{
                aspectRatio: `${canvasWidth} / ${canvasHeight}`,
                background: getCanvasBackgroundCSS(backgroundColor),
              }}
            >
              {/* Optional Background Image */}
              {previewImageSrc && (
                <img src={previewImageSrc} alt={altText} className="w-full h-full object-cover select-none pointer-events-none" draggable={false} />
              )}

              {/* Render Canvas Elements via CanvasElement Component */}
              {elements.map((el) => (
                <CanvasElement
                  key={el.id}
                  el={el}
                  selectedId={selectedId}
                  editingTextId={editingTextId}
                  setSelectedId={setSelectedId}
                  setEditingTextId={setEditingTextId}
                  handleElementMouseDown={handleElementMouseDown}
                  handleResizeStart={handleResizeStart}
                  handleCanvasContextMenu={handleCanvasContextMenu}
                  updateSelectedElement={updateSelectedElement}
                  countdownText={countdownText}
                />
              ))}
            </div>
          </div>
        </div>

        {/* RIGHT INSPECTOR PANEL: Figma Style Design Inspector */}
        <div className="w-80 bg-surface/60 border-l border-border-theme/30 flex flex-col h-full overflow-hidden flex-shrink-0">
          <div className="p-4 border-b border-border-theme/20 font-black text-xs uppercase tracking-wider text-foreground flex items-center justify-between">
            <span>Design Inspector</span>
            {selectedElement && (
              <span className="text-[10px] text-accent font-mono uppercase">{selectedElement.type}</span>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selectedElement ? (
              <div className="space-y-4">
                {/* Header Actions */}
                <div className="flex items-center justify-between border-b border-border-theme/20 pb-3">
                  <span className="text-xs font-bold text-foreground">Element Properties</span>
                  <div className="flex items-center gap-2">
                    <button onClick={() => duplicateElement(selectedElement.id)} className="text-xs text-accent font-bold hover:underline">
                      Duplicate
                    </button>
                    <button onClick={() => removeElementById(selectedElement.id)} className="text-xs text-red-400 font-bold hover:underline">
                      Delete
                    </button>
                  </div>
                </div>

                {/* Transform & Position Controls */}
                <div className="space-y-2">
                  <span className="text-[10px] font-black text-foreground/60 uppercase">Position & Dimensions</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground/50">X (px)</label>
                      <input
                        type="number"
                        value={selectedElement.x}
                        onChange={(e) => updateSelectedElement("x", parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-background border border-border-theme/30 rounded-lg text-xs font-mono text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground/50">Y (px)</label>
                      <input
                        type="number"
                        value={selectedElement.y}
                        onChange={(e) => updateSelectedElement("y", parseInt(e.target.value) || 0)}
                        className="w-full px-2.5 py-1.5 bg-background border border-border-theme/30 rounded-lg text-xs font-mono text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground/50">Width (px)</label>
                      <input
                        type="number"
                        value={selectedElement.width}
                        onChange={(e) => updateSelectedElement("width", parseInt(e.target.value) || 50)}
                        className="w-full px-2.5 py-1.5 bg-background border border-border-theme/30 rounded-lg text-xs font-mono text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground/50">Height (px)</label>
                      <input
                        type="number"
                        value={selectedElement.height}
                        onChange={(e) => updateSelectedElement("height", parseInt(e.target.value) || 20)}
                        className="w-full px-2.5 py-1.5 bg-background border border-border-theme/30 rounded-lg text-xs font-mono text-foreground"
                      />
                    </div>
                  </div>
                </div>

                {/* Specific Element Customizations */}
                {selectedElement.type === "text" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground/60 uppercase">Text Content</label>
                      <input
                        type="text"
                        value={selectedElement.content}
                        onChange={(e) => updateSelectedElement("content", e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border-theme/30 rounded-xl text-xs font-bold text-foreground"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground/60 uppercase">Font Size ({selectedElement.fontSize}px)</label>
                        <input
                          type="range"
                          min={10}
                          max={80}
                          value={selectedElement.fontSize || 22}
                          onChange={(e) => updateSelectedElement("fontSize", parseInt(e.target.value) || 22)}
                          className="w-full accent-accent"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground/60 uppercase">Text Color</label>
                        <input
                          type="color"
                          value={selectedElement.color || "#ffffff"}
                          onChange={(e) => updateSelectedElement("color", e.target.value)}
                          className="w-full h-8 rounded-lg border-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedElement.type === "button" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground/60 uppercase">Button Text</label>
                      <input
                        type="text"
                        value={selectedElement.content}
                        onChange={(e) => updateSelectedElement("content", e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border-theme/30 rounded-xl text-xs font-bold text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground/60 uppercase">Target Link URL</label>
                      <input
                        type="text"
                        value={selectedElement.link || "#"}
                        onChange={(e) => updateSelectedElement("link", e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border-theme/30 rounded-xl text-xs font-bold text-foreground"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground/60 uppercase">Background</label>
                        <input
                          type="color"
                          value={selectedElement.bgColor || "#ffffff"}
                          onChange={(e) => updateSelectedElement("bgColor", e.target.value)}
                          className="w-full h-8 rounded-lg border-0 cursor-pointer"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-foreground/60 uppercase">Text Color</label>
                        <input
                          type="color"
                          value={selectedElement.textColor || "#000000"}
                          onChange={(e) => updateSelectedElement("textColor", e.target.value)}
                          className="w-full h-8 rounded-lg border-0 cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                )}

                {selectedElement.type === "timer" && (
                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground/60 uppercase">Timer Label</label>
                      <input
                        type="text"
                        value={selectedElement.label || "Offer ends in:"}
                        onChange={(e) => updateSelectedElement("label", e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border-theme/30 rounded-xl text-xs font-bold text-foreground"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-foreground/60 uppercase">Target End Date</label>
                      <input
                        type="datetime-local"
                        value={selectedElement.endDate || ""}
                        onChange={(e) => updateSelectedElement("endDate", e.target.value)}
                        className="w-full px-3 py-2 bg-background border border-border-theme/30 rounded-xl text-xs font-bold text-foreground"
                      />
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="p-8 text-center text-foreground/40 text-xs space-y-2">
                <i className="ri-cursor-line text-3xl" />
                <p>Click any element on the canvas to inspect and edit properties.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Right-Click Context Menu Portal */}
      {contextMenu.visible && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          targetId={contextMenu.targetId}
          elements={elements}
          moveZIndex={moveZIndex}
          updateSelectedElement={updateSelectedElement}
          handleDuplicateElement={duplicateElement}
          handleDeleteElementById={removeElementById}
          handleAddText={handleAddText}
          handleAddButton={handleAddButton}
          handleAddTimer={handleAddTimer}
          handleAlign={handleAlign}
        />
      )}

      {/* Live User Screen Modal Simulation */}
      <BannerPreviewModal
        show={showLiveModal}
        onClose={() => setShowLiveModal(false)}
        title={title}
        elements={elements}
        backgroundColor={backgroundColor}
        canvasWidth={canvasWidth}
        canvasHeight={canvasHeight}
        previewImageSrc={previewImageSrc}
        countdownText={countdownText}
      />
    </div>
  );
};

export default AdminBannerEditorPage;
