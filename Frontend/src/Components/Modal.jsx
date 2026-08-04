import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Universal Advanced Modal Component for Scapegoat
 * Supports:
 * - Variants: "default" | "danger" | "destructive" | "success" | "info"
 * - Sizes: "sm" (max-w-md) | "md" (max-w-lg) | "lg" (max-w-2xl) | "xl" (max-w-4xl) | "full" (max-w-6xl)
 * - Flexible icons, custom footers, ESC key close, overlay backdrop click, and Framer Motion spring physics.
 */
const Modal = ({
  isOpen,
  onClose,
  onSubmit,
  title,
  description,
  variant = "default", // "default" | "danger" | "destructive" | "success" | "info"
  size = "sm", // "sm" | "md" | "lg" | "xl" | "full"
  icon = null,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = null, // "accent" | "danger" | "success" | "secondary"
  confirmIcon = null,
  loading = false,
  isConfirmDisabled = false,
  showFooterActions = true,
  customFooter = null,
  showCloseButton = true,
  closeOnOverlayClick = true,
  closeOnEsc = true,
  children,
}) => {
  // Lock body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Handle ESC Key to Close
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen && closeOnEsc && !loading) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, closeOnEsc, loading, onClose]);

  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (onSubmit && !loading && !isConfirmDisabled) {
      onSubmit(e);
    }
  };

  // Determine size classes
  const sizeClasses = {
    sm: "max-w-md",
    md: "max-w-lg",
    lg: "max-w-2xl",
    xl: "max-w-4xl",
    full: "max-w-6xl",
  }[size] || "max-w-md";

  // Determine variant styling & default icons
  const isDanger = variant === "danger" || variant === "destructive";
  const isSuccess = variant === "success";
  const isInfo = variant === "info";

  const resolvedConfirmVariant = confirmVariant || (isDanger ? "danger" : isSuccess ? "success" : "accent");

  const confirmBtnClasses = {
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-red-500/25",
    success: "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-500/25",
    secondary: "bg-surface border border-border-theme text-foreground hover:bg-background",
    accent: "bg-accent text-accent-content hover:opacity-90 shadow-accent/25",
  }[resolvedConfirmVariant] || "bg-accent text-accent-content hover:opacity-90 shadow-accent/25";

  const defaultIcon = isDanger ? (
    <div className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center text-xl shrink-0">
      <i className="ri-error-warning-line" />
    </div>
  ) : isSuccess ? (
    <div className="w-10 h-10 rounded-full bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-xl shrink-0">
      <i className="ri-checkbox-circle-line" />
    </div>
  ) : isInfo ? (
    <div className="w-10 h-10 rounded-full bg-blue-500/10 text-blue-500 flex items-center justify-center text-xl shrink-0">
      <i className="ri-information-line" />
    </div>
  ) : icon ? (
    <div className="shrink-0">{icon}</div>
  ) : null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
          {/* Immersive Dark Glass Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/75 backdrop-blur-md cursor-default"
            onClick={() => {
              if (closeOnOverlayClick && !loading) onClose();
            }}
          />

          {/* Modal Card with Spring Physics */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 12 }}
            transition={{ type: "spring", damping: 25, stiffness: 350 }}
            className={`relative w-full ${sizeClasses} bg-surface/95 border border-border-theme/80 backdrop-blur-xl rounded-3xl p-6 sm:p-8 shadow-2xl z-10 space-y-5 my-auto`}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header Section */}
            {(title || defaultIcon) && (
              <div className="flex items-start justify-between pb-4 border-b border-border-theme gap-4">
                <div className="flex items-start gap-3.5">
                  {defaultIcon}
                  <div>
                    {title && (
                      <h3 className="text-lg sm:text-xl font-extrabold text-foreground tracking-tight leading-snug">
                        {title}
                      </h3>
                    )}
                    {description && (
                      <p className="text-xs text-foreground/60 mt-1 leading-relaxed">{description}</p>
                    )}
                  </div>
                </div>

                {showCloseButton && (
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="text-foreground/40 hover:text-foreground p-1.5 rounded-xl hover:bg-background transition cursor-pointer disabled:opacity-40"
                    aria-label="Close modal"
                  >
                    <i className="ri-close-line text-lg" />
                  </button>
                )}
              </div>
            )}

            {/* Modal Body / Children */}
            <form onSubmit={handleFormSubmit} className="space-y-5">
              {children && <div className="space-y-4">{children}</div>}

              {/* Action Footer */}
              {showFooterActions && (
                <div className="pt-4 border-t border-border-theme">
                  {customFooter ? (
                    customFooter
                  ) : (
                    <div className="flex items-center justify-end gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        disabled={loading}
                        className="px-4 py-2.5 rounded-xl border border-border-theme text-foreground/80 hover:bg-background transition font-extrabold text-xs cursor-pointer disabled:opacity-40"
                      >
                        {cancelText}
                      </button>
                      <button
                        type="submit"
                        disabled={loading || isConfirmDisabled}
                        className={`px-5 py-2.5 rounded-xl font-extrabold text-xs shadow-md transition disabled:opacity-40 cursor-pointer flex items-center gap-1.5 ${confirmBtnClasses}`}
                      >
                        {loading ? (
                          <>
                            <i className="ri-loader-4-line animate-spin text-sm" />
                            <span>Processing...</span>
                          </>
                        ) : (
                          <>
                            {confirmIcon && <i className={confirmIcon} />}
                            <span>{confirmText}</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              )}
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default Modal;
