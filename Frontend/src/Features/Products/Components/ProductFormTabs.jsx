import React from "react";

const tabs = [
  { id: "general", label: "General", icon: "ri-file-text-line" },
  { id: "inventory", label: "Inventory", icon: "ri-inbox-archive-line" },
  { id: "shipping", label: "Shipping", icon: "ri-truck-line" },
  { id: "attributes", label: "Attributes", icon: "ri-layout-grid-line" },
  { id: "variations", label: "Variations", icon: "ri-[#126] ri-git-branch-line" },
  { id: "discounts", label: "Discounts", icon: "ri-percent-line" },
  { id: "seo", label: "SEO", icon: "ri-search-line" },
  { id: "preview", label: "Live Preview", icon: "ri-eye-line" },
  { id: "history", label: "History", icon: "ri-history-line" },
];

/**
 * ProductFormTabs Component
 * WooCommerce-style Vertical Left Navigation Bar with Remixicons
 */
const ProductFormTabs = ({ activeTab, setActiveTab, variantsCount = 0 }) => {
  return (
    <div className="flex flex-row lg:flex-col bg-background/80 border-b lg:border-b-0 lg:border-r border-border-theme w-full lg:w-52 shrink-0 p-2 space-x-1 lg:space-x-0 lg:space-y-1 overflow-x-auto scrollbar-hide">
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center space-x-3 px-4 py-3 rounded-xl font-bold text-xs transition-all duration-200 whitespace-nowrap cursor-pointer text-left ${
              isActive
                ? "bg-accent text-accent-content shadow-md scale-[1.01]"
                : "text-foreground/70 hover:text-foreground hover:bg-surface/90"
            }`}
          >
            <i className={`${tab.icon} text-base`} />
            <span className="flex-1">{tab.label}</span>
            {tab.id === "variations" && variantsCount > 0 && (
              <span className="text-[10px] font-extrabold font-mono bg-black/20 px-1.5 py-0.5 rounded-full">
                {variantsCount}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};

export default ProductFormTabs;
