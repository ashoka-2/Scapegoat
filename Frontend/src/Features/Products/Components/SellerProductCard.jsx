import React from "react";

const SellerProductCard = ({ product, onEdit, onDelete }) => {
  const primaryImg = product.images?.[0]?.url || "https://placehold.co/400x400?text=No+Image";
  const price = product.sellingPrice?.amount || product.maxPrice?.amount || 0;

  return (
    <div className="bg-background border border-border-theme/80 hover:border-accent/50 rounded-2xl p-4 transition-all duration-300 flex flex-col justify-between shadow-sm hover:shadow-md group">
      <div>
        {/* Product Image */}
        <div className="relative h-44 w-full rounded-xl overflow-hidden bg-surface border border-border-theme/50 mb-3">
          <img
            src={primaryImg}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-2 left-2">
            <span
              className={`text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full backdrop-blur-md border ${
                product.status === "published"
                  ? "bg-emerald-500/20 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/20 text-amber-400 border-amber-500/30"
              }`}
            >
              {product.status}
            </span>
          </div>
        </div>

        {/* Info */}
        <h4 className="font-bold text-sm text-foreground truncate">{product.title}</h4>
        <div className="flex items-center justify-between mt-1">
          <span className="text-xs font-bold text-accent">₹{price}</span>
          <span className="text-[10px] text-foreground/50 font-medium">Stock: {product.stock ?? 0}</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-4 mt-3 border-t border-border-theme/40">
        <button
          type="button"
          onClick={() => onEdit(product)}
          className="flex-1 py-2 px-3 rounded-xl bg-accent/10 hover:bg-accent text-accent hover:text-accent-content font-bold text-xs border border-accent/20 transition cursor-pointer flex items-center justify-center gap-1.5"
        >
          ✏️ Edit
        </button>
        <button
          type="button"
          onClick={() => onDelete(product._id)}
          className="py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white font-bold text-xs border border-red-500/20 transition cursor-pointer"
          title="Delete Product"
        >
          🗑️
        </button>
      </div>
    </div>
  );
};

export default SellerProductCard;
