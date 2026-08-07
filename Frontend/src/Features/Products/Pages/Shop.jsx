import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useProduct } from "../Hooks/useProduct";
import { useUserActivity } from "../Hooks/useUserActivity";
import ProductCard from "../Components/ProductCard";
import ProductGridSkeleton from "../Components/Skeletons/ProductGridSkeleton";
import { useDebounce } from "../../../utils/timingUtils";
import { useInfiniteScroll } from "../../../utils/useInfiniteScroll";
import { aiSearchProductsApi } from "../Services/product.api";
import BannerCarousel from "../../Home/Components/BannerCarousel";

function calculateProductMatchScore(product, query) {
  if (!query || !query.trim()) return 0;
  const q = query.trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);

  let score = 0;
  const titleLower = (product.title || "").toLowerCase();
  const descLower = ((product.description || "") + " " + (product.shortDescription || "")).toLowerCase();
  const catLower = (product.category?.name || "").toLowerCase();
  const brandLower = (product.brand?.name || "").toLowerCase();
  const tagsLower = Array.isArray(product.tags) ? product.tags.join(" ").toLowerCase() : (product.tags || "").toLowerCase();
  const skuLower = (product.sku || "").toLowerCase();

  const queryNum = parseFloat(q);
  const isNum = !isNaN(queryNum) && queryNum > 0;

  // Number-as-price match: check if product price is close to requested number
  if (isNum) {
    const prodPrice = product.sellingPrice?.amount || product.maxPrice?.amount || product.price?.saleAmount || product.price?.amount || 0;
    if (prodPrice > 0 && Math.abs(prodPrice - queryNum) <= queryNum * 0.15) {
      score += 120;
    }
  }

  // SKU Exact Match
  if (skuLower && skuLower === q) score += 180;

  // Exact Title Match
  if (titleLower === q) score += 150;
  else if (titleLower.includes(q)) score += 100;
  else if (titleLower.startsWith(q)) score += 60;

  // Direct Category, Brand & Tags Match
  if (catLower.includes(q)) score += 85;
  if (brandLower.includes(q)) score += 85;
  if (tagsLower.includes(q)) score += 80;

  // Token Keyword Matching
  words.forEach((w) => {
    if (titleLower.includes(w)) score += 35;
    if (catLower.includes(w)) score += 30;
    if (brandLower.includes(w)) score += 30;
    if (tagsLower.includes(w)) score += 25;
    if (descLower.includes(w)) score += 15;
  });

  return score;
}

// ── Dual Range Price Slider ───────────────────────────────────────────────────
const DualRangeSlider = ({ min, max, low, high, onChange }) => {
  const rangeRef = useRef(null);
  const [activeThumb, setActiveThumb] = useState("low");

  const effectiveMin = min || 0;
  const effectiveMax = max > min ? max : 50000;

  const thumbLow = Math.max(0, Math.min(100, ((low - effectiveMin) / (effectiveMax - effectiveMin)) * 100));
  const thumbHigh = Math.max(0, Math.min(100, ((high - effectiveMin) / (effectiveMax - effectiveMin)) * 100));

  const updateActiveThumb = (e) => {
    if (!rangeRef.current) return;
    const rect = rangeRef.current.getBoundingClientRect();
    const clientX = e.clientX !== undefined ? e.clientX : e.touches && e.touches[0]?.clientX;
    if (clientX === undefined) return;
    const x = clientX - rect.left;
    const pct = (x / rect.width) * 100;

    const distLow = Math.abs(pct - thumbLow);
    const distHigh = Math.abs(pct - thumbHigh);

    setActiveThumb(distLow < distHigh ? "low" : "high");
  };

  const handleLowChange = (e) => {
    const val = Math.min(Number(e.target.value), high - 1);
    onChange(val, high);
  };

  const handleHighChange = (e) => {
    const val = Math.max(Number(e.target.value), low + 1);
    onChange(low, val);
  };

  return (
    <div className="w-full py-2">
      <div
        ref={rangeRef}
        className="relative h-6 flex items-center w-full touch-none select-none"
        onMouseMove={(e) => e.buttons !== 1 && updateActiveThumb(e)}
        onTouchStart={updateActiveThumb}
      >
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-border-theme/40" />
        <div
          className="absolute h-1.5 rounded-full bg-accent transition-all duration-75"
          style={{
            left: `${thumbLow}%`,
            width: `${Math.max(0, thumbHigh - thumbLow)}%`,
          }}
        />
        <input
          type="range"
          min={effectiveMin}
          max={effectiveMax}
          value={low}
          onChange={handleLowChange}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-lg"
          style={{ zIndex: activeThumb === "low" ? 5 : 3 }}
        />
        <input
          type="range"
          min={effectiveMin}
          max={effectiveMax}
          value={high}
          onChange={handleHighChange}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-lg"
          style={{ zIndex: activeThumb === "high" ? 5 : 3 }}
        />
      </div>
    </div>
  );
};

// ── Reusable Tag Filter Component ─────────────────────────────────────────────
const TagFilter = ({ label, options, selected, onToggle, colorClass }) => {
  if (!options || !options.length) return null;
  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/50 mb-3">{label}</h3>
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => (
          <button
            key={opt}
            onClick={() => onToggle(opt)}
            className={`px-3 py-1.5 rounded-full text-xs font-bold border transition-all cursor-pointer ${
              selected.includes(opt)
                ? `${colorClass || "bg-foreground text-background border-foreground"}`
                : "bg-surface border-border-theme/50 hover:border-accent text-foreground/70"
            }`}
          >
            {opt}
            {selected.includes(opt) && <i className="ri-close-line ml-1 text-xs" />}
          </button>
        ))}
      </div>
    </div>
  );
};

// ── Standalone Sidebar Component (Prevents Unmounting Input Focus Loss) ──────
const FilterSidebarContent = ({
  activeFilterCount,
  isPriceFiltered,
  debouncedSearchQuery,
  rawSearchQuery,
  setRawSearchQuery,
  clearFilters,
  setIsMobileFilterOpen,
  sortBy,
  setSortBy,
  fmt,
  priceLow,
  priceHigh,
  filterOptions,
  setPriceLow,
  setPriceHigh,
  selectedCategories,
  setSelectedCategories,
  selectedBrands,
  setSelectedBrands,
  selectedColors,
  setSelectedColors,
  selectedSizes,
  setSelectedSizes,
  toggleItem,
}) => (
  <div className="space-y-6">
    <div className="flex justify-between items-center mb-2">
      <div className="flex items-center gap-2">
        <h2 className="text-xl font-black uppercase tracking-widest text-foreground">Filters</h2>
        {(activeFilterCount > 0 || isPriceFiltered || debouncedSearchQuery) && (
          <span className="bg-accent text-accent-content text-[10px] font-black px-2 py-0.5 rounded-full">
            {activeFilterCount + (isPriceFiltered ? 1 : 0) + (debouncedSearchQuery ? 1 : 0)}
          </span>
        )}
      </div>
      <div className="flex items-center gap-2">
        {(activeFilterCount > 0 || isPriceFiltered || debouncedSearchQuery) && (
          <button onClick={clearFilters} className="text-xs text-accent font-bold hover:underline cursor-pointer">
            Clear All
          </button>
        )}
        <button onClick={() => setIsMobileFilterOpen(false)} className="md:hidden text-2xl text-foreground">
          <i className="ri-close-line"></i>
        </button>
      </div>
    </div>

    {/* Search Input */}
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/50 mb-2">Search Catalog</h3>
      <div className="relative flex items-center">
        <i className="ri-search-line absolute left-3 text-foreground/40 text-xs pointer-events-none" />
        <input
          type="text"
          placeholder="Search products or price (e.g. 999)..."
          value={rawSearchQuery}
          onChange={(e) => setRawSearchQuery(e.target.value)}
          className="w-full bg-surface border border-border-theme/50 rounded-xl pl-8 pr-7 py-2 text-xs font-medium text-foreground focus:outline-none focus:border-accent placeholder:text-foreground/40 transition"
        />
        {rawSearchQuery && (
          <button
            onClick={() => setRawSearchQuery("")}
            className="absolute right-2 text-foreground/40 hover:text-foreground text-xs cursor-pointer"
          >
            <i className="ri-close-line" />
          </button>
        )}
      </div>
    </div>

    {/* Sort By */}
    <div>
      <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/50 mb-3">Sort By</h3>
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="w-full bg-surface border border-border-theme/50 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-accent"
      >
        {debouncedSearchQuery && <option value="relevance">Best Match</option>}
        <option value="newest">Newest Arrivals</option>
        <option value="price-asc">Price: Low to High</option>
        <option value="price-desc">Price: High to Low</option>
      </select>
    </div>

    {/* Price Range Slider */}
    <div className="border-t border-border-theme/30 pt-4">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/50">Price Range</h3>
        <span className="text-xs font-mono font-bold text-accent">
          {fmt(priceLow)} – {fmt(priceHigh)}
        </span>
      </div>
      <DualRangeSlider
        min={filterOptions.minPrice}
        max={filterOptions.maxPrice}
        low={priceLow}
        high={priceHigh}
        onChange={(l, h) => {
          setPriceLow(l);
          setPriceHigh(h);
        }}
      />
    </div>

    <TagFilter
      label="Categories"
      options={filterOptions.categories}
      selected={selectedCategories}
      onToggle={(val) => toggleItem(setSelectedCategories, val)}
    />

    <TagFilter
      label="Brands"
      options={filterOptions.brands}
      selected={selectedBrands}
      onToggle={(val) => toggleItem(setSelectedBrands, val)}
    />

    <TagFilter
      label="Colors"
      options={filterOptions.colors}
      selected={selectedColors}
      onToggle={(val) => toggleItem(setSelectedColors, val)}
    />

    <TagFilter
      label="Sizes"
      options={filterOptions.sizes}
      selected={selectedSizes}
      onToggle={(val) => toggleItem(setSelectedSizes, val)}
    />
  </div>
);

// ── Main Shop Page Component ──────────────────────────────────────────────────
const Shop = () => {
  const [searchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialSort = searchParams.get("sortBy") || "newest";
  const initialFilter = searchParams.get("filter") || "";

  const { handleFetchAllProducts } = useProduct();
  const { products: allProducts, loading } = useSelector((state) => state.product);
  const { recentlyViewed, forYouProducts, fetchRecentlyViewed, fetchForYou } = useUserActivity();

  const [rawSearchQuery, setRawSearchQuery] = useState(initialQuery);

  // Sync search input when URL query param `q` updates
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null && q !== undefined) {
      setRawSearchQuery(q);
    }
  }, [searchParams]);

  const debouncedSearchQuery = useDebounce(rawSearchQuery, 300);
  const [aiVectorResults, setAiVectorResults] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  // Filter states
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceLow, setPriceLow] = useState(0);
  const [priceHigh, setPriceHigh] = useState(50000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState(initialSort);

  // Infinite Scroll Pagination State (20 items per batch)
  const [visibleCount, setVisibleCount] = useState(20);

  const hasShopFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasShopFetchedRef.current) {
      hasShopFetchedRef.current = true;
      handleFetchAllProducts();
      if (initialFilter === "recently-viewed") fetchRecentlyViewed(20);
      if (initialFilter === "for-you") fetchForYou(20);
    }
  }, [initialFilter]);

  // Execute Backend Vector Search API using text embeddings
  useEffect(() => {
    if (!debouncedSearchQuery || !debouncedSearchQuery.trim()) {
      setAiVectorResults(null);
      return;
    }

    let isMounted = true;
    setIsAiLoading(true);

    aiSearchProductsApi(debouncedSearchQuery.trim())
      .then((res) => {
        if (isMounted && res?.data) {
          setAiVectorResults(res.data);
        }
      })
      .catch((err) => {
        console.warn("[AI Search] Backend vector search API error:", err?.message);
      })
      .finally(() => {
        if (isMounted) setIsAiLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [debouncedSearchQuery]);

  // Extract unique filter options dynamically
  const filterOptions = useMemo(() => {
    const categories = new Set();
    const brands = new Set();
    const colors = new Set();
    const sizes = new Set();
    let minPrice = Infinity;
    let maxPrice = 0;

    if (allProducts && allProducts.length > 0) {
      allProducts.forEach((p) => {
        const price =
          p.sellingPrice?.amount || p.maxPrice?.amount || p.price?.saleAmount || p.price?.amount || 0;
        if (price < minPrice) minPrice = price;
        if (price > maxPrice) maxPrice = price;

        if (p.category?.name) categories.add(p.category.name);
        if (p.brand?.name) brands.add(p.brand.name);

        (p.variants || []).forEach((v) => {
          if (v.attributes) {
            const raw =
              typeof v.attributes.forEach === "function"
                ? Object.fromEntries(v.attributes)
                : v.attributes._doc || v.attributes;
            if (raw) {
              if (raw.Color || raw.color) colors.add(raw.Color || raw.color);
              if (raw.Size || raw.size) sizes.add(raw.Size || raw.size);
            }
          }
          (v.dynamicAttributes || []).forEach((da) => {
            const k = (da.key || da.name || "").toLowerCase();
            const vals = da.values || da.options || (da.value ? [da.value] : []);
            if (k === "color") vals.forEach((val) => colors.add(val));
            if (k === "size") vals.forEach((val) => sizes.add(val));
          });
        });
      });
    }

    return {
      categories: Array.from(categories).sort(),
      brands: Array.from(brands).sort(),
      colors: Array.from(colors).sort(),
      sizes: Array.from(sizes).sort(),
      minPrice: minPrice === Infinity ? 0 : Math.floor(minPrice),
      maxPrice: maxPrice || 50000,
    };
  }, [allProducts]);

  useEffect(() => {
    if (filterOptions.maxPrice > 0) {
      setPriceHigh(filterOptions.maxPrice);
    }
  }, [filterOptions.maxPrice]);

  const toggleItem = (setter, value) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  // AI Semantic + Vector Embedding Filter & Sort algorithm
  const filteredProducts = useMemo(() => {
    if (!allProducts) return [];

    let pool = allProducts;
    if (initialFilter === "recently-viewed" && recentlyViewed.length > 0) {
      pool = recentlyViewed;
    } else if (initialFilter === "for-you" && forYouProducts.length > 0) {
      pool = forYouProducts;
    }

    const isSearchActive = Boolean(debouncedSearchQuery && debouncedSearchQuery.trim());
    const sourcePool = isSearchActive && aiVectorResults && aiVectorResults.length > 0 ? aiVectorResults : pool;

    let scoredList = sourcePool.map((p) => {
      const score = isSearchActive ? calculateProductMatchScore(p, debouncedSearchQuery) : 0;
      return { product: p, score };
    });

    if (isSearchActive && (!aiVectorResults || aiVectorResults.length === 0)) {
      scoredList = scoredList.filter((item) => item.score > 0);
    }

    let result = scoredList.filter(({ product: p }) => {
      const price =
        p.sellingPrice?.amount || p.maxPrice?.amount || p.price?.saleAmount || p.price?.amount || 0;
      const matchCat = !selectedCategories.length || selectedCategories.includes(p.category?.name);
      const matchBrand = !selectedBrands.length || selectedBrands.includes(p.brand?.name);
      const matchPrice = price >= priceLow && price <= priceHigh;

      let pColors = [];
      let pSizes = [];
      (p.variants || []).forEach((v) => {
        if (v.attributes) {
          const raw =
            typeof v.attributes.forEach === "function"
              ? Object.fromEntries(v.attributes)
              : v.attributes._doc || v.attributes;
          if (raw) {
            if (raw.Color || raw.color) pColors.push(raw.Color || raw.color);
            if (raw.Size || raw.size) pSizes.push(raw.Size || raw.size);
          }
        }
        (v.dynamicAttributes || []).forEach((da) => {
          const k = (da.key || da.name || "").toLowerCase();
          const vals = da.values || da.options || (da.value ? [da.value] : []);
          if (k === "color") pColors.push(...vals);
          if (k === "size") pSizes.push(...vals);
        });
      });

      const matchColor = !selectedColors.length || pColors.some((c) => selectedColors.includes(c));
      const matchSize = !selectedSizes.length || pSizes.some((s) => selectedSizes.includes(s));

      return matchCat && matchBrand && matchPrice && matchColor && matchSize;
    });

    const getPrice = (prod) =>
      prod.sellingPrice?.amount || prod.maxPrice?.amount || prod.price?.saleAmount || prod.price?.amount || 0;

    if (isSearchActive && sortBy === "relevance") {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => getPrice(a.product) - getPrice(b.product));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => getPrice(b.product) - getPrice(a.product));
    } else {
      result.sort((a, b) => {
        if (isSearchActive && b.score !== a.score) return b.score - a.score;
        return new Date(b.product.createdAt) - new Date(a.product.createdAt);
      });
    }

    return result.map((item) => item.product);
  }, [
    allProducts,
    recentlyViewed,
    forYouProducts,
    initialFilter,
    debouncedSearchQuery,
    aiVectorResults,
    selectedCategories,
    selectedBrands,
    selectedColors,
    selectedSizes,
    priceLow,
    priceHigh,
    sortBy,
  ]);

  // Reset pagination count when search/filters change
  useEffect(() => {
    setVisibleCount(20);
  }, [debouncedSearchQuery, selectedCategories, selectedBrands, selectedColors, selectedSizes, priceLow, priceHigh, sortBy]);

  const loadMoreProducts = useCallback(() => {
    setVisibleCount((prev) => Math.min(prev + 20, filteredProducts.length));
  }, [filteredProducts.length]);

  const hasMore = visibleCount < filteredProducts.length;
  const sentinelRef = useInfiniteScroll(loadMoreProducts, hasMore, loading || isAiLoading);

  const displayedProducts = useMemo(() => {
    return filteredProducts.slice(0, visibleCount);
  }, [filteredProducts, visibleCount]);

  const clearFilters = () => {
    setSelectedCategories([]);
    setSelectedBrands([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setRawSearchQuery("");
    setPriceLow(filterOptions.minPrice);
    setPriceHigh(filterOptions.maxPrice);
  };

  const activeFilterCount =
    selectedCategories.length + selectedBrands.length + selectedColors.length + selectedSizes.length;
  const isPriceFiltered = priceLow > filterOptions.minPrice || priceHigh < filterOptions.maxPrice;

  const fmt = (v) => `₹${Number(v).toLocaleString("en-IN")}`;

  const sidebarProps = {
    activeFilterCount,
    isPriceFiltered,
    debouncedSearchQuery,
    rawSearchQuery,
    setRawSearchQuery,
    clearFilters,
    setIsMobileFilterOpen,
    sortBy,
    setSortBy,
    fmt,
    priceLow,
    priceHigh,
    filterOptions,
    setPriceLow,
    setPriceHigh,
    selectedCategories,
    setSelectedCategories,
    selectedBrands,
    setSelectedBrands,
    selectedColors,
    setSelectedColors,
    selectedSizes,
    setSelectedSizes,
    toggleItem,
  };

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 max-w-[1400px] mx-auto">
      {/* Dynamic Target Page Banner Carousels */}
      <BannerCarousel page="shop" placement="hero" />
      <BannerCarousel page="shop" placement="inline" />

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4 mb-8 pb-6 border-b border-border-theme/40">
        <div>
          <span className="text-[10px] font-black tracking-[0.4em] uppercase text-accent mb-1 block">
            ScapeGoat Marketplace
          </span>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">The Shop</h1>
        </div>

        <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
          {debouncedSearchQuery && (
            <div className="flex items-center gap-2 bg-accent/10 border border-accent/20 px-3 py-1 rounded-full text-xs text-accent font-bold">
              <span>Results for "{debouncedSearchQuery}"</span>
              <button onClick={() => setRawSearchQuery("")} className="hover:text-foreground cursor-pointer">
                <i className="ri-close-line" />
              </button>
            </div>
          )}
          <p className="text-xs font-bold uppercase tracking-widest text-foreground/50">
            Showing <span className="text-foreground font-black">{displayedProducts.length}</span> of {filteredProducts.length} Drops
          </p>
          <button
            onClick={() => setIsMobileFilterOpen(true)}
            className="md:hidden bg-surface border border-border-theme px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer"
          >
            <i className="ri-filter-3-line"></i> Filters
            {activeFilterCount > 0 && (
              <span className="bg-accent text-accent-content text-[9px] font-black px-1.5 py-0.5 rounded-full">
                {activeFilterCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0 space-y-6">
          <FilterSidebarContent {...sidebarProps} />
          <BannerCarousel page="shop" placement="sidebar" />
        </div>

        {/* Mobile Filter Drawer */}
        {isMobileFilterOpen &&
          createPortal(
            <div className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-md flex justify-end md:hidden">
              <div className="bg-background w-[85%] max-w-sm h-full p-6 overflow-y-auto shadow-2xl border-l border-border-theme">
                <FilterSidebarContent {...sidebarProps} />
              </div>
            </div>,
            document.body
          )}

        {/* Product Grid with Infinite Scroll */}
        <div className="flex-1">
          {loading && (!allProducts || allProducts.length === 0) ? (
            <ProductGridSkeleton count={8} />
          ) : displayedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {displayedProducts.map((product) => (
                  <ProductCard key={product._id} product={product} />
                ))}
              </div>

              {/* Infinite Scroll Sentinel Element */}
              <div ref={sentinelRef} className="w-full py-8 flex items-center justify-center min-h-[60px]">
                {hasMore && (
                  <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-foreground/50">
                    <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
                    Loading 20 more drops...
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="bg-surface/50 border border-dashed border-border-theme rounded-3xl p-16 text-center">
              <i className="ri-shopping-bag-line text-5xl text-accent/30 mb-4 block"></i>
              <h3 className="text-xl font-bold">No products found</h3>
              <p className="text-sm text-foreground/40 mt-1 mb-6">
                Try searching for related terms or clearing applied filters.
              </p>
              <button
                onClick={clearFilters}
                className="bg-accent text-accent-content px-6 py-2 rounded-full text-xs font-black tracking-widest uppercase hover:opacity-80 transition cursor-pointer"
              >
                Clear All Filters
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Shop;
