import React, { useState } from "react";

/**
 * Reusable Accordion Component
 * Used for collapsible UI sections (e.g. Profile details, Product FAQs, Fabric & Shipping details)
 */
const Accordion = ({ label, children, defaultOpen = false, icon }) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-border-theme/60 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full flex items-center justify-between py-4 text-left group cursor-pointer"
      >
        <div className="flex items-center space-x-3">
          {icon && <span className="text-accent text-sm">{icon}</span>}
          <span className="text-xs font-bold uppercase tracking-wider text-foreground/80 group-hover:text-accent transition-colors">
            {label}
          </span>
        </div>
        <span
          className={`text-foreground/40 font-bold transition-transform duration-300 ${
            open ? "rotate-180" : ""
          }`}
        >
          ▼
        </span>
      </button>

      <div
        className={`overflow-hidden transition-all duration-300 ${
          open ? "max-h-[600px] opacity-100 pb-5" : "max-h-0 opacity-0"
        }`}
      >
        <div className="text-xs text-foreground/70 leading-relaxed space-y-2">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
