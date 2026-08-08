import React, { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  getAllBannersApi,
  createBannerApi,
  updateBannerApi,
  deleteBannerApi,
  restoreBannerApi,
  toggleBannerStatusApi,
} from "../Services/banner.api.js";
import AdminBannersSkeleton from "../Components/Skeletons/AdminBannersSkeleton.jsx";

// ─── Constants ──────────────────────────────────────────────────────────────

const PLACEMENT_OPTIONS = [
  { value: "hero", label: "Hero Carousel", icon: "ri-slideshow-3-line" },
  { value: "promotional", label: "Popup Banner", icon: "ri-notification-badge-line" },
  { value: "inline", label: "Inline Banner", icon: "ri-layout-row-line" },
  { value: "sidebar", label: "Sidebar Ad", icon: "ri-layout-right-2-line" },
];

const PAGE_OPTIONS = ["home", "shop", "category", "cart", "about", "contact", "checkout"];

const DEVICE_OPTIONS = [
  { value: "desktop", label: "Desktop", icon: "ri-computer-line" },
  { value: "mobile", label: "Mobile", icon: "ri-smartphone-line" },
  { value: "tablet", label: "Tablet", icon: "ri-tablet-line" },
];

const STATUS_TABS = [
  { value: "all", label: "All" },
  { value: "draft", label: "Drafts" },
  { value: "active", label: "Active" },
  { value: "scheduled", label: "Scheduled" },
  { value: "inactive", label: "Inactive" },
  { value: "expired", label: "Expired" },
];

const EMPTY_FORM = {
  title: "",
  subtitle: "",
  link: "#",
  buttonText: "Shop Now",
  placement: "hero",
  position: 0,
  targetPages: ["home"],
  deviceTargets: [],
  altText: "Promotional banner",
  backgroundColor: "",
  dismissible: true,
  popupDelay: 3,
  autoCloseSeconds: 0,
  showTimesPerDay: 1,
  isActive: true,
  startDate: "",
  endDate: "",
  buttons: [],
};

// ─── Helpers ────────────────────────────────────────────────────────────────

const getStatusBadge = (banner) => {
  const now = new Date();
  if (banner.isDeleted) return { text: "Trashed", color: "bg-red-500/15 text-red-400 border-red-500/30" };
  if (banner.isDraft) return { text: "Draft", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
  if (!banner.isActive) return { text: "Inactive", color: "bg-gray-500/15 text-gray-400 border-gray-500/30" };
  if (banner.startDate && new Date(banner.startDate) > now) return { text: "Scheduled", color: "bg-amber-500/15 text-amber-400 border-amber-500/30" };
  if (banner.endDate && new Date(banner.endDate) < now) return { text: "Expired", color: "bg-orange-500/15 text-orange-400 border-orange-500/30" };
  return { text: "Active", color: "bg-emerald-500/15 text-emerald-400 border-emerald-500/30" };
};

const formatDate = (d) => {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
};

// ─── Drag-Drop Button Editor Component ──────────────────────────────────────

const ButtonEditor = ({ buttons, setButtons, previewImageUrl }) => {
  const containerRef = useRef(null);
  const [draggingIdx, setDraggingIdx] = useState(null);

  const addButton = () => {
    setButtons([
      ...buttons,
      { text: "Shop Now", link: "#", positionX: 50, positionY: 80, bgColor: "#ffffff", textColor: "#000000", borderRadius: 8, fontSize: 14, paddingX: 24, paddingY: 12 },
    ]);
  };

  const updateButton = (idx, field, value) => {
    const updated = [...buttons];
    updated[idx] = { ...updated[idx], [field]: value };
    setButtons(updated);
  };

  const removeButton = (idx) => {
    setButtons(buttons.filter((_, i) => i !== idx));
  };

  const handleDrag = (e, idx) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
    const y = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
    updateButton(idx, "positionX", Math.round(x * 10) / 10);
    updateButton(idx, "positionY", Math.round(y * 10) / 10);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Overlay Buttons</label>
        <button type="button" onClick={addButton} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-accent/10 text-accent text-xs font-bold hover:bg-accent/20 transition cursor-pointer">
          <i className="ri-add-line" /> Add Button
        </button>
      </div>

      {/* Preview Area with draggable buttons */}
      {previewImageUrl && (
        <div
          ref={containerRef}
          className="relative w-full aspect-[16/7] rounded-xl overflow-hidden border border-border-theme/40 bg-surface-variant/20"
        >
          <img src={previewImageUrl} alt="Banner Preview" className="w-full h-full object-cover" />
          {buttons.map((btn, idx) => (
            <div
              key={idx}
              className="absolute cursor-move select-none"
              style={{
                left: `${btn.positionX}%`,
                top: `${btn.positionY}%`,
                transform: "translate(-50%, -50%)",
                zIndex: draggingIdx === idx ? 50 : 10,
              }}
              draggable
              onDragStart={() => setDraggingIdx(idx)}
              onDrag={(e) => { if (e.clientX > 0) handleDrag(e, idx); }}
              onDragEnd={(e) => { handleDrag(e, idx); setDraggingIdx(null); }}
            >
              <div
                className="px-3 py-1.5 rounded shadow-lg whitespace-nowrap text-xs font-bold border-2 border-dashed border-white/50"
                style={{
                  backgroundColor: btn.bgColor,
                  color: btn.textColor,
                  borderRadius: `${btn.borderRadius}px`,
                  fontSize: `${btn.fontSize}px`,
                  padding: `${btn.paddingY}px ${btn.paddingX}px`,
                }}
              >
                {btn.text || "Button"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Button settings cards */}
      {buttons.map((btn, idx) => (
        <div key={idx} className="p-4 rounded-xl bg-surface-variant/20 border border-border-theme/30 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground/50">Button {idx + 1}</span>
            <button type="button" onClick={() => removeButton(idx)} className="text-red-400 hover:text-red-500 text-sm cursor-pointer">
              <i className="ri-delete-bin-line" />
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <input type="text" value={btn.text} onChange={(e) => updateButton(idx, "text", e.target.value)} placeholder="Button text" className="col-span-1 px-3 py-2 rounded-lg bg-background border border-border-theme/40 text-sm text-foreground" />
            <input type="text" value={btn.link} onChange={(e) => updateButton(idx, "link", e.target.value)} placeholder="Link URL" className="col-span-1 px-3 py-2 rounded-lg bg-background border border-border-theme/40 text-sm text-foreground" />
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-foreground/50">BG</label>
              <input type="color" value={btn.bgColor} onChange={(e) => updateButton(idx, "bgColor", e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
            </div>
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold text-foreground/50">Text</label>
              <input type="color" value={btn.textColor} onChange={(e) => updateButton(idx, "textColor", e.target.value)} className="w-8 h-8 rounded border-0 cursor-pointer" />
            </div>
            <input type="number" value={btn.fontSize} onChange={(e) => updateButton(idx, "fontSize", parseInt(e.target.value) || 14)} placeholder="Font size" className="px-3 py-2 rounded-lg bg-background border border-border-theme/40 text-sm text-foreground" min={8} max={48} />
            <input type="number" value={btn.borderRadius} onChange={(e) => updateButton(idx, "borderRadius", parseInt(e.target.value) || 0)} placeholder="Radius" className="px-3 py-2 rounded-lg bg-background border border-border-theme/40 text-sm text-foreground" min={0} max={100} />
          </div>
          <div className="text-[10px] text-foreground/40">Position: X={btn.positionX}% Y={btn.positionY}% — Drag on preview to reposition</div>
        </div>
      ))}
    </div>
  );
};

// ─── Image Upload Dropzone ──────────────────────────────────────────────────

const ImageDropzone = ({ label, currentUrl, onFileSelect, file }) => {
  const inputRef = useRef(null);
  const previewUrl = file ? URL.createObjectURL(file) : currentUrl;

  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">{label}</label>
      <div
        onClick={() => inputRef.current?.click()}
        className="relative w-full aspect-[16/7] rounded-xl border-2 border-dashed border-border-theme/40 hover:border-accent/50 bg-surface-variant/10 flex items-center justify-center cursor-pointer overflow-hidden transition group"
      >
        {previewUrl ? (
          <>
            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
              <span className="text-white text-xs font-bold">Click to change</span>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center gap-2 text-foreground/30">
            <i className="ri-upload-cloud-2-line text-3xl" />
            <span className="text-xs font-bold">Drop or click to upload</span>
          </div>
        )}
        <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files[0]) onFileSelect(e.target.files[0]); }} />
      </div>
    </div>
  );
};

// ─── Banner Form Modal ──────────────────────────────────────────────────────

const BannerFormModal = ({ isOpen, onClose, onSubmit, initialData, isEditing, loading }) => {
  const [form, setForm] = useState(EMPTY_FORM);
  const [desktopFile, setDesktopFile] = useState(null);
  const [mobileFile, setMobileFile] = useState(null);
  const [tabletFile, setTabletFile] = useState(null);
  const [showDeviceImages, setShowDeviceImages] = useState(false);

  useEffect(() => {
    if (initialData) {
      setForm({
        ...EMPTY_FORM,
        ...initialData,
        startDate: initialData.startDate ? new Date(initialData.startDate).toISOString().slice(0, 16) : "",
        endDate: initialData.endDate ? new Date(initialData.endDate).toISOString().slice(0, 16) : "",
        buttons: initialData.buttons || [],
        targetPages: initialData.targetPages || ["home"],
        deviceTargets: initialData.deviceTargets || [],
      });
      setShowDeviceImages(!!(initialData.mobileImage || initialData.tabletImage));
    } else {
      setForm(EMPTY_FORM);
      setShowDeviceImages(false);
    }
    setDesktopFile(null);
    setMobileFile(null);
    setTabletFile(null);
  }, [initialData, isOpen]);

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const togglePage = (page) => {
    setForm((prev) => ({
      ...prev,
      targetPages: prev.targetPages.includes(page)
        ? prev.targetPages.filter((p) => p !== page)
        : [...prev.targetPages, page],
    }));
  };

  const toggleDevice = (device) => {
    setForm((prev) => ({
      ...prev,
      deviceTargets: prev.deviceTargets.includes(device)
        ? prev.deviceTargets.filter((d) => d !== device)
        : [...prev.deviceTargets, device],
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append("title", form.title);
    formData.append("subtitle", form.subtitle);
    formData.append("link", form.link);
    formData.append("buttonText", form.buttonText);
    formData.append("placement", form.placement);
    formData.append("position", form.position);
    formData.append("targetPages", JSON.stringify(form.targetPages));
    formData.append("deviceTargets", JSON.stringify(form.deviceTargets));
    formData.append("altText", form.altText);
    formData.append("backgroundColor", form.backgroundColor);
    formData.append("dismissible", form.dismissible);
    formData.append("popupDelay", form.popupDelay);
    formData.append("autoCloseSeconds", form.autoCloseSeconds);
    formData.append("showTimesPerDay", form.showTimesPerDay);
    formData.append("isActive", form.isActive);
    formData.append("startDate", form.startDate || "");
    formData.append("endDate", form.endDate || "");
    formData.append("buttons", JSON.stringify(form.buttons));

    if (desktopFile) formData.append("image", desktopFile);
    if (mobileFile) formData.append("mobileImage", mobileFile);
    if (tabletFile) formData.append("tabletImage", tabletFile);

    onSubmit(formData);
  };

  const previewUrl = desktopFile ? URL.createObjectURL(desktopFile) : (initialData?.image || null);

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-start justify-center bg-black/60 backdrop-blur-sm overflow-y-auto py-8 px-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 30, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="w-full max-w-3xl bg-background border border-border-theme/40 rounded-3xl shadow-2xl overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="px-8 py-6 border-b border-border-theme/20 flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-foreground">{isEditing ? "Edit Banner" : "Create New Banner"}</h2>
              <p className="text-xs text-foreground/50 mt-1">Upload banner images designed in Photoshop, Canva, or any tool</p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-xl bg-surface-variant/30 flex items-center justify-center hover:bg-red-500/10 hover:text-red-400 transition cursor-pointer">
              <i className="ri-close-line text-xl" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Desktop Image */}
            <ImageDropzone label="Desktop Banner Image *" currentUrl={initialData?.image} file={desktopFile} onFileSelect={setDesktopFile} />

            {/* Device-specific images toggle */}
            <button type="button" onClick={() => setShowDeviceImages(!showDeviceImages)} className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer">
              <i className={showDeviceImages ? "ri-arrow-up-s-line" : "ri-arrow-down-s-line"} />
              {showDeviceImages ? "Hide" : "Add"} Mobile / Tablet Images
            </button>

            {showDeviceImages && (
              <div className="grid grid-cols-2 gap-4">
                <ImageDropzone label="Mobile Image" currentUrl={initialData?.mobileImage} file={mobileFile} onFileSelect={setMobileFile} />
                <ImageDropzone label="Tablet Image" currentUrl={initialData?.tabletImage} file={tabletFile} onFileSelect={setTabletFile} />
              </div>
            )}

            {/* Title & Subtitle */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Title *</label>
                <input type="text" required value={form.title} onChange={(e) => update("title", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-variant/20 border border-border-theme/30 text-sm text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent/50 outline-none transition" placeholder="Summer Sale 2026" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Subtitle</label>
                <input type="text" value={form.subtitle} onChange={(e) => update("subtitle", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-variant/20 border border-border-theme/30 text-sm text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent/50 outline-none transition" placeholder="Up to 50% off" />
              </div>
            </div>

            {/* Link & Button Text */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Link URL</label>
                <input type="text" value={form.link} onChange={(e) => update("link", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-variant/20 border border-border-theme/30 text-sm text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent/50 outline-none transition" placeholder="/shop?sale=true" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Alt Text</label>
                <input type="text" value={form.altText} onChange={(e) => update("altText", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-variant/20 border border-border-theme/30 text-sm text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent/50 outline-none transition" placeholder="Banner description" />
              </div>
            </div>

            {/* Placement & Position */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Placement</label>
                <div className="grid grid-cols-2 gap-2">
                  {PLACEMENT_OPTIONS.map((opt) => (
                    <button key={opt.value} type="button" onClick={() => update("placement", opt.value)}
                      className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer ${form.placement === opt.value ? "bg-accent/15 border-accent/40 text-accent" : "bg-surface-variant/10 border-border-theme/30 text-foreground/60 hover:border-accent/30"}`}
                    >
                      <i className={opt.icon} /> {opt.label}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Sort Order</label>
                  <input type="number" value={form.position} onChange={(e) => update("position", parseInt(e.target.value) || 0)} className="w-full px-4 py-2.5 rounded-xl bg-surface-variant/20 border border-border-theme/30 text-sm text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent/50 outline-none transition" min={0} />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Background Color</label>
                  <div className="flex items-center gap-2">
                    <input type="color" value={form.backgroundColor || "#000000"} onChange={(e) => update("backgroundColor", e.target.value)} className="w-10 h-10 rounded-lg border-0 cursor-pointer" />
                    <input type="text" value={form.backgroundColor || ""} onChange={(e) => update("backgroundColor", e.target.value)} placeholder="#000000" className="flex-1 px-3 py-2 rounded-lg bg-background border border-border-theme/30 text-sm text-foreground" />
                  </div>
                </div>
              </div>
            </div>

            {/* Target Pages */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Show on Pages</label>
              <div className="flex flex-wrap gap-2">
                {PAGE_OPTIONS.map((page) => (
                  <button key={page} type="button" onClick={() => togglePage(page)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold border transition cursor-pointer capitalize ${form.targetPages.includes(page) ? "bg-accent/15 border-accent/40 text-accent" : "bg-surface-variant/10 border-border-theme/30 text-foreground/50 hover:border-accent/30"}`}
                  >
                    {page}
                  </button>
                ))}
              </div>
            </div>

            {/* Device Targeting */}
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Device Targeting <span className="text-foreground/30">(empty = all devices)</span></label>
              <div className="flex flex-wrap gap-2">
                {DEVICE_OPTIONS.map((dev) => (
                  <button key={dev.value} type="button" onClick={() => toggleDevice(dev.value)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border transition cursor-pointer ${form.deviceTargets.includes(dev.value) ? "bg-accent/15 border-accent/40 text-accent" : "bg-surface-variant/10 border-border-theme/30 text-foreground/50 hover:border-accent/30"}`}
                  >
                    <i className={dev.icon} /> {dev.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Popup Settings (only for promotional placement) */}
            {form.placement === "promotional" && (
              <div className="p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-4">
                <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2"><i className="ri-notification-badge-line" /> Popup Settings</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/60">Delay before showing (seconds)</label>
                    <input type="number" value={form.popupDelay} onChange={(e) => update("popupDelay", parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-background border border-border-theme/30 text-sm text-foreground" min={0} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/60">Auto-close after (seconds, 0 = no)</label>
                    <input type="number" value={form.autoCloseSeconds} onChange={(e) => update("autoCloseSeconds", parseInt(e.target.value) || 0)} className="w-full px-3 py-2 rounded-lg bg-background border border-border-theme/30 text-sm text-foreground" min={0} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-foreground/60">Show times per day</label>
                    <input type="number" value={form.showTimesPerDay} onChange={(e) => update("showTimesPerDay", parseInt(e.target.value) || 1)} className="w-full px-3 py-2 rounded-lg bg-background border border-border-theme/30 text-sm text-foreground" min={1} />
                  </div>
                  <div className="flex items-center gap-3 pt-4">
                    <label className="text-xs font-bold text-foreground/60">Dismissible (X button)</label>
                    <button type="button" onClick={() => update("dismissible", !form.dismissible)} className={`w-10 h-6 rounded-full transition cursor-pointer ${form.dismissible ? "bg-accent" : "bg-gray-500/40"}`}>
                      <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${form.dismissible ? "translate-x-5" : "translate-x-1"}`} />
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Start Date</label>
                <input type="datetime-local" value={form.startDate} onChange={(e) => update("startDate", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-variant/20 border border-border-theme/30 text-sm text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent/50 outline-none transition" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">End Date</label>
                <input type="datetime-local" value={form.endDate} onChange={(e) => update("endDate", e.target.value)} className="w-full px-4 py-2.5 rounded-xl bg-surface-variant/20 border border-border-theme/30 text-sm text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent/50 outline-none transition" />
              </div>
            </div>

            {/* Active Toggle */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Active</label>
              <button type="button" onClick={() => update("isActive", !form.isActive)} className={`w-12 h-7 rounded-full transition cursor-pointer ${form.isActive ? "bg-emerald-500" : "bg-gray-500/40"}`}>
                <div className={`w-5 h-5 bg-white rounded-full shadow transition-transform ${form.isActive ? "translate-x-6" : "translate-x-1"}`} />
              </button>
            </div>

            {/* Overlay Buttons Editor */}
            <ButtonEditor buttons={form.buttons} setButtons={(b) => update("buttons", b)} previewImageUrl={previewUrl} />
          </form>

          {/* Footer */}
          <div className="px-8 py-5 border-t border-border-theme/20 flex items-center justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-2.5 rounded-xl border border-border-theme/30 text-sm font-bold text-foreground/60 hover:bg-surface-variant/20 transition cursor-pointer">
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={loading} className="px-8 py-2.5 rounded-xl bg-accent text-accent-content text-sm font-black shadow-lg hover:shadow-xl disabled:opacity-50 transition cursor-pointer flex items-center gap-2">
              {loading && <i className="ri-loader-4-line animate-spin" />}
              {isEditing ? "Update Banner" : "Create Banner"}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

// ─── Main Admin Banners Page ────────────────────────────────────────────────

const AdminBannersPage = () => {
  const [banners, setBanners] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [showTrash, setShowTrash] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [search, setSearch] = useState("");
  const [placementFilter, setPlacementFilter] = useState("");

  const fetchBanners = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const params = { page, limit: 20, trash: showTrash };
      if (activeTab !== "all") params.status = activeTab;
      if (placementFilter) params.placement = placementFilter;
      if (search) params.search = search;
      const data = await getAllBannersApi(params);
      setBanners(data.banners || []);
      setPagination(data.pagination || {});
    } catch (err) {
      console.error("Failed to fetch banners:", err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, showTrash, placementFilter, search]);

  useEffect(() => {
    fetchBanners();

    const handleRealtimeUpdate = (event) => {
      const { type } = event.detail || {};
      if (type?.startsWith("BANNER_")) {
        fetchBanners();
      }
    };
    window.addEventListener("banner_update", handleRealtimeUpdate);
    return () => window.removeEventListener("banner_update", handleRealtimeUpdate);
  }, [fetchBanners]);

  const handleCreate = async (formData) => {
    setSaving(true);
    try {
      await createBannerApi(formData);
      setModalOpen(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (err) {
      console.error("Failed to create banner:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (formData) => {
    if (!editingBanner) return;
    setSaving(true);
    try {
      await updateBannerApi(editingBanner._id, formData);
      setModalOpen(false);
      setEditingBanner(null);
      fetchBanners();
    } catch (err) {
      console.error("Failed to update banner:", err);
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = async (id) => {
    try {
      await toggleBannerStatusApi(id);
      fetchBanners();
    } catch (err) {
      console.error("Failed to toggle banner:", err);
    }
  };

  const handleTrash = async (id) => {
    try {
      await deleteBannerApi(id, false);
      fetchBanners();
    } catch (err) {
      console.error("Failed to trash banner:", err);
    }
  };

  const handlePermanentDelete = async (id) => {
    if (!window.confirm("This will permanently delete this banner and remove its images from CDN. Continue?")) return;
    try {
      await deleteBannerApi(id, true);
      fetchBanners();
    } catch (err) {
      console.error("Failed to delete banner:", err);
    }
  };

  const handleRestore = async (id) => {
    try {
      await restoreBannerApi(id);
      fetchBanners();
    } catch (err) {
      console.error("Failed to restore banner:", err);
    }
  };

  const navigate = useNavigate();

  const openCreate = () => {
    navigate("/admin/banners/create");
  };

  const openEdit = (banner) => {
    navigate(`/admin/banners/edit/${banner._id}`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-foreground">Banner Management</h1>
          <p className="text-sm text-foreground/50 mt-1">Create, schedule, and manage site banners across all pages</p>
        </div>
        <button onClick={openCreate} className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-accent text-accent-content text-sm font-black shadow-lg hover:shadow-xl transition cursor-pointer">
          <i className="ri-add-circle-line text-lg" /> New Banner
        </button>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-wrap">
        {/* Status Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-2xl bg-surface-variant/20 border border-border-theme/20">
          {STATUS_TABS.map((tab) => (
            <button key={tab.value} onClick={() => { setActiveTab(tab.value); setShowTrash(false); }}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${activeTab === tab.value && !showTrash ? "bg-accent text-accent-content shadow" : "text-foreground/50 hover:text-foreground"}`}
            >
              {tab.label}
            </button>
          ))}
          <button onClick={() => { setShowTrash(true); setActiveTab("all"); }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1 ${showTrash ? "bg-red-500/15 text-red-400 shadow" : "text-foreground/50 hover:text-foreground"}`}
          >
            <i className="ri-delete-bin-7-line" /> Trash
          </button>
        </div>

        {/* Placement Filter */}
        <select value={placementFilter} onChange={(e) => setPlacementFilter(e.target.value)} className="px-4 py-2.5 rounded-xl bg-surface-variant/20 border border-border-theme/20 text-xs font-bold text-foreground cursor-pointer">
          <option value="">All Placements</option>
          {PLACEMENT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>

        {/* Search */}
        <div className="relative flex-1 min-w-[200px]">
          <i className="ri-search-line absolute left-3 top-1/2 -translate-y-1/2 text-foreground/30" />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search banners..." className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-surface-variant/20 border border-border-theme/20 text-sm text-foreground focus:ring-2 focus:ring-accent/30 focus:border-accent/50 outline-none transition" />
        </div>
      </div>

      {/* Banner Cards Grid */}
      {loading ? (
        <AdminBannersSkeleton />
      ) : banners.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <i className="ri-image-2-line text-5xl text-foreground/15 mb-4" />
          <p className="text-foreground/40 font-bold text-lg">{showTrash ? "Trash is empty" : "No banners found"}</p>
          {!showTrash && (
            <button onClick={openCreate} className="mt-4 px-6 py-2 rounded-xl bg-accent/10 text-accent text-sm font-bold hover:bg-accent/20 transition cursor-pointer">
              Create your first banner
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {banners.map((banner) => {
            const status = getStatusBadge(banner);
            return (
              <motion.div
                key={banner._id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="group rounded-2xl bg-surface/60 border border-border-theme/30 overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Image Preview */}
                <div className="relative w-full aspect-[16/8] bg-surface-variant/20 overflow-hidden">
                  <img src={banner.image} alt={banner.altText || banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-3 left-3 flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${status.color}`}>{status.text}</span>
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-black/40 text-white backdrop-blur-sm capitalize">{banner.placement}</span>
                  </div>
                  {banner.buttons?.length > 0 && (
                    <span className="absolute top-3 right-3 px-2 py-1 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 backdrop-blur-sm">
                      {banner.buttons.length} btn{banner.buttons.length > 1 ? "s" : ""}
                    </span>
                  )}
                </div>

                {/* Info */}
                <div className="p-4 space-y-3">
                  <div>
                    <h3 className="font-bold text-sm text-foreground truncate">{banner.title}</h3>
                    {banner.subtitle && <p className="text-xs text-foreground/40 truncate mt-0.5">{banner.subtitle}</p>}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {banner.targetPages?.map((page) => (
                      <span key={page} className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-surface-variant/30 text-foreground/50 capitalize">{page}</span>
                    ))}
                  </div>

                  {(banner.startDate || banner.endDate) && (
                    <div className="flex items-center gap-1 text-[10px] text-foreground/40">
                      <i className="ri-calendar-line" />
                      {formatDate(banner.startDate)} → {formatDate(banner.endDate)}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-border-theme/15">
                    {showTrash ? (
                      <div className="flex items-center gap-2">
                        <button onClick={() => handleRestore(banner._id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition cursor-pointer">
                          <i className="ri-arrow-go-back-line" /> Restore
                        </button>
                        <button onClick={() => handlePermanentDelete(banner._id)} className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition cursor-pointer">
                          <i className="ri-delete-bin-line" /> Delete Forever
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEdit(banner)} className="w-8 h-8 rounded-lg bg-surface-variant/30 flex items-center justify-center text-foreground/50 hover:text-accent transition cursor-pointer" title="Edit">
                            <i className="ri-pencil-line text-sm" />
                          </button>
                          <button onClick={() => handleTrash(banner._id)} className="w-8 h-8 rounded-lg bg-surface-variant/30 flex items-center justify-center text-foreground/50 hover:text-red-400 transition cursor-pointer" title="Move to Trash">
                            <i className="ri-delete-bin-7-line text-sm" />
                          </button>
                        </div>
                        <button onClick={() => handleToggle(banner._id)}
                          className={`w-10 h-6 rounded-full transition cursor-pointer ${banner.isActive ? "bg-emerald-500" : "bg-gray-500/40"}`}
                        >
                          <div className={`w-4 h-4 bg-white rounded-full shadow transition-transform ${banner.isActive ? "translate-x-5" : "translate-x-1"}`} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button key={p} onClick={() => fetchBanners(p)}
              className={`w-9 h-9 rounded-xl text-xs font-bold transition cursor-pointer ${p === pagination.page ? "bg-accent text-accent-content shadow" : "bg-surface-variant/20 text-foreground/50 hover:bg-surface-variant/40"}`}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Form Modal */}
      <BannerFormModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setEditingBanner(null); }}
        onSubmit={editingBanner ? handleUpdate : handleCreate}
        initialData={editingBanner}
        isEditing={!!editingBanner}
        loading={saving}
      />
    </div>
  );
};

export default AdminBannersPage;
