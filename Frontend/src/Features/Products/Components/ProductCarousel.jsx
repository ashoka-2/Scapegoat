import React, { useRef } from "react";
import { useNavigate } from "react-router-dom";
import ProductCard from "./ProductCard";

/**
 * Reusable Product Carousel Component for Home & Drawer Sections
 * Max 10 items displayed horizontally with smooth touch/scroll & View All link
 */
const ProductCarousel = ({ title, subtitle, badge, products, onViewAll }) => {
  const scrollRef = useRef(null);
  const navigate = useNavigate();

  if (!products || products.length === 0) return null;

  // Max 10 items for home page sections
  const displayProducts = products.slice(0, 10);

  const handleScrollLeft = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: -300, behavior: "smooth" });
    }
  };

  const handleScrollRight = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({ left: 300, behavior: "smooth" });
    }
  };

  const handleViewAll = () => {
    if (onViewAll) {
      onViewAll();
    } else {
      navigate("/shop");
    }
  };

  return (
    <div className="w-full mb-14">
      {/* Section Header */}
      <div className="flex items-end justify-between mb-6 px-1">
        <div className="flex flex-col gap-0.5">
          {badge && (
            <span className="text-[10px] font-black tracking-[0.35em] uppercase text-accent mb-0.5">
              {badge}
            </span>
          )}
          <h2 className="text-2xl sm:text-3xl font-black tracking-tighter text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-xs text-foreground/60 font-medium">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Scroll Navigation Buttons (Desktop) */}
          <div className="hidden sm:flex items-center gap-1.5 mr-2">
            <button
              onClick={handleScrollLeft}
              className="w-8 h-8 rounded-full border border-border-theme/60 flex items-center justify-center text-foreground/70 hover:text-foreground hover:border-accent transition cursor-pointer"
              aria-label="Scroll left"
            >
              <i className="ri-arrow-left-s-line text-lg" />
            </button>
            <button
              onClick={handleScrollRight}
              className="w-8 h-8 rounded-full border border-border-theme/60 flex items-center justify-center text-foreground/70 hover:text-foreground hover:border-accent transition cursor-pointer"
              aria-label="Scroll right"
            >
              <i className="ri-arrow-right-s-line text-lg" />
            </button>
          </div>

          <button
            onClick={handleViewAll}
            className="text-xs font-black tracking-widest uppercase text-accent hover:tracking-[0.25em] transition-all duration-300 flex items-center gap-1 group cursor-pointer whitespace-nowrap"
          >
            View All ({products.length})
            <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
          </button>
        </div>
      </div>

      {/* Horizontal Carousel (Max 10 Items) */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-4 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 pt-1 px-1 scroll-smooth"
      >
        {displayProducts.map((product, idx) => (
          <div
            key={product._id || idx}
            className="snap-start flex-shrink-0 w-[150px] min-[380px]:w-[165px] min-[480px]:w-[180px] sm:w-[210px] md:w-[230px]"
          >
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProductCarousel;
