import React from "react";

const TABS = [
  { id: "specs", label: "Specifications & Details" },
  { id: "shipping", label: "Shipping & Returns" },
];

/**
 * TabsSection — Specifications & Details / Shipping & Returns tabs.
 */
export default function TabsSection({ product, activeTab, setActiveTab }) {
  return (
    <div className="bg-background border border-border-theme rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm">
      <div className="flex items-center space-x-4 border-b border-border-theme pb-4">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`pb-2 text-xs font-extrabold transition cursor-pointer border-b-2 ${
              activeTab === tab.id
                ? "border-accent text-accent"
                : "border-transparent text-foreground/50 hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "specs" && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
          <div className="bg-surface p-4 rounded-xl space-y-1">
            <span className="text-foreground/50 font-medium">Product Type</span>
            <p className="font-bold text-foreground capitalize">{product.productType || "Physical"}</p>
          </div>
          {product.weight && (
            <div className="bg-surface p-4 rounded-xl space-y-1">
              <span className="text-foreground/50 font-medium">Weight</span>
              <p className="font-bold text-foreground">
                {product.weight} {product.weightUnit || "g"}
              </p>
            </div>
          )}
          {product.unit && (
            <div className="bg-surface p-4 rounded-xl space-y-1">
              <span className="text-foreground/50 font-medium">Unit of Measure</span>
              <p className="font-bold text-foreground">{product.unit.name}</p>
            </div>
          )}
          {product.sku && (
            <div className="bg-surface p-4 rounded-xl space-y-1">
              <span className="text-foreground/50 font-medium">Root SKU</span>
              <p className="font-bold text-foreground">{product.sku}</p>
            </div>
          )}
        </div>
      )}

      {activeTab === "shipping" && (
        <div className="space-y-3 text-xs text-foreground/80">
          <p className="font-bold text-accent">🚚 Delivery & Return Guidelines</p>
          <ul className="list-disc pl-5 space-y-1 text-foreground/70">
            <li>Standard delivery within 3-5 business days across India.</li>
            <li>7 days hassle-free replacement or return policy.</li>
            <li>Cash on Delivery available on select postal codes.</li>
          </ul>
        </div>
      )}
    </div>
  );
}
