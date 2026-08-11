import React from "react";

/**
 * ImagePreview — shows the selected/captured image with a remove button.
 * The preview uses an object URL that the parent revokes (no persistence).
 */
export default function ImagePreview({ src, onRemove }) {
  return (
    <div className="relative rounded-xl overflow-hidden border border-border-theme group">
      <img src={src} alt="Search preview" className="w-full h-52 object-cover" />
      <button
        type="button"
        onClick={onRemove}
        title="Remove image"
        className="absolute top-2 right-2 w-7 h-7 flex items-center justify-center rounded-full bg-black/60 text-white hover:bg-red-600 transition cursor-pointer"
      >
        <i className="ri-close-line text-sm" />
      </button>
      <span className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/60 text-[9px] font-bold uppercase tracking-widest text-white">
        Query image — never saved
      </span>
    </div>
  );
}
