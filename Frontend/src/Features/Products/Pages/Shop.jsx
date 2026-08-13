import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useSelector } from "react-redux";
import { useSearchParams } from "react-router-dom";
import { useUserActivity } from "../Hooks/useUserActivity";
import ProductCard from "../Components/ProductCard";
import ProductGridSkeleton from "../Components/Skeletons/ProductGridSkeleton";
import { useDebounce } from "../../../utils/timingUtils";
import { useInfiniteScroll } from "../../../utils/useInfiniteScroll";
import { aiSearchProductsApi, getAllProductsApi, getProductFacetsApi } from "../Services/product.api";
import { trackSearchApi } from "../Services/activity.api";
import BannerCarousel from "../../Home/Components/BannerCarousel";

// Transient session key for visual-search results (the query image itself is
// never persisted — see Shared/VisualSearch/VisualSearchModal.jsx)
const VISUAL_SESSION_KEY = "scapegoatVisualResults";

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

// ── Attribute value collector ─────────────────────────────────────────────────
// Collects a product's Color/Size values from BOTH top-level attributes (a
// product may have attributes but no variants — same price/stock for all) AND
// variant attributes. Values are uppercased so filtering is consistent no
// matter how the values were stored.
const collectProductAttrValues = (p, key) => {
  const out = new Set();
  const k = String(key).toLowerCase();

  // Top-level attributes: [{ name, options: [...] }]
  (p.attributes || []).forEach((attr) => {
    const name = String(attr.name || attr.key || "").toLowerCase();
    if (name !== k) return;
    const vals = attr.options || attr.values || (attr.value ? [attr.value] : []);
    vals.forEach((v) => {
      if (v !== undefined && v !== null && String(v).trim() !== "") out.add(String(v).trim().toUpperCase());
    });
  });

  // Variant attributes: map/object + dynamicAttributes
  (p.variants || []).forEach((v) => {
    if (v.attributes) {
      const raw =
        typeof v.attributes.forEach === "function"
          ? Object.fromEntries(v.attributes)
          : v.attributes._doc || v.attributes;
      if (raw) {
        Object.entries(raw).forEach(([kk, vv]) => {
          if (String(kk).toLowerCase() !== k) return;
          const vals = Array.isArray(vv) ? vv : [vv];
          vals.forEach((val) => {
            if (val !== undefined && val !== null && String(val).trim() !== "") out.add(String(val).trim().toUpperCase());
          });
        });
      }
    }
    (v.dynamicAttributes || []).forEach((da) => {
      const dk = String(da.key || da.name || "").toLowerCase();
      const vals = da.values || da.options || (da.value ? [da.value] : []);
      if (dk === k) {
        vals.forEach((val) => {
          if (val !== undefined && val !== null && String(val).trim() !== "") out.add(String(val).trim().toUpperCase());
        });
      }
    });
  });

  return Array.from(out);
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
  userPickedSortRef,
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
        onChange={(e) => {
          userPickedSortRef.current = true;
          setSortBy(e.target.value);
        }}
        className="w-full bg-surface border border-border-theme/50 rounded-xl px-3 py-2 text-xs font-bold text-foreground focus:outline-none focus:border-accent"
      >
        {debouncedSearchQuery && <option value="relevance">Best Match</option>}
        {!debouncedSearchQuery && <option value="personalized">Personalized</option>}
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

// Expand products into display units: a product whose variants carry DIFFERENT
// colors (each with its own images) shows one card per color — e.g. a product
// with Red (main) + Blue (variant) appears as two cards, each linking to the
// product page with that color preselected.
const expandProductColorUnits = (products) => {
  const units = [];
  for (const p of products || []) {
    const colorAttr = (p.attributes || []).find((a) => /color/i.test(a.name || ""));
    if (!colorAttr) {
      units.push({ product: p, color: null, image: "", key: `${p._id}` });
      continue;
    }
    const colorGroups = new Map();
    (p.variants || []).forEach((v) => {
      const raw = v.attributes || {};
      const val = typeof raw.get === "function" ? raw.get("Color") : raw.Color || raw.color;
      if (!val) return;
      const key = String(val).toLowerCase();
      if (!colorGroups.has(key)) {
        colorGroups.set(key, { value: String(val), image: "" });
      }
      // Prefer a variant that actually HAS images (the first variant of a
      // color may be image-less while a later size carries the photos)
      const grp = colorGroups.get(key);
      if (!grp.image) {
        const img = Array.isArray(v.images) && v.images[0] ? v.images[0].url || v.images[0] : "";
        if (img) grp.image = img;
      }
    });
    if (colorGroups.size > 1) {
      colorGroups.forEach((g) => {
        units.push({
          product: p,
          color: g.value,
          image: g.image,
          key: `${p._id}:${g.value.toLowerCase()}`,
        });
      });
    } else {
      units.push({ product: p, color: null, image: "", key: `${p._id}` });
    }
  }
  return units;
};

// ── Main Shop Page Component ──────────────────────────────────────────────────
const Shop = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const initialSort = searchParams.get("sortBy") || (searchParams.get("q") ? "relevance" : "personalized");
  const initialFilter = searchParams.get("filter") || "";

  const { loading } = useSelector((state) => state.product);
  const { recentlyViewed, forYouProducts, fetchRecentlyViewed, fetchForYou } = useUserActivity();

  const [rawSearchQuery, setRawSearchQuery] = useState(initialQuery);

  // ── Visual (image) search mode ─────────────────────────────────────────────
  // The query image is NEVER persisted — only the matched products are kept
  // transiently in sessionStorage by the VisualSearchModal.
  const [visualResults, setVisualResults] = useState(null);

  // Activate visual results whenever the URL carries ?visual=1 — including when
  // the user is ALREADY on the shop page (e.g. after a text search/filters):
  // clear the stale search + filters so the image matches are what's shown.
  useEffect(() => {
    if (searchParams.get("visual") === "1") {
      try {
        const raw = sessionStorage.getItem(VISUAL_SESSION_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setVisualResults(parsed);
            setRawSearchQuery("");
            setAiVectorResults(null);
            setSelectedCategories([]);
            setSelectedBrands([]);
            setSelectedColors([]);
            setSelectedSizes([]);
            setPriceLow(0);
            setPriceHigh(50000);
          }
        }
      } catch (err) {
        /* ignore malformed session */
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const clearVisualResults = () => {
    sessionStorage.removeItem(VISUAL_SESSION_KEY);
    setVisualResults(null);
    const params = new URLSearchParams(searchParams);
    params.delete("visual");
    setSearchParams(params, { replace: true });
  };

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

  // Filter states — initialized from the URL so a shared link restores the view
  const initialCategories = (searchParams.get("categories") || "").split(",").filter(Boolean);
  const initialBrands = (searchParams.get("brands") || "").split(",").filter(Boolean);
  const initialColors = (searchParams.get("color") || "").split(",").filter(Boolean);
  const initialSizes = (searchParams.get("size") || "").split(",").filter(Boolean);
  const [selectedCategories, setSelectedCategories] = useState(initialCategories);
  const [selectedBrands, setSelectedBrands] = useState(initialBrands);
  const [selectedColors, setSelectedColors] = useState(initialColors);
  const [selectedSizes, setSelectedSizes] = useState(initialSizes);
  const [priceLow, setPriceLow] = useState(parseInt(searchParams.get("minPrice") || "0", 10));
  const [priceHigh, setPriceHigh] = useState(parseInt(searchParams.get("maxPrice") || "50000", 10));
  const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);
  const [sortBy, setSortBy] = useState(initialSort);
  const userPickedSort = useRef(false); // true once the user picks a sort manually

  // ── Real server-side pagination (20 per page) ─────────────────────────────
  const PAGE_SIZE = 20;
  // Facet values come from the server (aggregation) so they always reflect the
  // FULL catalog/category scope — independent of pagination.
  const [filterOptions, setFilterOptions] = useState({
    categories: [],
    brands: [],
    colors: [],
    sizes: [],
    minPrice: 0,
    maxPrice: 50000,
  });

  // ── URL ↔ filter sync ──────────────────────────────────────────────────────
  // Active filters/search/sort are mirrored into the URL (replace:true) — so
  // removing a filter also removes its param, and a shared link restores the
  // exact view. Param names match the backend (categories/brands/color/size/
  // minPrice/maxPrice/q/sortBy).
  useEffect(() => {
    const params = new URLSearchParams();
    const q = rawSearchQuery.trim();
    if (q) params.set("q", q);
    if (sortBy && sortBy !== "personalized") params.set("sortBy", sortBy);
    if (selectedCategories.length) params.set("categories", selectedCategories.join(","));
    if (selectedBrands.length) params.set("brands", selectedBrands.join(","));
    if (selectedColors.length) params.set("color", selectedColors.join(","));
    if (selectedSizes.length) params.set("size", selectedSizes.join(","));
    const priceNarrowed =
      priceLow > filterOptions.minPrice || priceHigh < filterOptions.maxPrice;
    if (priceNarrowed) {
      if (priceLow > filterOptions.minPrice) params.set("minPrice", String(priceLow));
      if (priceHigh < filterOptions.maxPrice) params.set("maxPrice", String(priceHigh));
    }
    if (visualResults) params.set("visual", "1");
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawSearchQuery, sortBy, selectedCategories, selectedBrands, selectedColors, selectedSizes, priceLow, priceHigh, visualResults, filterOptions]);
  const [shopProducts, setShopProducts] = useState([]);
  const [shopTotal, setShopTotal] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMorePages, setHasMorePages] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [shopLoading, setShopLoading] = useState(true);
  const fetchSeqRef = useRef(0); // stale-response guard
  const pageRef = useRef(1);     // page tracking without re-creating the callback

  const hasShopFetchedRef = useRef(false);

  const buildShopParams = useCallback(
    (page) => {
      const params = { page, limit: PAGE_SIZE };
      // Server-side sort mapping ("newest" = createdAt desc = server default)
      if (sortBy === "price-asc") params.sort = "price_asc";
      else if (sortBy === "price-desc") params.sort = "price_desc";
      else if (sortBy === "oldest") params.sort = "oldest";

      if (selectedCategories.length) params.categories = selectedCategories.join(",");
      if (selectedBrands.length) params.brands = selectedBrands.join(",");
      if (selectedColors.length) params.color = selectedColors.join(",");
      if (selectedSizes.length) params.size = selectedSizes.join(",");
      // Send the price range ONLY when the user actually narrowed it — the
      // facets auto-sync the slider to the catalog bounds, which is not a filter.
      const priceNarrowed = priceLow > filterOptions.minPrice || priceHigh < filterOptions.maxPrice;
      if (priceNarrowed) {
        if (priceLow > filterOptions.minPrice) params.minPrice = priceLow;
        if (priceHigh < filterOptions.maxPrice) params.maxPrice = priceHigh;
      }
      // "Personalized" (the default sort) = the activity-ranked feed. Any
      // explicit filter or sort takes over.
      const noFilters =
        !selectedCategories.length &&
        !selectedBrands.length &&
        !selectedColors.length &&
        !selectedSizes.length &&
        !priceNarrowed;
      if (sortBy === "personalized" && noFilters) params.personalized = 1;
      return params;
    },
    [sortBy, selectedCategories, selectedBrands, selectedColors, selectedSizes, priceLow, priceHigh, filterOptions]
  );

  // Fetch a page; reset=true starts a fresh list (filters/sort changed),
  // reset=false appends the next page (infinite scroll).
  const fetchShopPage = useCallback(
    async (reset) => {
      const isSearchActive = Boolean(debouncedSearchQuery && debouncedSearchQuery.trim());
      const isActivityPool =
        (initialFilter === "recently-viewed" && recentlyViewed.length > 0) ||
        (initialFilter === "for-you" && forYouProducts.length > 0);
      // Search results (AI) and activity pools are fetched by their own flows
      if (isSearchActive || isActivityPool) return;

      const nextPage = reset ? 1 : pageRef.current + 1;
      const seq = ++fetchSeqRef.current;
      if (reset) setShopLoading(true);
      else setFetchingMore(true);
      try {
        const res = await getAllProductsApi(buildShopParams(nextPage));
        if (seq !== fetchSeqRef.current) return; // stale response
        const list = res?.data || [];
        setShopProducts((prev) => (reset ? list : [...prev, ...list]));
        setShopTotal(res?.total || list.length);
        setCurrentPage(res?.page || nextPage);
        pageRef.current = res?.page || nextPage;
        setHasMorePages(Boolean(res?.data && res.page < res.pages));
      } catch (err) {
        if (seq === fetchSeqRef.current) {
          console.warn("[Shop] paginated fetch error:", err?.message);
          setHasMorePages(false);
        }
      } finally {
        if (seq === fetchSeqRef.current) {
          setFetchingMore(false);
          setShopLoading(false);
        }
      }
    },
    [buildShopParams, debouncedSearchQuery, initialFilter, recentlyViewed.length, forYouProducts.length]
  );

  useEffect(() => {
    if (!hasShopFetchedRef.current) {
      hasShopFetchedRef.current = true;
      fetchShopPage(true);
      if (initialFilter === "recently-viewed") fetchRecentlyViewed(20);
      if (initialFilter === "for-you") fetchForYou(20);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialFilter]);

  // Refetch page 1 whenever search/filters/sort change
  useEffect(() => {
    fetchShopPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearchQuery, selectedCategories, selectedBrands, selectedColors, selectedSizes, priceLow, priceHigh, sortBy]);

  // Execute Backend Vector Search API using text embeddings
  useEffect(() => {
    if (!debouncedSearchQuery || !debouncedSearchQuery.trim()) {
      setAiVectorResults(null);
      return;
    }

    let isMounted = true;
    setIsAiLoading(true);

    // Personalization signal: remember what this visitor searches for
    if (debouncedSearchQuery.trim().length >= 3) {
      trackSearchApi(debouncedSearchQuery.trim());
    }

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

  // When a search starts (typed on the shop page, no ?q= URL), flip the default
  // sort to Best Match — unless the user explicitly picked a sort.
  useEffect(() => {
    if (debouncedSearchQuery?.trim() && !userPickedSort.current && sortBy === "newest") {
      setSortBy("relevance");
    }
  }, [debouncedSearchQuery, sortBy]);

  // Facet fetch effect — runs whenever the category/brand scope changes
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const params = {};
        if (selectedCategories.length) params.categories = selectedCategories.join(",");
        if (selectedBrands.length) params.brands = selectedBrands.join(",");
        const res = await getProductFacetsApi(params);
        if (isMounted && res?.data) {
          const f = res.data;
          setFilterOptions({
            categories: f.categories || [],
            brands: f.brands || [],
            colors: f.colors || [],
            sizes: f.sizes || [],
            minPrice: f.minPrice || 0,
            maxPrice: f.maxPrice || 50000,
          });
        }
      } catch (err) {
        console.warn("[Shop] facets fetch error:", err?.message);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [selectedCategories, selectedBrands]);

  // Sync the price-slider display to the catalog bounds — only while the user
  // hasn't narrowed the price themselves (placeholder default is 50000). Runs
  // AFTER the facets state lands so the fetch never sees a half-updated pair.
  useEffect(() => {
    setPriceHigh((prev) => (prev >= 50000 ? filterOptions.maxPrice : prev));
  }, [filterOptions.maxPrice]);

  const toggleItem = (setter, value) =>
    setter((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  // AI Semantic + Vector Embedding Filter & Sort algorithm
  const filteredProducts = useMemo(() => {
    if (!shopProducts) return [];

    let pool = shopProducts;
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

      const pColors = collectProductAttrValues(p, "color");
      const pSizes = collectProductAttrValues(p, "size");

      const matchColor = !selectedColors.length || pColors.some((c) => selectedColors.includes(c));
      const matchSize = !selectedSizes.length || pSizes.some((s) => selectedSizes.includes(s));

      return matchCat && matchBrand && matchPrice && matchColor && matchSize;
    });

    const getPrice = (prod) =>
      prod.sellingPrice?.amount || prod.maxPrice?.amount || prod.price?.saleAmount || prod.price?.amount || 0;

    if (isSearchActive && sortBy === "relevance") {
      if (aiVectorResults && aiVectorResults.length > 0) {
        // Preserve the backend's semantic similarity order verbatim
        // (the navbar dropdown + shop must show the same ranking)
        const order = new Map(aiVectorResults.map((p, i) => [String(p._id), i]));
        result.sort(
          (a, b) =>
            (order.get(String(a.product._id)) ?? 999) -
            (order.get(String(b.product._id)) ?? 999)
        );
      } else {
        result.sort((a, b) => b.score - a.score);
      }
    } else if (sortBy === "price-asc") {
      result.sort((a, b) => getPrice(a.product) - getPrice(b.product));
    } else if (sortBy === "price-desc") {
      result.sort((a, b) => getPrice(b.product) - getPrice(a.product));
    } else {
      result.sort((a, b) => new Date(b.product.createdAt) - new Date(a.product.createdAt));
    }

    return result.map((item) => item.product);
  }, [
    shopProducts,
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

  // Reset pagination count when search/filters change (handled by the refetch
  // effect above — this hook keeps the sentinel/state consistent)
  const loadMoreProducts = useCallback(() => {
    if (fetchingMore || !hasMorePages) return;
    fetchShopPage(false);
  }, [fetchingMore, hasMorePages, fetchShopPage]);

  const hasMore = hasMorePages;
  const sentinelRef = useInfiniteScroll(loadMoreProducts, hasMore, loading || isAiLoading || fetchingMore);

  const displayedProducts = useMemo(() => {
    // Visual mode: the backend already ranked by similarity — keep its order
    if (visualResults) return visualResults;
    return filteredProducts;
  }, [filteredProducts, visualResults]);

  // Color-expanded display units for the grid (one card per color variant)
  const displayedUnits = useMemo(() => expandProductColorUnits(displayedProducts), [displayedProducts]);

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
    userPickedSortRef: userPickedSort,
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
            Showing <span className="text-foreground font-black">{displayedProducts.length}</span> of {shopTotal || filteredProducts.length} Drops
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
        {/* Desktop Sidebar — sticky while the grid scrolls */}
        <div className="hidden md:block w-64 flex-shrink-0 sticky top-24 self-start max-h-[calc(100vh-7rem)] overflow-y-auto pr-1 space-y-6">
          <FilterSidebarContent {...sidebarProps} />
          <BannerCarousel page="shop" placement="sidebar" />
        </div>

        {/* Mobile Filter Drawer — slides in like the cart drawer */}
        {createPortal(
          <AnimatePresence>
            {isMobileFilterOpen && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsMobileFilterOpen(false)}
                  className="fixed inset-0 z-[1200] bg-black/60 backdrop-blur-md md:hidden"
                />
                <motion.div
                  initial={{ x: "100%" }}
                  animate={{ x: 0 }}
                  exit={{ x: "100%" }}
                  transition={{ type: "spring", stiffness: 300, damping: 32 }}
                  className="fixed top-0 right-0 z-[1201] bg-background w-[85%] max-w-sm h-full p-6 overflow-y-auto shadow-2xl border-l border-border-theme md:hidden"
                >
                  <FilterSidebarContent {...sidebarProps} />
                </motion.div>
              </>
            )}
          </AnimatePresence>,
          document.body
        )}

        {/* Product Grid with Infinite Scroll */}
        <div className="flex-1">
          {visualResults && (
            <div className="mb-5 flex items-center justify-between gap-3 rounded-2xl border border-accent/30 bg-accent/5 px-4 py-3">
              <div className="flex items-center gap-2 min-w-0">
                <i className="ri-camera-lens-line text-accent text-lg shrink-0" />
                <p className="text-xs font-black uppercase tracking-widest text-accent truncate">
                  Visual Search Results — {visualResults.length}{" "}
                  {visualResults.length === 1 ? "match" : "matches"}
                </p>
              </div>
              <button
                type="button"
                onClick={clearVisualResults}
                className="shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-surface border border-border-theme text-[10px] font-bold uppercase tracking-widest text-foreground/70 hover:text-red-400 hover:border-red-500/40 transition cursor-pointer"
              >
                <i className="ri-close-line text-xs" />
                Clear
              </button>
            </div>
          )}
          {shopLoading && shopProducts.length === 0 ? (
            <ProductGridSkeleton count={8} />
          ) : displayedProducts.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(150px,176px))] gap-4">
                {displayedUnits.map((unit) => (
                  <ProductCard
                    key={unit.key}
                    product={unit.product}
                    imageOverride={unit.image}
                    colorLabel={unit.color}
                    colorParam={unit.color}
                  />
                ))}
              </div>

              {/* Infinite Scroll Sentinel Element */}
              <div ref={sentinelRef} className="w-full py-8 flex items-center justify-center min-h-[60px]">
                {!visualResults && hasMore && (
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
