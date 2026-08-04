import React from "react";
import ProductCardSkeleton from "./ProductCardSkeleton";

/**
 * ProductGridSkeleton Component
 * Responsive grid layout matching Shop.jsx and AllProducts.jsx
 */
const ProductGridSkeleton = ({ count = 8 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 w-full py-4">
      {Array.from({ length: count }).map((_, idx) => (
        <ProductCardSkeleton key={idx} />
      ))}
    </div>
  );
};

export default ProductGridSkeleton;
