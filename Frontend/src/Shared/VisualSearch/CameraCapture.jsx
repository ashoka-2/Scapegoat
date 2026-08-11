import React, { useEffect, useRef, useState } from "react";

/**
 * CameraCapture — live camera preview (getUserMedia) with a capture button.
 * Stream tracks are ALWAYS stopped on unmount/cancel; the captured frame is a
 * JPEG Blob handed to `onCapture` (in-memory only — never stored).
 */
export default function CameraCapture({ onCapture, onCancel }) {
  const videoRef = useRef(null);
  const streamRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          setError("Camera not supported in this browser");
          return;
        }
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "environment", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          setReady(true);
        }
      } catch (err) {
        setError(err && err.message ? err.message : "Camera unavailable or permission denied");
      }
    })();

    return () => {
      cancelled = true;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const capture = () => {
    const video = videoRef.current;
    if (!video || !ready || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext("2d").drawImage(video, 0, 0);
    canvas.toBlob((blob) => {
      if (blob) onCapture(blob);
    }, "image/jpeg", 0.9);
  };

  return (
    <div className="space-y-3">
      <div className="relative rounded-xl overflow-hidden bg-black border border-border-theme">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className={`w-full h-52 object-cover ${ready ? "" : "opacity-0"}`}
        />
        {!ready && !error && (
          <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold uppercase tracking-widest text-white/60">
            Starting camera…
          </div>
        )}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-[11px] font-medium text-red-300">
            {error}
          </div>
        )}
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={capture}
          disabled={!ready}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold bg-accent text-accent-foreground hover:opacity-90 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <i className="ri-camera-line text-sm" />
          Capture Photo
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2.5 rounded-xl text-xs font-bold bg-surface border border-border-theme text-foreground hover:border-red-500/50 hover:text-red-400 transition cursor-pointer"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
