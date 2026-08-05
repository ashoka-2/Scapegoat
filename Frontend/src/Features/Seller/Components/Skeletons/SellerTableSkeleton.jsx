import React from "react";

/**
 * SellerTableSkeleton Component
 * Table row skeletons for Seller dashboard modules
 */
const SellerTableSkeleton = ({ rows = 5, standalone = true }) => {
  const content = (
    <tbody className="divide-y divide-border-theme/40 animate-pulse">
      {Array.from({ length: rows }).map((_, idx) => (
        <tr key={idx}>
          <td className="p-4 text-center">
            <div className="w-4 h-4 rounded bg-foreground/10 mx-auto" />
          </td>
          <td className="p-4">
            <div className="w-12 h-12 rounded-xl bg-foreground/10" />
          </td>
          <td className="p-4 space-y-2">
            <div className="w-48 h-3.5 bg-foreground/15 rounded-md" />
            <div className="w-24 h-2.5 bg-accent/20 rounded-md" />
          </td>
          <td className="p-4">
            <div className="w-20 h-3 bg-foreground/10 rounded-md font-mono" />
          </td>
          <td className="p-4">
            <div className="w-16 h-3 bg-emerald-500/20 rounded-md" />
          </td>
          <td className="p-4">
            <div className="w-16 h-3.5 bg-accent/30 rounded-md" />
          </td>
          <td className="p-4">
            <div className="w-20 h-3 bg-foreground/10 rounded-md" />
          </td>
          <td className="p-4">
            <div className="w-16 h-3 bg-foreground/10 rounded-md" />
          </td>
          <td className="p-4 text-right">
            <div className="w-16 h-3 bg-foreground/10 rounded-md ml-auto" />
          </td>
        </tr>
      ))}
    </tbody>
  );

  if (!standalone) return content;

  return (
    <div className="bg-surface border border-border-theme rounded-3xl overflow-hidden shadow-lg p-4 w-full">
      <table className="w-full text-left border-collapse text-xs">
        {content}
      </table>
    </div>
  );
};

export default SellerTableSkeleton;
