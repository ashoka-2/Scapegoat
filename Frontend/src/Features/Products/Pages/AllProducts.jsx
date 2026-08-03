import React, { useEffect, useRef } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useProduct } from "../Hooks/useProduct";
import ProductCard from "../Components/ProductCard";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

// ─────────────────────────────────────────────
// Reusable Product Section Component
// ─────────────────────────────────────────────
const ProductSection = ({ title, subtitle, badge, products }) => {
  const sectionRef = useRef(null);
  const titleRef = useRef(null);
  const navigate = useNavigate();

  useGSAP(
    () => {
      if (!sectionRef.current || !titleRef.current) return;

      gsap.fromTo(
        titleRef.current,
        { opacity: 0, y: 20 },
        {
          opacity: 1,
          y: 0,
          duration: 0.7,
          ease: "power3.out",
          scrollTrigger: {
            trigger: titleRef.current,
            start: "top 88%",
            toggleActions: "play none none reverse",
          },
        }
      );
    },
    { scope: sectionRef }
  );

  if (!products || products.length === 0) return null;

  return (
    <div ref={sectionRef} className="w-full mb-20">
      {/* Section Header */}
      <div ref={titleRef} className="flex items-end justify-between mb-8 px-1">
        <div className="flex flex-col gap-1">
          {badge && (
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-accent mb-1">
              {badge}
            </span>
          )}
          <h2 className="text-3xl sm:text-4xl font-black tracking-tighter text-foreground">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-foreground/60 font-medium mt-1">{subtitle}</p>
          )}
        </div>
        <button
          onClick={() => navigate("/shop")}
          className="text-xs font-black tracking-widest uppercase text-accent hover:tracking-[0.3em] transition-all duration-300 flex items-center gap-1 group cursor-pointer"
        >
          View All
          <i className="ri-arrow-right-line group-hover:translate-x-1 transition-transform"></i>
        </button>
      </div>

      {/* Horizontal scroll on mobile, grid on desktop */}
      <div className="flex gap-3 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4 sm:grid sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 sm:overflow-visible sm:pb-0 sm:gap-2">
        {products.map((product, idx) => (
          <div key={product._id || idx} className="snap-start flex-shrink-0 w-[200px] sm:w-auto">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// Main AllProducts Page Section
// ─────────────────────────────────────────────
const AllProducts = () => {
  const { handleFetchAllProducts } = useProduct();
  const { products, loading, error } = useSelector((state) => state.product);

  useEffect(() => {
    handleFetchAllProducts();
  }, [handleFetchAllProducts]);

  if (loading && (!products || products.length === 0)) {
    return (
      <section className="w-full py-16 px-4 max-w-[1350px] mx-auto">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-foreground/50">
              Loading Drops...
            </p>
          </div>
        </div>
      </section>
    );
  }

  if (error && (!products || products.length === 0)) {
    return (
      <section className="w-full py-16 flex flex-col items-center justify-center gap-4 text-center max-w-[1350px] mx-auto">
        <i className="ri-error-warning-line text-5xl text-accent"></i>
        <p className="text-foreground/60 text-sm font-medium">Couldn't load products right now.</p>
        <button
          onClick={handleFetchAllProducts}
          className="bg-accent text-accent-content px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase hover:opacity-80 transition cursor-pointer"
        >
          Retry
        </button>
      </section>
    );
  }

  const allProductsList = products || [];
  const newArrivals = allProductsList.slice(0, 5);

  return (
    <section className="w-full py-12 px-4 max-w-[1350px] mx-auto">
      {/* Section Divider */}
      <div className="flex items-center gap-4 mb-12">
        <div className="w-8 h-[2px] bg-accent"></div>
        <span className="text-[10px] font-black tracking-[0.5em] uppercase text-foreground/40">
          Collections
        </span>
        <div className="flex-1 h-[1px] bg-border-theme/30"></div>
      </div>

      {/* 1. All Products */}
      {allProductsList.length > 0 ? (
        <ProductSection
          badge="The Full Edit"
          title="All Products"
          subtitle="Everything we've got. Your next obsession is here."
          products={allProductsList}
        />
      ) : (
        <div className="bg-surface/50 border border-dashed border-border-theme rounded-3xl p-16 text-center mb-10">
          <i className="ri-shopping-bag-line text-5xl text-accent/30 mb-4 block"></i>
          <h3 className="text-xl font-bold text-foreground">No products found</h3>
          <p className="text-sm text-foreground/40 mt-1">Check back later or add new products.</p>
        </div>
      )}

      {/* 2. New Arrivals */}
      {newArrivals.length > 0 && (
        <ProductSection
          badge="Just Dropped"
          title="New Arrivals"
          subtitle="Fresh threads, straight from the workshop."
          products={newArrivals}
        />
      )}
    </section>
  );
};

export default AllProducts;
