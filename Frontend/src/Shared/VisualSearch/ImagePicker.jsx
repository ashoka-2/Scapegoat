import React, { useRef } from "react";

/**
 * ImagePicker — styled trigger for selecting an image.
 * - `capture` = "environment" opens the device CAMERA directly (mobile)
 * - `capture` = undefined opens the GALLERY / file picker
 * The picked File is handed to `onFile` and the input resets (no persistence).
 */
export default function ImagePicker({ onFile, capture, label, iconClass, primary = false }) {
  const inputRef = useRef(null);

  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        capture={capture}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files && e.target.files[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current && inputRef.current.click()}
        className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer ${
          primary
            ? "bg-accent text-accent-foreground hover:opacity-90 shadow-md"
            : "bg-surface border border-border-theme text-foreground hover:border-accent/50"
        }`}
      >
        <i className={iconClass || "ri-upload-2-line text-sm"} />
        {label}
      </button>
    </>
  );
}
