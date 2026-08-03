import React from "react";

/**
 * ProductHistoryTimeline Component
 * Audit log and inventory timeline tracking changes made by sellers/admins
 */
const ProductHistoryTimeline = ({ historyLogs = [], inventoryTimeline = [] }) => {
  return (
    <div className="space-y-8">
      {/* Product Audit History Section */}
      <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-theme pb-3">
          <h2 className="text-lg font-bold text-foreground">
            📜 Product Audit History
          </h2>
          <span className="text-xs text-foreground/50 font-mono">
            {historyLogs.length} Events Logged
          </span>
        </div>

        {historyLogs.length === 0 ? (
          <div className="p-8 text-center bg-background border border-dashed border-border-theme rounded-2xl">
            <p className="text-xs text-foreground/50">
              No product changes logged yet. Any updates to price, title, attributes, or status will appear here.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {historyLogs.map((log, idx) => (
              <div
                key={idx}
                className="flex items-start justify-between bg-background border border-border-theme p-4 rounded-xl text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center space-x-2">
                    <span className="font-bold text-accent uppercase">{log.action}</span>
                    <span className="text-foreground/40">•</span>
                    <span className="text-foreground/70 font-semibold">by {log.user || "Seller"}</span>
                  </div>
                  <p className="text-foreground/90 font-medium">{log.details || log.description}</p>
                  {log.oldValue && log.newValue && (
                    <div className="flex items-center space-x-2 text-[11px] font-mono pt-1">
                      <span className="text-red-400 line-through">Old: {log.oldValue}</span>
                      <span>→</span>
                      <span className="text-emerald-500 font-bold">New: {log.newValue}</span>
                    </div>
                  )}
                </div>
                <span className="text-[10px] text-foreground/50 font-mono whitespace-nowrap ml-4">
                  {log.timestamp ? new Date(log.timestamp).toLocaleString() : "Just now"}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Inventory Timeline Section */}
      <div className="bg-surface border border-border-theme rounded-2xl p-6 sm:p-8 space-y-6 shadow-sm">
        <div className="flex items-center justify-between border-b border-border-theme pb-3">
          <h2 className="text-lg font-bold text-foreground">
            📦 Inventory Transaction Timeline
          </h2>
          <span className="text-xs text-foreground/50 font-mono">
            {inventoryTimeline.length} Movements
          </span>
        </div>

        {inventoryTimeline.length === 0 ? (
          <div className="p-8 text-center bg-background border border-dashed border-border-theme rounded-2xl">
            <p className="text-xs text-foreground/50">
              No inventory movements logged yet. Restocks, sales, and manual quantity changes are tracked separately here.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {inventoryTimeline.map((item, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between bg-background border border-border-theme px-4 py-3 rounded-xl text-xs"
              >
                <div className="flex items-center space-x-3">
                  <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      item.type === "Restock"
                        ? "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20"
                        : item.type === "Sales"
                        ? "bg-blue-500/10 text-blue-500 border border-blue-500/20"
                        : "bg-accent/10 text-accent border border-accent/20"
                    }`}
                  >
                    {item.type === "Restock" ? "➕" : item.type === "Sales" ? "🛒" : "✏️"}
                  </span>
                  <div>
                    <p className="font-bold text-foreground">{item.reason || item.type}</p>
                    <p className="text-[11px] text-foreground/60">
                      Variant: <strong className="text-foreground">{item.variantName || "Main Product"}</strong>
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <span
                    className={`font-mono font-bold text-sm ${
                      item.change > 0 ? "text-emerald-500" : "text-red-400"
                    }`}
                  >
                    {item.change > 0 ? `+${item.change}` : item.change} units
                  </span>
                  <p className="text-[10px] text-foreground/50 font-mono">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : "Just now"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductHistoryTimeline;
