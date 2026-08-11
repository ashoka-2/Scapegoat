import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ImagePicker from "./ImagePicker";
import CameraCapture from "./CameraCapture";
import ImagePreview from "./ImagePreview";
import { aiVisualSearchProductsApi } from "../../Features/Products/Services/product.api";

const VISUAL_SESSION_KEY = "scapegoatVisualResults";

/**
 * VisualSearchModal — camera/gallery image search entry point.
 *
 * PRIVACY-FIRST flow: the query image lives ONLY in browser memory (object URL)
 * and is sent once as multipart to the backend, which embeds it in-memory and
 * discards it. It is NEVER saved to the database or ImageKit. Only the matched
 * PRODUCT ids/results are kept (sessionStorage) to render the shop results.
 */
export default function VisualSearchModal({ isOpen, onClose }) {
  const navigate = useNavigate();
  const [imageFile, setImageFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [mode, setMode] = useState("pick"); // "pick" | "camera"
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState("");
  const [noMatch, setNoMatch] = useState(false);
  const urlRef = useRef("");

  // Device capability detection
  const capabilities = useMemo(() => {
    if (typeof navigator === "undefined") return { hasCamera: false, isMobile: false };
    const hasCamera = !!(navigator.mediaDevices && navigator.mediaDevices.getUserMedia);
    const isMobile =
      /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ||
      (navigator.maxTouchPoints > 1 && window.matchMedia && window.matchMedia("(max-width: 767px)").matches);
    return { hasCamera, isMobile };
  }, []);

  // Reset state whenever the modal opens/closes
  useEffect(() => {
    if (isOpen) {
      setError("");
      setNoMatch(false);
      setSearching(false);
      setMode("pick");
    } else {
      clearImage();
    }
  }, [isOpen]);

  // Revoke object URLs on unmount
  useEffect(() => {
    return () => {
      if (urlRef.current) URL.revokeObjectURL(urlRef.current);
    };
  }, []);

  const clearImage = () => {
    if (urlRef.current) {
      URL.revokeObjectURL(urlRef.current);
      urlRef.current = "";
    }
    setImageFile(null);
    setPreviewUrl("");
  };

  const handleFile = (file) => {
    setError("");
    setNoMatch(false);
    clearImage();
    const url = URL.createObjectURL(file);
    urlRef.current = url;
    setImageFile(file);
    setPreviewUrl(url);
  };

  const handleSearch = async () => {
    if (!imageFile) return;
    setSearching(true);
    setError("");
    setNoMatch(false);
    try {
      const formData = new FormData();
      formData.append("images", imageFile, "query.jpg");
      const res = await aiVisualSearchProductsApi(formData);

      if (res && res.success && Array.isArray(res.data) && res.data.length > 0) {
        // Store ONLY the matched products (transient) and show them in the shop.
        // The unique ?t= timestamp guarantees the shop re-reads the results even
        // when a previous visual search is still active (same ?visual=1 URL).
        sessionStorage.setItem(VISUAL_SESSION_KEY, JSON.stringify(res.data));
        onClose();
        navigate(`/shop?visual=1&t=${Date.now()}`);
      } else {
        setNoMatch(true);
      }
    } catch (err) {
      const msg = (err && err.response && err.response.data && err.response.data.message) || "";
      if (msg) setError(msg);
      else setNoMatch(true);
    } finally {
      setSearching(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[1200] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-surface sm:border border-border-theme sm:rounded-3xl rounded-t-3xl shadow-2xl max-h-[92vh] sm:max-h-[85vh] overflow-y-auto p-5 sm:p-6 space-y-4 sm:space-y-5"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 shrink-0 rounded-2xl bg-gradient-to-br from-accent to-accent/60 flex items-center justify-center text-accent-foreground shadow-md shadow-accent/25">
              <i className="ri-camera-lens-line text-lg" />
            </div>
            <div>
              <h3 className="text-base font-black text-foreground leading-tight">Search by Image</h3>
              <p className="text-[11px] text-foreground/50 mt-0.5">
                Snap or pick a photo — we find the closest products
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-9 h-9 shrink-0 flex items-center justify-center rounded-full bg-background/60 text-foreground/60 hover:text-foreground hover:bg-background transition cursor-pointer"
            aria-label="Close"
          >
            <i className="ri-close-line text-base" />
          </button>
        </div>

        {!imageFile ? (
          <div className="space-y-3">
            {mode === "camera" && capabilities.hasCamera ? (
              <CameraCapture
                onCapture={(blob) => {
                  handleFile(blob);
                }}
                onCancel={() => setMode("pick")}
              />
            ) : (
              <div className="space-y-2.5">
                {/* Mobile: dedicated Camera + Gallery buttons */}
                {capabilities.isMobile ? (
                  <>
                    <ImagePicker
                      onFile={handleFile}
                      capture="environment"
                      label="Open Camera"
                      iconClass="ri-camera-line text-sm"
                      primary
                    />
                    <ImagePicker
                      onFile={handleFile}
                      label="Choose from Gallery"
                      iconClass="ri-image-line text-sm"
                    />
                  </>
                ) : (
                  <>
                    {/* Desktop / laptop: upload always; live camera only if present */}
                    <ImagePicker
                      onFile={handleFile}
                      label="Upload an Image"
                      iconClass="ri-upload-2-line text-sm"
                      primary
                    />
                    {capabilities.hasCamera && (
                      <ImagePicker
                        onFile={handleFile}
                        capture="environment"
                        label="Use Camera"
                        iconClass="ri-camera-line text-sm"
                      />
                    )}
                  </>
                )}
                <p className="flex items-center justify-center gap-1.5 text-[10px] text-foreground/45 pt-1">
                  <i className="ri-shield-check-line text-[11px] text-emerald-500" />
                  Your photo is used only to find matches — it is never saved or uploaded
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <ImagePreview src={previewUrl} onRemove={clearImage} />
            {error && (
              <p className="text-[11px] font-medium text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}
            {noMatch && (
              <p className="text-[11px] font-medium text-amber-400 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2">
                No closely matching products found for this photo — try a different angle or image.
              </p>
            )}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSearch}
                disabled={searching}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-3.5 rounded-2xl text-sm font-black bg-gradient-to-r from-accent via-accent to-accent/80 text-accent-foreground shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:translate-y-0"
              >
                {searching ? (
                  <>
                    <span className="w-4 h-4 border-2 border-accent-foreground border-t-transparent rounded-full animate-spin" />
                    Finding matches…
                  </>
                ) : (
                  <>
                    <i className="ri-search-eye-line text-base" />
                    Search with this Image
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={clearImage}
                className="px-5 py-3.5 rounded-2xl text-sm font-bold bg-surface border-2 border-border-theme text-foreground/80 hover:border-red-500/50 hover:text-red-400 transition cursor-pointer"
              >
                Change
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
