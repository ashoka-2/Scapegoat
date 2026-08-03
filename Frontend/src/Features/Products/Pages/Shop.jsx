import React, { useEffect, useState, useMemo, useRef } from "react";
import { useSelector } from "react-redux";
import { useProduct } from "../Hooks/useProduct";
import ProductCard from "../Components/ProductCard";
import { useDebounce } from "../../../utils/timingUtils";
import { aiSearchProductsApi } from "../Services/product.api";

// ── Semantic Concept Synonyms Map for AI Matching ────────────────────────────
const SEMANTIC_CONCEPTS = {
  shoes: ["footwear", "sneakers", "kicks", "running", "trainers", "air", "c1ty", "boots"],
  sneakers: ["shoes", "footwear", "kicks", "nike", "running", "air"],
  footwear: ["shoes", "sneakers", "kicks", "nike", "boots", "sandals"],
  clothing: ["apparel", "wear", "shirt", "t-shirt", "jacket", "hoodie", "top", "pants"],
  shirts: ["t-shirt", "top", "polo", "tee", "apparel", "clothing"],
  jacket: ["outerwear", "coat", "hoodie", "fleece", "winter", "warm"],
  winter: ["jacket", "hoodie", "fleece", "warm", "coat"],
  summer: ["cotton", "t-shirt", "breathable", "shorts", "mesh"],
  black: ["dark", "ebony", "noir"],
  white: ["clean", "light", "ivory", "snow"],
  nike: ["footwear", "sneakers", "apparel", "air", "c1ty"],
};

function calculateProductMatchScore(product, query) {
  if (!query || !query.trim()) return { score: 0, tag: null };
  const q = query.trim().toLowerCase();
  const words = q.split(/\s+/).filter(Boolean);

  let score = 0;
  const titleLower = (product.title || "").toLowerCase();
  const descLower = (product.description || "" + " " + (product.shortDescription || "")).toLowerCase();
  const catLower = (product.category?.name || "").toLowerCase();
  const brandLower = (product.brand?.name || "").toLowerCase();

  // Variant Attributes String
  let attrText = "";
  (product.variants || []).forEach((v) => {
    if (v.attributes) {
      const raw =
        typeof v.attributes.forEach === "function"
          ? Object.fromEntries(v.attributes)
          : v.attributes._doc || v.attributes;
      if (raw) attrText += " " + Object.values(raw).join(" ");
    }
    (v.dynamicAttributes || []).forEach((da) => {
      attrText += " " + (da.key || "") + " " + (da.values || da.options || []).join(" ");
    });
  });
  const attrLower = attrText.toLowerCase();

  // 1. Exact Title Match
  if (titleLower === q) score += 150;
  else if (titleLower.includes(q)) score += 100;
  else if (titleLower.startsWith(q)) score += 60;

  // 2. Direct Category & Brand Match
  if (catLower.includes(q)) score += 85;
  if (brandLower.includes(q)) score += 85;

  // 3. Variant Attributes Match
  if (attrLower.includes(q)) score += 70;

  // 4. Token & Semantic Matching
  words.forEach((w) => {
    if (titleLower.includes(w)) score += 35;
    if (catLower.includes(w)) score += 30;
    if (brandLower.includes(w)) score += 30;
    if (attrLower.includes(w)) score += 25;
    if (descLower.includes(w)) score += 15;

    // Semantic Synonym Expansion
    const synonyms = SEMANTIC_CONCEPTS[w] || [];
    synonyms.forEach((syn) => {
      if (titleLower.includes(syn)) score += 30;
      if (catLower.includes(syn)) score += 25;
      if (brandLower.includes(syn)) score += 25;
      if (attrLower.includes(syn)) score += 20;
      if (descLower.includes(syn)) score += 10;
    });
  });

  let tag = null;
  if (score >= 120) tag = "✨ Exact Match";
  else if (score >= 60) tag = "✨ High Relevance";
  else if (score > 0) tag = "✨ Similar Match";

  return { score, tag };
}

// ── Dual Range Price Slider ───────────────────────────────────────────────────
const DualRangeSlider = ({ min, max, low, high, onChange }) => {
  const rangeRef = useRef(null);
  const [activeThumb, setActiveThumb] = useState("low");

  const effectiveMin = min || 0;
  const effectiveMax = max > min ? max : 10000;

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
        {/* Base Track */}
        <div className="absolute inset-x-0 h-1.5 rounded-full bg-border-theme/40" />

        {/* Active Range Highlight */}
        <div
          className="absolute h-1.5 rounded-full bg-accent transition-all duration-75"
          style={{
            left: `${thumbLow}%`,
            width: `${Math.max(0, thumbHigh - thumbLow)}%`,
          }}
        />

        {/* Low Range Input */}
        <input
          type="range"
          min={effectiveMin}
          max={effectiveMax}
          value={low}
          onChange={handleLowChange}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-lg"
          style={{ zIndex: activeThumb === "low" ? 5 : 3 }}
        />

        {/* High Range Input */}
        <input
          type="range"
          min={effectiveMin}
          max={effectiveMax}
          value={high}
          onChange={handleHighChange}
          className="absolute inset-0 w-full h-full appearance-none bg-transparent pointer-events-none focus:outline-none [&::-webkit-slider-thumb]:pointer-events-auto [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-accent [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-background [&::-webkit-slider-thumb]:shadow-lg [&::-moz-range-thumb]:pointer-events-auto [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-accent [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-background [&::-moz-range-thumb]:shadow-lg"
          style={{ zIndex: activeThumb === "high" ? 5 : 3 }}
        />
      </div>
    </div>
  );
};

const Shop = () => {
  const { handleFetchAllProducts } = useProduct();
  const { products: allProducts, loading } = useSelector((state) => state.product);

  // Raw search input state & debounced 300ms search state
  const [rawSearchQuery, setRawSearchQuery] = useState("");
  const debouncedSearchQuery = useDebounce(rawSearchQuery, 300);
  const [aiVectorResults, setAiVectorResults] = useState(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const isSearching = rawSearchQuery !== debouncedSearchQuery || isAiLoading;

  // Filter states – multi-select arrays
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [selectedBrands, setSelectedBrands] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [priceLow, setPriceLow] = useState(0);
  const [priceHigh, setPriceHigh] = useState(50000);
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState("newest");

  useEffect(() => {
    handleFetchAllProducts();
  }, [handleFetchAllProducts]);

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

  // Initialize price range based on dynamic max price
  useEffect(() => {
    if (filterOptions.maxPrice > 0) {
      setPriceHigh(filterOptions.maxPrice);
    }
  }, [filterOptions.maxPrice]);

  const toggleItem = (setter, value) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  // AI Semantic + Vector Embedding Filter & Sort algorithm
  const filteredProductsWithScores = useMemo(() => {
    if (!allProducts) return [];

    const isSearchActive = Boolean(debouncedSearchQuery && debouncedSearchQuery.trim());

    // Use backend vector search results if available, otherwise use allProducts pool
    const sourcePool = isSearchActive && aiVectorResults && aiVectorResults.length > 0 ? aiVectorResults : allProducts;

    let scoredList = sourcePool.map((p) => {
      const { score, tag } = isSearchActive
        ? calculateProductMatchScore(p, debouncedSearchQuery)
        : { score: 0, tag: null };

      const finalTag =
        isSearchActive && aiVectorResults && aiVectorResults.some((vecP) => vecP._id === p._id)
          ? "✨ AI Embedding Match"
          : tag;

      return { product: p, score: Math.max(score, 80), matchTag: finalTag };
    });

    if (isSearchActive && (!aiVectorResults || aiVectorResults.length === 0)) {
      scoredList = scoredList.filter((item) => item.score > 0);
    }

    // Apply Standard Category, Brand, Price, Color, Size filters
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

    // Sort strategy
    if (isSearchActive && sortBy === "relevance") {
      result.sort((a, b) => b.score - a.score);
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => getPrice(a.product) - getPrice(b.product));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => getPrice(b.product) - getPrice(a.product));
    } else {
      // Default: newest or AI match score
      result.sort((a, b) => {
        if (isSearchActive && b.score !== a.score) return b.score - a.score;
        return new Date(b.product.createdAt) - new Date(a.product.createdAt);
      });
    }

    return result;
  }, [
    allProducts,
    debouncedSearchQuery,
    selectedCategories,
    selectedBrands,
    selectedColors,
    selectedSizes,
    priceLow,
    priceHigh,
    sortBy,
  ]);

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

  const TagFilter = ({ label, options, selected, onToggle, colorClass }) => {
    if (!options.length) return null;
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

  const FilterSidebar = () => (
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

      {/* Sort By (Desktop & Mobile) */}
      <div>
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground/50 mb-3">Sort By</h3>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="w-full bg-surface border border-border-theme/50 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-accent"
        >
          {debouncedSearchQuery && <option value="relevance">✨ AI Best Match</option>}
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

      {/* Filter Categories */}
      <TagFilter
        label="Categories"
        options={filterOptions.categories}
        selected={selectedCategories}
        onToggle={(val) => toggleItem(setSelectedCategories, val)}
      />

      {/* Filter Brands */}
      <TagFilter
        label="Brands"
        options={filterOptions.brands}
        selected={selectedBrands}
        onToggle={(val) => toggleItem(setSelectedBrands, val)}
      />

      {/* Filter Colors */}
      <TagFilter
        label="Colors"
        options={filterOptions.colors}
        selected={selectedColors}
        onToggle={(val) => toggleItem(setSelectedColors, val)}
      />

      {/* Filter Sizes */}
      <TagFilter
        label="Sizes"
        options={filterOptions.sizes}
        selected={selectedSizes}
        onToggle={(val) => toggleItem(setSelectedSizes, val)}
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-background text-foreground py-10 px-4 max-w-[1400px] mx-auto">
      {/* Header Banner & Prominent AI Smart Search Bar */}
      <div className="flex flex-col gap-6 mb-10 pb-6 border-b border-border-theme/40">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <span className="text-[10px] font-black tracking-[0.4em] uppercase text-accent mb-1 block">
              ScapeGoat Store
            </span>
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase">The Shop</h1>
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto justify-between md:justify-end">
            <p className="text-xs font-bold uppercase tracking-widest text-foreground/50">
              Showing <span className="text-foreground font-black">{filteredProductsWithScores.length}</span> Drops
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

        {/* ✨ AI Smart Search Bar */}
        <div className="relative w-full max-w-3xl mx-auto">
          <div className="relative flex items-center bg-surface border-2 border-accent/40 hover:border-accent rounded-2xl p-2 shadow-lg transition-all group focus-within:border-accent focus-within:ring-4 focus-within:ring-accent/20">
            <div className="flex items-center gap-2 pl-3 pr-2 text-accent font-black text-xs uppercase tracking-widest pointer-events-none select-none">
              <span className="animate-pulse text-base">✨</span>
              <span className="hidden sm:inline">AI Search</span>
            </div>

            <input
              type="text"
              placeholder="Search exact drops, colors, sneakers, warm hoodies..."
              value={rawSearchQuery}
              onChange={(e) => setRawSearchQuery(e.target.value)}
              className="w-full bg-transparent px-2 py-2 text-sm font-semibold text-foreground focus:outline-none placeholder:text-foreground/40"
            />

            {/* Indicator / Spinner / Clear Button */}
            <div className="flex items-center gap-2 pr-3">
              {isSearching && (
                <div className="w-4 h-4 border-2 border-accent border-t-transparent rounded-full animate-spin"></div>
              )}
              {rawSearchQuery && (
                <button
                  onClick={() => setRawSearchQuery("")}
                  className="text-foreground/50 hover:text-foreground text-lg cursor-pointer"
                  title="Clear search"
                >
                  <i className="ri-close-circle-fill"></i>
                </button>
              )}
            </div>
          </div>

          {/* AI Search Active Query Badge */}
          {debouncedSearchQuery && (
            <div className="mt-2 flex items-center justify-between px-2 text-xs font-bold text-foreground/60">
              <div className="flex items-center gap-2">
                <span className="text-accent font-black">✨ Concept Matches for:</span>
                <span className="bg-accent/10 border border-accent/20 px-2 py-0.5 rounded-lg text-accent font-mono">
                  "{debouncedSearchQuery}"
                </span>
              </div>
              <button
                onClick={() => setRawSearchQuery("")}
                className="text-[10px] text-accent uppercase font-black hover:underline cursor-pointer"
              >
                Clear Search
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-8">
        {/* Desktop Sidebar */}
        <div className="hidden md:block w-64 flex-shrink-0">
          <FilterSidebar />
        </div>

        {/* Mobile Filter Drawer Modal */}
        {isMobileFilterOpen && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex justify-end md:hidden">
            <div className="bg-background w-4/5 max-w-sm h-full p-6 overflow-y-auto shadow-2xl border-l border-border-theme">
              <FilterSidebar />
            </div>
          </div>
        )}

        {/* Product Grid */}
        <div className="flex-1">
          {loading && (!allProducts || allProducts.length === 0) ? (
            <div className="min-h-[400px] flex items-center justify-center">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-accent border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-xs font-bold tracking-[0.3em] uppercase text-foreground/50">
                  Searching AI Catalog...
                </p>
              </div>
            </div>
          ) : filteredProductsWithScores.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProductsWithScores.map(({ product, matchTag }) => (
                <div key={product._id} className="relative group">
                  {matchTag && (
                    <div className="absolute top-2 right-2 z-30 bg-accent text-accent-content text-[8px] font-black uppercase px-2 py-0.5 rounded-full shadow-md backdrop-blur-md border border-accent-content/20 pointer-events-none">
                      {matchTag}
                    </div>
                  )}
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-surface/50 border border-dashed border-border-theme rounded-3xl p-16 text-center">
              <i className="ri-sparkling-2-line text-5xl text-accent/30 mb-4 block"></i>
              <h3 className="text-xl font-bold">No matching drops found</h3>
              <p className="text-sm text-foreground/40 mt-1 mb-6">
                Try searching for related keywords like "sneakers", "hoodie", or clear parameters.
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
