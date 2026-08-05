import React, { useState } from "react";

/**
 * Reusable Form Input Field
 */
export const InputField = ({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  readOnly = false,
  disabled = false,
  error,
  icon,
  className = "",
  autoComplete,
  ...rest
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const inputType = type === "password" ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-foreground/60">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="relative flex items-center">
        {icon && (
          <div className="absolute left-3.5 text-foreground/40 text-sm pointer-events-none">
            <i className={icon} />
          </div>
        )}
        <input
          name={name}
          type={inputType}
          value={value ?? ""}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          readOnly={readOnly}
          disabled={disabled}
          autoComplete={autoComplete}
          className={`w-full bg-background border ${
            error ? "border-red-500" : "border-border-theme"
          } rounded-xl ${icon ? "pl-10" : "px-4"} ${
            type === "password" ? "pr-10" : "pr-4"
          } py-3 text-xs font-medium text-foreground outline-none focus:border-accent transition-all ${
            readOnly || disabled ? "bg-background/50 opacity-70 cursor-not-allowed" : ""
          }`}
          {...rest}
        />
        {type === "password" && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 text-foreground/40 hover:text-foreground text-sm cursor-pointer transition"
          >
            <i className={showPassword ? "ri-eye-off-line" : "ri-eye-line"} />
          </button>
        )}
      </div>
      {error && <p className="text-[10px] text-red-500 font-bold tracking-wide mt-1">{error}</p>}
    </div>
  );
};

/**
 * Reusable Form Text Area Field
 */
export const TextAreaField = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  rows = 4,
  error,
  className = "",
  ...rest
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-foreground/60">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <textarea
        name={name}
        rows={rows}
        value={value ?? ""}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        className={`w-full bg-background border ${
          error ? "border-red-500" : "border-border-theme"
        } rounded-xl px-4 py-3 text-xs font-medium text-foreground outline-none focus:border-accent transition-all resize-none`}
        {...rest}
      />
      {error && <p className="text-[10px] text-red-500 font-bold tracking-wide mt-1">{error}</p>}
    </div>
  );
};

/**
 * Reusable Select Dropdown Field
 */
export const SelectField = ({
  label,
  name,
  value,
  onChange,
  options = [],
  required = false,
  error,
  className = "",
  placeholder = "Select an option",
  ...rest
}) => {
  return (
    <div className={`space-y-1.5 ${className}`}>
      {label && (
        <label className="block text-[11px] font-extrabold uppercase tracking-wider text-foreground/60">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <select
        name={name}
        value={value ?? ""}
        onChange={onChange}
        required={required}
        className={`w-full bg-background border ${
          error ? "border-red-500" : "border-border-theme"
        } rounded-xl px-4 py-3 text-xs font-medium text-foreground outline-none focus:border-accent transition-all cursor-pointer`}
        {...rest}
      >
        <option value="" disabled>
          {placeholder}
        </option>
        {options.map((opt, idx) => {
          const val = typeof opt === "object" ? opt.value : opt;
          const lbl = typeof opt === "object" ? opt.label : opt;
          return (
            <option key={idx} value={val} className="bg-surface text-foreground">
              {lbl}
            </option>
          );
        })}
      </select>
      {error && <p className="text-[10px] text-red-500 font-bold tracking-wide mt-1">{error}</p>}
    </div>
  );
};

/**
 * Reusable Option / Radio Card
 */
export const RadioCard = ({ id, selectedId, onSelect, label, icon, subtitle, disabled = false, badge = null }) => {
  const isSelected = selectedId === id;
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => !disabled && onSelect(id)}
      className={`p-4 rounded-2xl border text-left flex flex-col justify-between space-y-2 transition-all relative ${
        disabled
          ? "border-border-theme/40 bg-background/30 text-foreground/40 opacity-60 cursor-not-allowed"
          : isSelected
          ? "border-accent bg-accent/10 text-foreground shadow-sm cursor-pointer"
          : "border-border-theme bg-background hover:border-accent/40 text-foreground/70 cursor-pointer"
      }`}
    >
      <div className="flex items-center justify-between w-full">
        {icon && <i className={`${icon} text-xl ${disabled ? "text-foreground/30" : "text-accent"}`} />}
        {badge && (
          <span className="text-[9px] font-black uppercase tracking-wider bg-amber-500/10 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded-full">
            {badge}
          </span>
        )}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-wider text-foreground">{label}</p>
        {subtitle && <p className="text-[10px] text-foreground/60 mt-0.5">{subtitle}</p>}
      </div>
    </button>
  );
};
