import React from "react";

const tabs = [
  { id: "general", label: "General Info", icon: "📋" },
  { id: "pricing", label: "Pricing & Stock", icon: "💰" },
  { id: "discount", label: "Discounts", icon: "🏷️" },
  { id: "variants", label: "Attributes & Variants", icon: "🔀" },
  { id: "shipping", label: "Shipping & Options", icon: "📦" },
  { id: "media", label: "Media & Filters", icon: "🖼️" },
];

/**
 * ProductFormTabs Component
 * Theme-aware Tab Navigation Bar for product creation/editing
 */
const ProductFormTabs = ({ activeTab, setActiveTab }) => {
  return (
    <div className="flex border-b border-border-theme space-x-2 overflow-x-auto pb-2 scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-2 px-5 py-3 rounded-xl font-semibold text-sm transition-all duration-300 whitespace-nowrap cursor-pointer ${
              isActive
                ? "bg-accent text-accent-content shadow-lg shadow-accent/20 font-bold scale-[1.02]"
                : "text-foreground/70 hover:text-foreground hover:bg-surface/80 border border-transparent hover:border-border-theme"
            }`}
          >
            <span className="text-base">{tab.icon}</span>
            <span>{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
};

export default ProductFormTabs;
