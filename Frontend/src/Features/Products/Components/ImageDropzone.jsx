import React, { useRef, useState } from "react";
import { useDispatch } from "react-redux";
import { addToast } from "../../../utils/toast.slice";

/**
 * ImageDropzone Component (Remixicon Edition)
 * Drag & Drop photo uploader with HTML5 tile drag reordering and Remixicons.
 */
const ImageDropzone = ({ images = [], setImages: setImagesProp, onImagesChange, maxImages = 7 }) => {
  const dispatch = useDispatch();
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadMode, setUploadMode] = useState("file"); // 'file' | 'url'
  const [urlInput, setUrlInput] = useState("");
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

  const updateImages = (updater) => {
    const callback = onImagesChange || setImagesProp;
    if (typeof callback === "function") {
      callback(updater);
    }
  };

  const addFilesToState = (newFiles) => {
    const validFiles = Array.from(newFiles).filter((file) => file.type.startsWith("image/"));
    if (validFiles.length === 0) return;

    updateImages((prev) => {
      if (prev.length >= maxImages) {
        dispatch(addToast({ message: `Maximum ${maxImages} images allowed per product.`, type: "warning" }));
        return prev;
      }

      const existingFileKeys = new Set(
        prev.filter((img) => img.file).map((img) => `${img.file.name}-${img.file.size}`)
      );

      const uniqueFiles = validFiles.filter(
        (file) => !existingFileKeys.has(`${file.name}-${file.size}`)
      );

      if (uniqueFiles.length === 0) return prev;

      const availableSlots = maxImages - prev.length;
      const filesToAdd = uniqueFiles.slice(0, availableSlots).map((file) => ({
        id: Math.random().toString(36).substring(2, 9),
        file,
        isUrl: false,
        preview: URL.createObjectURL(file),
      }));
      return [...prev, ...filesToAdd];
    });
  };

  const addUrlToState = (urlStr) => {
    let cleanUrl = urlStr.trim();
    if (!cleanUrl) return;

    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "https://" + cleanUrl;
    }

    updateImages((prev) => {
      if (prev.some((img) => (img.url || img.preview) === cleanUrl)) return prev;
      if (prev.length >= maxImages) {
        dispatch(addToast({ message: `Maximum ${maxImages} images allowed per product.`, type: "warning" }));
        return prev;
      }
      const newImage = {
        id: Math.random().toString(36).substring(2, 9),
        isUrl: true,
        url: cleanUrl,
        preview: cleanUrl,
      };
      // NOTE: append the object as ONE element — `...newImage` would spread a
      // plain object, which is not iterable and crashes with "n is not iterable".
      return [...prev, newImage];
    });
  };

  const handleAddFromUrl = (e) => {
    e?.preventDefault?.();
    if (!urlInput.trim()) return;
    addUrlToState(urlInput);
    setUrlInput("");
  };

  const removeImage = (id) => {
    updateImages((prev) => prev.filter((img) => img.id !== id));
  };

  const setPrimary = (index) => {
    if (index === 0) return;
    updateImages((prev) => {
      const copy = [...prev];
      const selected = copy.splice(index, 1)[0];
      copy.unshift(selected);
      return copy;
    });
  };

  // Drag & Drop Reordering Handlers
  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = "move";
    e.dataTransfer.setData("text/plain", index);
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    if (dragOverIndex !== index) {
      setDragOverIndex(index);
    }
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    const sourceIdxStr = e.dataTransfer.getData("text/plain");
    const sourceIndex = sourceIdxStr !== "" ? Number(sourceIdxStr) : draggedIndex;

    if (sourceIndex !== null && sourceIndex !== undefined && sourceIndex !== targetIndex) {
      updateImages((prev) => {
        const copy = [...prev];
        const [movedItem] = copy.splice(sourceIndex, 1);
        copy.splice(targetIndex, 0, movedItem);
        return copy;
      });
    }

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  return (
    <div className="space-y-4">
      {/* Upload Mode Selector & Ctrl+V Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between border-b border-border-theme pb-2.5 gap-2">
        <div className="flex space-x-1.5">
          <button
            type="button"
            onClick={() => setUploadMode("file")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              uploadMode === "file"
                ? "bg-accent text-accent-content shadow-md"
                : "bg-surface text-foreground/70 border border-border-theme hover:text-foreground"
            }`}
          >
            <i className="ri-folder-upload-line" />
            <span>Upload File</span>
          </button>
          <button
            type="button"
            onClick={() => setUploadMode("url")}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer flex items-center gap-1.5 ${
              uploadMode === "url"
                ? "bg-accent text-accent-content shadow-md"
                : "bg-surface text-foreground/70 border border-border-theme hover:text-foreground"
            }`}
          >
            <i className="ri-link" />
            <span>Paste URL</span>
          </button>
        </div>

        <div className="flex items-center space-x-2 text-[11px] text-foreground/60 font-semibold">
          <span className="bg-accent/10 text-accent px-2 py-0.5 rounded-lg border border-accent/20 flex items-center gap-1">
            <i className="ri-clipboard-line" />
            <span>Ctrl+V enabled</span>
          </span>
          <span className="font-mono font-bold text-foreground">
            {images.length} / {maxImages}
          </span>
        </div>
      </div>

      {/* File Upload Dropzone Mode */}
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
          className={`relative border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-300 ${
            isDragging
              ? "border-accent bg-accent/10 scale-[1.01]"
              : "border-border-theme hover:border-accent/60 bg-surface/40 hover:bg-surface"
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/*"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.length > 0) addFilesToState(e.target.files);
            }}
          />
          <div className="space-y-1.5">
            <div className="w-10 h-10 rounded-full bg-accent/10 text-accent flex items-center justify-center mx-auto text-lg">
              <i className="ri-image-add-line" />
            </div>
            <p className="text-xs font-bold text-foreground">
              Drop image here, or <span className="text-accent hover:underline">browse</span>
            </p>
            <p className="text-[11px] text-foreground/50">PNG, JPG, WEBP up to 10MB</p>
          </div>
        </div>
      )}

      {/* URL Input Mode */}
      {uploadMode === "url" && (
        <div className="flex gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onPaste={(e) => {
              const pastedText = e.clipboardData?.getData("text");
              if (
                pastedText &&
                (pastedText.startsWith("http://") ||
                  pastedText.startsWith("https://") ||
                  /\.(jpg|jpeg|png|webp|gif)/i.test(pastedText))
              ) {
                e.preventDefault();
                addUrlToState(pastedText);
                setUrlInput("");
              }
            }}
            placeholder="Paste image URL..."
            className="flex-1 bg-background border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground placeholder:text-foreground/30 focus:outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={handleAddFromUrl}
            disabled={!urlInput.trim()}
            className="px-4 py-2 rounded-xl bg-accent text-accent-content font-bold text-xs hover:opacity-90 transition disabled:opacity-50 cursor-pointer"
          >
            + Add
          </button>
        </div>
      )}

      {/* Images Preview Grid with HTML5 Drag & Drop Reordering */}
      {images.length > 0 && (
        <div className="space-y-2">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5">
            {images.map((img, idx) => (
              <div
                key={img.id || idx}
                draggable
                onDragStart={(e) => handleDragStart(e, idx)}
                onDragOver={(e) => handleDragOver(e, idx)}
                onDrop={(e) => handleDrop(e, idx)}
                onDragEnd={handleDragEnd}
                className={`relative group rounded-xl overflow-hidden border-2 transition-all bg-background shadow-sm cursor-grab active:cursor-grabbing select-none ${
                  idx === 0
                    ? "border-accent ring-2 ring-accent/30"
                    : dragOverIndex === idx
                    ? "border-accent scale-105 shadow-lg"
                    : "border-border-theme hover:border-accent/50"
                } ${draggedIndex === idx ? "opacity-40 border-dashed" : "opacity-100"}`}
              >
                <img
                  src={img.preview || img.url}
                  alt={`Product ${idx + 1}`}
                  className="w-full h-24 object-cover pointer-events-none transition-transform duration-300 group-hover:scale-105"
                />

                {/* Main Photo Badge */}
                {idx === 0 ? (
                  <span className="absolute top-1 left-1 bg-accent text-accent-content text-[9px] font-black uppercase px-2 py-0.5 rounded-full shadow pointer-events-none flex items-center gap-0.5">
                    <i className="ri-star-fill text-[9px]" />
                    <span>Main</span>
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPrimary(idx);
                    }}
                    className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 bg-background/90 hover:bg-accent hover:text-accent-content text-foreground text-[9px] font-bold px-2 py-0.5 rounded-full transition cursor-pointer"
                  >
                    Set Main
                  </button>
                )}

                {/* Delete button */}
                <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-1 flex items-center justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeImage(img.id);
                    }}
                    className="bg-red-500/90 hover:bg-red-600 text-white rounded px-1.5 py-0.5 text-[10px] font-bold cursor-pointer transition flex items-center gap-1"
                    title="Delete Photo"
                  >
                    <i className="ri-delete-bin-line" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageDropzone;
