import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";

/**
 * Reusable Modern Glassmorphism Modal Component
 * Can be used anywhere across the application for form creation, confirmations, or alerts.
 */
const Modal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  confirmText = "Submit",
  cancelText = "Cancel",
  loading = false,
  isConfirmDisabled = false,
  showFooterActions = true,
  children,
}) => {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
      const timer = setTimeout(() => setIsAnimating(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Handle ESC Key to Close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen && !isAnimating) return null;

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) {
      onSubmit(e);
    }
  };

  return createPortal(
    <div
      className={`fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 transition-all duration-300 ${
        isOpen ? "opacity-100" : "opacity-0"
      }`}
    >
      {/* Immersive Dark Glass Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-md transition-opacity duration-300 cursor-default"
        onClick={onClose}
      />

      {/* Modal Card */}
      <div
        className={`relative w-full max-w-md bg-surface/95 border border-border-theme/80 backdrop-blur-xl rounded-2xl p-6 sm:p-8 shadow-2xl transition-all duration-300 transform ${
          isOpen
            ? "scale-100 translate-y-0 opacity-100"
            : "scale-95 translate-y-4 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between pb-3 border-b border-border-theme">
          <div>
            <h3 className="text-xl font-bold text-foreground tracking-tight">
              {title}
            </h3>
            {description && (
              <p className="text-xs text-foreground/60 mt-1">{description}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-foreground/40 hover:text-foreground font-bold text-lg p-1 transition cursor-pointer"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Modal Form / Children Content */}
        <form onSubmit={handleFormSubmit} className="space-y-4 pt-4">
          <div className="space-y-4">{children}</div>

          {/* Action Footer */}
          {showFooterActions && (
            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-border-theme">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-4 py-2.5 rounded-xl border border-border-theme text-foreground/80 hover:bg-background transition font-semibold text-xs cursor-pointer"
              >
                {cancelText}
              </button>
              <button
                type="submit"
                disabled={loading || isConfirmDisabled}
                className="px-5 py-2.5 rounded-xl bg-accent text-accent-content font-bold text-xs shadow-md hover:opacity-90 transition disabled:opacity-40 cursor-pointer flex items-center space-x-2"
              >
                {loading ? <span>Processing...</span> : <span>{confirmText}</span>}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>,
    document.body
  );
};

export default Modal;
