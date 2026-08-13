import React from "react";
import ProductCardSkeleton from "./ProductCardSkeleton";

/**
 * ProductGridSkeleton Component
 * Responsive grid layout matching Shop.jsx and AllProducts.jsx
 */
const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(150px,176px))] gap-4 w-full py-4">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
