import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * MultiImageUploader — displays up to 5 image thumbnails with a ChatGPT-style
 * circular spinner overlay while embeddings are being computed.
 */
const MultiImageUploader = ({ pendingImages = [], onUpload, onRemove }) => {
  const fileInputRef = useRef(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // ── Open Camera Modal ───────────────────────────────────────────────────────
  const startCamera = async () => {
    try {
      setCameraOpen(true);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn("Camera access denied or unavailable:", err.message);
      setCameraOpen(false);
    }
  };

  // ── Capture Camera Snap ─────────────────────────────────────────────────────
  const capturePhoto = () => {
    if (!videoRef.current) return;
    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 720;
    canvas.height = videoRef.current.videoHeight || 720;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(videoRef.current, 0, 0);

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `camera_snap_${Date.now()}.jpg`, { type: "image/jpeg" });
        onUpload([file]);
      }
      stopCamera();
    }, "image/jpeg", 0.9);
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setCameraOpen(false);
  };

  return (
    <div className="space-y-2">
      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          if (e.target.files?.length) {
            onUpload(e.target.files);
            e.target.value = ""; // reset
          }
        }}
      />

      {/* ── Pending Images Thumbnail Tray ── */}
      {pendingImages.length > 0 && (
        <div className="flex items-center gap-2 overflow-x-auto py-1 scrollbar-none">
          {pendingImages.map((img) => (
            <motion.div
              key={img.id}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-14 h-14 rounded-2xl overflow-hidden border border-border-theme bg-surface shrink-0 group shadow-sm"
            >
              <img src={img.url} alt={img.name} className="w-full h-full object-cover" />

              {/* ── ChatGPT-Style Circular Spinner Loading Overlay ── */}
              {img.isEmbedding && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-accent rounded-full animate-spin" />
                </div>
              )}

              {/* Remove Thumbnail Button */}
              <button
                type="button"
                onClick={() => onRemove(img.id)}
                className="absolute top-1 right-1 w-4 h-4 rounded-full bg-black/70 hover:bg-red-500 text-white flex items-center justify-center text-[10px] transition cursor-pointer opacity-0 group-hover:opacity-100"
              >
                <i className="ri-close-line" />
              </button>
            </motion.div>
          ))}
        </div>
      )}

      {/* ── Camera Capture Modal ── */}
      <AnimatePresence>
        {cameraOpen && (
          <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-surface border border-border-theme rounded-3xl p-6 max-w-md w-full space-y-4 text-center shadow-2xl"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black uppercase tracking-wider text-foreground">
                  Live Outfit Camera
                </h3>
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-8 h-8 rounded-full bg-background border border-border-theme flex items-center justify-center text-foreground hover:bg-surface transition"
                >
                  <i className="ri-close-line" />
                </button>
              </div>

              <div className="relative aspect-square rounded-2xl overflow-hidden bg-black border border-border-theme">
                <video
                  ref={(el) => {
                    videoRef.current = el;
                    if (el && streamRef.current) {
                      el.srcObject = streamRef.current;
                      el.play().catch(() => {});
                    }
                  }}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="flex items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={stopCamera}
                  className="px-5 py-2.5 rounded-2xl bg-background border border-border-theme text-xs font-bold text-foreground hover:bg-surface transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="px-6 py-2.5 rounded-2xl bg-accent text-accent-content text-xs font-black uppercase tracking-wider flex items-center gap-2 shadow-lg shadow-accent/30 hover:scale-105 transition cursor-pointer"
                >
                  <i className="ri-camera-fill text-sm" />
                  <span>Snap Photo</span>
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiImageUploader;
