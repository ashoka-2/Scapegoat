import React, { useRef } from "react";

/**
 * ImagePicker — styled trigger for selecting an image.
 * - `capture` = "environment" opens the device CAMERA directly (mobile)
 * - `capture` = undefined opens the GALLERY / file picker
 * The picked File is handed to `onFile` and the input resets (no persistence).
 */
export default function ImagePicker({ onFile, capture, label, iconClass, primary = false, textColor, borderClass }) {
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
        className={`flex w-full items-center justify-center gap-2.5 px-4 py-3.5 rounded-2xl text-sm font-bold transition-all duration-200 cursor-pointer select-none ${
          primary
            ? `bg-gradient-to-r from-accent via-accent to-accent/80 shadow-lg shadow-accent/25 hover:shadow-accent/40 hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] ${
                textColor || "text-black"
              }`
            : `bg-surface border-2 ${borderClass || "border-border-theme"} ${
                textColor || "text-black"
              } hover:border-accent/60 hover:bg-accent/5 active:scale-[0.99]`
        }`}
      >
        <i className={`${iconClass || "ri-upload-2-line"} text-base`} />
        {label}
      </button>
    </>
  );
}
