import React from "react";

/**
 * ImagePreview — shows the selected/captured image with a remove button.
 * The preview uses an object URL that the parent revokes (no persistence).
 */
export default function ImagePreview({ src, onRemove }) {
  return (
    <div className="relative rounded-2xl overflow-hidden border border-border-theme shadow-inner group">
      <img src={src} alt="Search preview" className="w-full h-60 sm:h-56 object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent pointer-events-none" />
      <button
        type="button"
        onClick={onRemove}
        title="Remove image"
        className="absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 text-white backdrop-blur-sm hover:bg-red-600 hover:scale-105 transition cursor-pointer"
      >
        <i className="ri-close-line text-sm" />
      </button>
      <span className="absolute bottom-2.5 left-2.5 flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/55 backdrop-blur-sm text-[9px] font-bold uppercase tracking-widest text-white">
        <i className="ri-shield-check-line text-[10px] text-emerald-400" />
        Query image — never saved
      </span>
    </div>
  );
}
