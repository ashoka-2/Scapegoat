import React from "react";

/**
 * FormField Component
 * Theme-aware form field wrapper for inputs, textareas, and selects.
 */
const FormField = ({
  label,
  required = false,
  error,
  helperText,
  children,
  className = "",
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-sm font-semibold text-foreground/90">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      {children}
      {helperText && !error && (
        <p className="text-xs text-foreground/60 mt-1">{helperText}</p>
      )}
      {error && <p className="text-xs text-red-500 font-medium mt-1">{error}</p>}
    </div>
  );
};

export default FormField;
