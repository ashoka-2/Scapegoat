import React, { useEffect } from "react";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { useProduct } from "../Hooks/useProduct";
import { useUserActivity } from "../Hooks/useUserActivity";
import ProductCarousel from "../Components/ProductCarousel";

const AllProducts = () => {
  const navigate = useNavigate();
  const { handleFetchAllProducts } = useProduct();
  const { products, loading, error } = useSelector((state) => state.product);
  const {
    recentlyViewed,
    forYouProducts,
    fetchRecentlyViewed,
    fetchForYou,
  } = useUserActivity();

  useEffect(() => {
    handleFetchAllProducts();
    fetchRecentlyViewed(10);
    fetchForYou(10);
  }, []);

  if (loading && (!products || products.length === 0)) {
    return (
      <section className="w-full py-16 px-4 max-w-[1350px] mx-auto">
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-xs font-bold tracking-[0.3em] uppercase text-foreground/50">
              Curating Your Feed...
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
  
  // Sort New Arrivals by createdAt desc (max 10 for Home carousel)
  const newArrivals = [...allProductsList]
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
    .slice(0, 10);

  return (
    <section className="w-full py-8 px-4 max-w-[1350px] mx-auto">
      {/* Section Divider */}
      <div className="flex items-center gap-4 mb-10">
        <div className="w-8 h-[2px] bg-accent"></div>
        <span className="text-[10px] font-black tracking-[0.5em] uppercase text-foreground/40">
          Personalized Storefront
        </span>
        <div className="flex-1 h-[1px] bg-border-theme/30"></div>
      </div>

      {/* 1. New Arrivals Section (Max 10, Slider) */}
      {newArrivals.length > 0 && (
        <ProductCarousel
          badge="Just Dropped"
          title="New Arrivals"
          subtitle="Fresh threads & latest releases straight from our creators."
          products={newArrivals}
          onViewAll={() => navigate("/shop?sortBy=newest")}
        />
      )}

      {/* 2. Recently Visited Section (Max 10, Slider) */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <ProductCarousel
          badge="Jump Back In"
          title="Recently Visited"
          subtitle="Products you were checking out earlier."
          products={recentlyViewed}
          onViewAll={() => navigate("/shop?filter=recently-viewed")}
        />
      )}

      {/* 3. For You Section (Instagram-Style Algorithm Recommendations) */}
      {forYouProducts && forYouProducts.length > 0 && (
        <ProductCarousel
          badge="Picked For You"
          title="Curated Recommendations"
          subtitle="Based on your interests, viewing patterns, and preferences."
          products={forYouProducts}
          onViewAll={() => navigate("/shop?filter=for-you")}
        />
      )}

      {/* 4. All Products / Full Collection (Max 10 Carousel with View All redirecting to Shop) */}
      {allProductsList.length > 0 && (
        <ProductCarousel
          badge="The Full Edit"
          title="Explore Collection"
          subtitle="Everything we've got in store. Discover your next favorite drop."
          products={allProductsList}
          onViewAll={() => navigate("/shop")}
        />
      )}
    </section>
  );
};

export default AllProducts;
