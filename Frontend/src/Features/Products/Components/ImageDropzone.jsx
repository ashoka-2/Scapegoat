import React, { useRef, useState, useEffect } from "react";

const FILTER_PRESETS = [
  { id: "normal", name: "Normal", filter: "none" },
  { id: "vintage", name: "Vintage", filter: "sepia(0.45) contrast(1.1) brightness(0.95)" },
  { id: "clarendon", name: "Clarendon", filter: "contrast(1.25) saturate(1.35)" },
  { id: "warm", name: "Warm", filter: "sepia(0.3) saturate(1.25) contrast(1.05)" },
  { id: "vivid", name: "Vivid", filter: "saturate(1.65) contrast(1.15)" },
  { id: "cool", name: "Cool", filter: "hue-rotate(180deg) saturate(1.15)" },
  { id: "bw", name: "B&W", filter: "grayscale(1) contrast(1.25)" },
];

const FILTER_SLIDERS = [
  { key: "brightness", label: "Brightness", min: 50, max: 150, unit: "%" },
  { key: "contrast", label: "Contrast", min: 50, max: 150, unit: "%" },
  { key: "saturate", label: "Saturation", min: 0, max: 200, unit: "%" },
  { key: "sepia", label: "Sepia", min: 0, max: 100, unit: "%" },
  { key: "grayscale", label: "Grayscale", min: 0, max: 100, unit: "%" },
  { key: "hueRotate", label: "Hue Rotate", min: 0, max: 360, unit: "°" },
];

/**
 * ImageDropzone Component
 * Features:
 * 1. Drag & Drop local file uploads (Max 7 images)
 * 2. Paste Image URL (Instant preview + ImageKit server upload)
 * 3. Clipboard Paste (Ctrl+V handles BOTH copied image files & copied URL text!)
 * 4. Custom Image Filters & Preset Filters (Individual OR Apply to All)
 */
const ImageDropzone = ({ images = [], setImages, maxImages = 7 }) => {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState("file"); // 'file' | 'url'
  const [urlInput, setUrlInput] = useState("");
  const [activeImageId, setActiveImageId] = useState(null);

  // Custom Slider Filter State
  const [showCustomAdjuster, setShowCustomAdjuster] = useState(false);
  const [customFilter, setCustomFilter] = useState({
    brightness: 100,
    contrast: 100,
    saturate: 100,
    sepia: 0,
    grayscale: 0,
    hueRotate: 0,
  });

  const getCustomCssFilter = () => {
    return `brightness(${customFilter.brightness}%) contrast(${customFilter.contrast}%) saturate(${customFilter.saturate}%) sepia(${customFilter.sepia}%) grayscale(${customFilter.grayscale}%) hue-rotate(${customFilter.hueRotate}deg)`;
  };

  const handleSliderChange = (field, value) => {
    const updated = { ...customFilter, [field]: value };
    setCustomFilter(updated);
    const cssFilter = `brightness(${updated.brightness}%) contrast(${updated.contrast}%) saturate(${updated.saturate}%) sepia(${updated.sepia}%) grayscale(${updated.grayscale}%) hue-rotate(${updated.hueRotate}deg)`;

    if (activeImageId) {
      setImages((prev) =>
        prev.map((img) =>
          img.id === activeImageId
            ? { ...img, filter: "custom", customCss: cssFilter }
            : img
        )
      );
    } else {
      setImages((prev) =>
        prev.map((img) => ({ ...img, filter: "custom", customCss: cssFilter }))
      );
    }
  };

  const resetCustomSliders = () => {
    setCustomFilter({
      brightness: 100,
      contrast: 100,
      saturate: 100,
      sepia: 0,
      grayscale: 0,
      hueRotate: 0,
    });
  };

  // Helper to add File objects to state using functional updater
  const addFilesToState = (newFiles) => {
    const validFiles = Array.from(newFiles).filter((file) =>
      file.type.startsWith("image/")
    );

    if (validFiles.length === 0) return;

    setImages((prev) => {
      if (prev.length >= maxImages) {
        alert(`Maximum ${maxImages} images allowed per product.`);
        return prev;
      }
      const availableSlots = maxImages - prev.length;
      const filesToAdd = validFiles.slice(0, availableSlots).map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        isUrl: false,
        preview: URL.createObjectURL(file),
        filter: "normal",
      }));
      return [...prev, ...filesToAdd];
    });
  };

  // Helper to add Image URL string to state
  const addUrlToState = (urlStr) => {
    let cleanUrl = urlStr.trim();
    if (!cleanUrl) return;

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    setImages((prev) => {
      if (prev.length >= maxImages) {
        alert(`Maximum ${maxImages} images allowed per product.`);
        return prev;
      }
      const newImage = {
        id: Math.random().toString(36).substring(2, 9),
        isUrl: true,
        url: cleanUrl,
        preview: cleanUrl,
        filter: "normal",
      };
      return [...prev, newImage];
    });
  };

  // Global Clipboard Paste Listener (Ctrl + V / Cmd + V)
  useEffect(() => {
    const handlePaste = (e) => {
      if (e.clipboardData && e.clipboardData.items) {
        const items = e.clipboardData.items;
        const pastedFiles = [];

        for (let i = 0; i < items.length; i++) {
          if (items[i].type.indexOf("image") !== -1) {
            const blob = items[i].getAsFile();
            if (blob) {
              const filename = `pasted_image_${Date.now()}_${i}.png`;
              const file = new File([blob], filename, { type: blob.type || "image/png" });
              pastedFiles.push(file);
            }
          }
        }

        if (pastedFiles.length > 0) {
          e.preventDefault();
          addFilesToState(pastedFiles);
          return;
        }
      }

      if (e.clipboardData) {
        const pastedText = e.clipboardData.getData("text");
        if (
          pastedText &&
          (pastedText.startsWith("http://") ||
            pastedText.startsWith("https://") ||
            /\.(jpg|jpeg|png|webp|gif)/i.test(pastedText))
        ) {
          e.preventDefault();
          addUrlToState(pastedText);
        }
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => window.removeEventListener("paste", handlePaste);
  }, []);

  const handleAddFromUrl = (e) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    addUrlToState(urlInput);
    setUrlInput("");
  };

  const removeImage = (id) => {
    setImages((prev) => prev.filter((img) => img.id !== id));
    if (activeImageId === id) setActiveImageId(null);
  };

  const setPrimary = (index) => {
    if (index === 0) return;
    setImages((prev) => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      copy.unshift(selected);
      return copy;
    });
  };

  const applyFilterToImage = (filterId) => {
    if (!activeImageId) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === activeImageId ? { ...img, filter: filterId, customCss: null } : img
      )
    );
  };

  const applyFilterToAll = (filterId) => {
    setImages((prev) =>
      prev.map((img) => ({ ...img, filter: filterId, customCss: null }))
    );
  };

  return (
    <div className="space-y-6">
      {/* Upload Mode Selector */}
      <div className="flex items-center justify-between border-b border-border-theme pb-3">
        <div className="flex space-x-2">
          <button
            type="button"
            onClick={() => setUploadMode("file")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              uploadMode === "file"
                ? "bg-accent text-accent-content shadow-md shadow-accent/20"
                : "bg-surface text-foreground/70 border border-border-theme hover:text-foreground"
            }`}
          >
            📁 Drag & Drop / Files
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("url")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              uploadMode === "url"
                ? "bg-accent text-accent-content shadow-md shadow-accent/20"
                : "bg-surface text-foreground/70 border border-border-theme hover:text-foreground"
            }`}
          >
            🔗 Paste Image URL
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-foreground/60 font-semibold">
          <span className="bg-accent/10 text-accent px-2.5 py-1 rounded-lg border border-accent/20 flex items-center space-x-1">
            <span>📋 Press Ctrl+V to paste image or URL</span>
          </span>
          <span>
            {images.length} / {maxImages} Uploaded
          </span>
        </div>
      </div>

      {/* File Upload Mode */}
      {uploadMode === "file" && (
        <div
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (e.dataTransfer.files?.length > 0) addFilesToState(e.dataTransfer.files);
          }}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onClick={() => fileInputRef.current?.click()}
          className={`relative border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? "border-accent bg-accent/10 scale-[1.01]"
              : "border-border-theme hover:border-accent/60 bg-surface/40 hover:bg-surface"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={(e) => addFilesToState(e.target.files)}
            disabled={images.length >= maxImages}
          />
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
              📸
            </div>
            <p className="text-sm font-semibold text-foreground">
              Drag & Drop images here, <span className="text-accent underline font-bold">Browse</span>, or press{" "}
              <kbd className="bg-background border border-border-theme px-1.5 py-0.5 rounded text-xs font-mono">
                Ctrl+V
              </kbd>{" "}
              to paste copied image
            </p>
            <p className="text-xs text-foreground/60">
              Supports PNG, JPG, WEBP, GIF (Max {maxImages} images)
            </p>
          </div>
        </div>
      )}

      {/* URL Upload Mode */}
      {uploadMode === "url" && (
        <form onSubmit={handleAddFromUrl} className="flex gap-2">
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder="Paste image URL (e.g. https://images.unsplash.com/photo-123.jpg)"
            className="flex-1 bg-background border border-border-theme rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent"
          />
          <button
            type="submit"
            disabled={!urlInput.trim()}
            className="px-6 py-3 rounded-xl bg-accent text-accent-content font-bold text-sm hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            + Add Image URL
          </button>
        </form>
      )}

      {/* Image Filters Header & Presets */}
      {images.length > 0 && (
        <div className="bg-surface border border-border-theme rounded-2xl p-4 space-y-4">
          <div className="flex items-center justify-between border-b border-border-theme pb-2">
            <span className="text-xs font-bold text-accent uppercase tracking-wider flex items-center space-x-1">
              <span>✨ Image Filters & Adjustments</span>
            </span>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => setShowCustomAdjuster(!showCustomAdjuster)}
                className={`px-3 py-1 rounded-lg text-xs font-bold border transition ${
                  showCustomAdjuster
                    ? "bg-accent text-accent-content border-accent"
                    : "border-border-theme bg-background hover:border-accent text-foreground"
                }`}
              >
                🎛️ Custom Sliders
              </button>
            </div>
          </div>

          {/* Filter Preset Buttons */}
          <div className="flex flex-wrap gap-2">
            {FILTER_PRESETS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => {
                  if (activeImageId) {
                    applyFilterToImage(p.id);
                  } else {
                    applyFilterToAll(p.id);
                  }
                }}
                className="px-3 py-1.5 rounded-lg border border-border-theme bg-background hover:border-accent text-xs font-semibold text-foreground transition cursor-pointer"
              >
                {p.name}
              </button>
            ))}
            <button
              type="button"
              onClick={() => {
                applyFilterToAll("normal");
                resetCustomSliders();
              }}
              className="px-3 py-1.5 rounded-lg border border-red-500/30 bg-red-500/10 text-red-500 hover:bg-red-500/20 text-xs font-semibold transition cursor-pointer"
            >
              Reset Filters
            </button>
          </div>

          {/* Custom Sliders Adjuster */}
          {showCustomAdjuster && (
            <div className="pt-3 border-t border-border-theme grid grid-cols-2 sm:grid-cols-3 gap-4">
              {FILTER_SLIDERS.map(({ key, label, min, max, unit }) => (
                <div key={key}>
                  <label className="text-[11px] font-semibold text-foreground/80 flex justify-between">
                    <span>{label}</span>
                    <span>
                      {customFilter[key]}
                      {unit}
                    </span>
                  </label>
                  <input
                    type="range"
                    min={min}
                    max={max}
                    value={customFilter[key]}
                    onChange={(e) => handleSliderChange(key, Number(e.target.value))}
                    className="w-full accent-accent cursor-pointer"
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
          {images.map((img, idx) => {
            const currentPreset = FILTER_PRESETS.find((p) => p.id === img.filter);
            const appliedStyle = img.customCss
              ? img.customCss
              : currentPreset?.filter || "none";
            const isSelected = activeImageId === img.id;

            return (
              <div
                key={img.id || idx}
                onClick={() => setActiveImageId(img.id)}
                className={`relative group rounded-xl overflow-hidden border bg-surface aspect-square cursor-pointer transition-all duration-200 ${
                  isSelected
                    ? "ring-2 ring-accent border-accent scale-[1.03]"
                    : idx === 0
                    ? "border-accent/80"
                    : "border-border-theme hover:border-foreground/40"
                }`}
              >
                <img
                  src={img.preview || img.url || (typeof img === "string" ? img : "")}
                  alt={`Product preview ${idx + 1}`}
                  className="w-full h-full object-cover transition duration-300"
                  style={{ filter: appliedStyle }}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = "https://placehold.co/400x400/18181b/ffffff?text=Image";
                  }}
                />

                {idx === 0 ? (
                  <span className="absolute top-2 left-2 bg-accent text-accent-content font-bold text-[9px] uppercase px-1.5 py-0.5 rounded shadow">
                    ★ Main
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimary(idx);
                    }}
                    className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 bg-background/90 text-foreground text-[9px] px-1.5 py-0.5 rounded border border-border-theme transition"
                  >
                    Set Main
                  </button>
                )}

                {img.isUrl && (
                  <span className="absolute top-2 right-2 bg-blue-500 text-white font-bold text-[9px] px-1.5 py-0.5 rounded shadow">
                    URL
                  </span>
                )}

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeImage(img.id);
                  }}
                  className="absolute bottom-2 right-2 bg-red-500/80 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow"
                  title="Remove image"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
                  </svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;
