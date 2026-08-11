import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useProduct } from "../Hooks/useProduct";
import { getSimilarProductsApi } from "../Services/product.api";
import { addToast } from "../../../utils/toast.slice";
import { useDispatch, useSelector } from "react-redux";
import { useCart } from "../../Cart/Hooks/useCart";
import { useWishlist } from "../../Wishlist/Hooks/useWishlist";
import { useUserActivity, useDwellTracker } from "../Hooks/useUserActivity";
import ProductCarousel from "../Components/ProductCarousel";
import ProductCard from "../Components/ProductCard";
import SingleProductSkeleton from "../Components/Skeletons/SingleProductSkeleton";
import ProductReviews from "../../Reviews/Components/ProductReviews";
import BannerCarousel from "../../Home/Components/BannerCarousel";
import { motion } from "framer-motion";

// Extracted page components + shared helpers (see ./SingleProduct/)
import ProductGallery from "./SingleProduct/Components/ProductGallery";
import ProductHeader from "./SingleProduct/Components/ProductHeader";
import PriceAndQuantity from "./SingleProduct/Components/PriceAndQuantity";
import AttributeSelector from "./SingleProduct/Components/AttributeSelector";
import BuyBox from "./SingleProduct/Components/BuyBox";
import SellerCard from "./SingleProduct/Components/SellerCard";
import TabsSection from "./SingleProduct/Components/TabsSection";
import {
  deriveVariantAttributes,
  adaptDescriptionHtmlToTheme,
  matchOptionInVariant,
  isColorAttribute,
  getActiveAttrVal,
} from "./SingleProduct/helpers";

const SingleProduct = () => {
  const { id: paramId, variantId: paramVariantId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { handleFetchSingleProduct, loading, error } = useProduct();

  const queryVariantId = searchParams.get("variant");
  const targetIdentifier = paramVariantId || queryVariantId || paramId;

  const [product, setProduct] = useState(null);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);

  // Active Gallery State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 0, y: 0 });

  // Selected Variant & Quantity State
  const [selectedVariant, setSelectedVariant] = useState(null);
  const [selectedAttributes, setSelectedAttributes] = useState({});
  const [quantity, setQuantity] = useState(1);

  // Active Specs Tab & Banner State
  const [activeTab, setActiveTab] = useState("specs");
  const [hasSidebarBanner, setHasSidebarBanner] = useState(false);

  const {
    trackView,
    recentlyViewed,
    fbtProducts,
    fetchRecentlyViewed,
    fetchFrequentlyBoughtTogether,
  } = useUserActivity();

  // Track page dwell time
  useDwellTracker(product?._id);

  const prodId = product?._id;

  // Track product view and fetch recommendations
  useEffect(() => {
    if (prodId) {
      trackView(prodId);
      fetchFrequentlyBoughtTogether(prodId);
      fetchRecentlyViewed(10);
    }
  }, [prodId]);

  // 📜 1. Always scroll to top when targetIdentifier changes or a new product is clicked
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [targetIdentifier]);

  // 🔄 2. Fetch Single Product Data & Synchronize Variant & Attributes
  useEffect(() => {
    let isMounted = true;
    if (targetIdentifier) {
      // Reset state immediately on new product load to avoid stale data from previous product
      setSelectedVariant(null);
      setSelectedAttributes({});
      setQuantity(1);

      handleFetchSingleProduct(targetIdentifier).then((res) => {
        if (isMounted && res) {
          setProduct(res);

          // In-stock default selection: land on an AVAILABLE option — if the
          // initially matched variant is out of stock, prefer the first
          // in-stock variant (or the color requested via ?color= from the
          // shop's per-color cards). Only when NOTHING is in stock do we fall
          // back to an out-of-stock variant (page then shows "Out of Stock").
          const hasStock = (v) =>
            (v.stock === undefined || Number(v.stock) > 0) && v.stockStatus !== "outofstock";

          const colorAttrName = (res.attributes || []).find((a) => /color/i.test(a.name || ""))?.name;

          // Find initial matched variant
          let matchedVar = null;

          if (res.selectedVariantId && res.variants?.length > 0) {
            matchedVar = res.variants.find((v) => String(v._id) === String(res.selectedVariantId));
          } else if (res.variants?.length > 0) {
            matchedVar = res.variants.find((v) => String(v._id) === String(targetIdentifier));

            if (!matchedVar) {
              const mainTags = res.tags || [];
              matchedVar =
                res.variants.find((v) => {
                  const vName = (v.name || "").toLowerCase();
                  return mainTags.some((tag) => vName.includes(tag.toLowerCase()));
                }) || res.variants[0];
            }

            const colorParam = searchParams.get("color");
            if (colorParam && colorAttrName) {
              // Shop per-color card → preselect that color (in-stock first)
              const coloredInStock = res.variants.find(
                (v) => hasStock(v) && matchOptionInVariant(v, colorAttrName, colorParam)
              );
              if (coloredInStock) matchedVar = coloredInStock;
              else {
                const coloredAny = res.variants.find((v) =>
                  matchOptionInVariant(v, colorAttrName, colorParam)
                );
                if (coloredAny) matchedVar = coloredAny;
              }
            } else if (!hasStock(matchedVar)) {
              const firstInStock = res.variants.find((v) => hasStock(v));
              if (firstInStock) matchedVar = firstInStock;
            }
          }

          setSelectedVariant(matchedVar);

          if (matchedVar) {
            const derivedAttrs = deriveVariantAttributes(matchedVar, res.attributes);
            setSelectedAttributes(derivedAttrs);
          } else {
            // Product has no variants: set default selected attributes from product.attributes
            const defaultAttrs = {};
            if (Array.isArray(res.attributes)) {
              res.attributes.forEach((attr) => {
                const name = attr.name || attr.key;
                const opts = attr.options || attr.values || [];
                if (name && opts.length > 0) {
                  defaultAttrs[name] = opts[0];
                }
              });
            }
            setSelectedAttributes(defaultAttrs);
          }
        }
      });
    }
    return () => {
      isMounted = false;
    };
  }, [targetIdentifier, handleFetchSingleProduct]);

  // Fetch Similar / Recommended Products
  useEffect(() => {
    if (product?._id) {
      setLoadingSimilar(true);
      getSimilarProductsApi(product._id)
        .then((res) => {
          if (res.success && res.data) {
            setSimilarProducts(res.data);
          }
        })
        .catch(() => {})
    }
  }, [product?._id]);

  // Dynamic SEO Meta Tags & Schema.org JSON-LD Generation for ScapeGoat
  useEffect(() => {
    if (product?.title) {
      const pageTitle = product.seo?.metaTitle || `${product.title} | ScapeGoat`;
      document.title = pageTitle;

      // Update meta description
      let metaDesc = document.querySelector('meta[name="description"]');
      if (!metaDesc) {
        metaDesc = document.createElement("meta");
        metaDesc.name = "description";
        document.head.appendChild(metaDesc);
      }
      metaDesc.content =
        product.seo?.metaDescription ||
        product.shortDescription ||
        product.description?.slice(0, 160) ||
        "Shop premium items on ScapeGoat.";

      // Inject Schema.org JSON-LD Product Structured Data
      const schemaData = {
        "@context": "https://schema.org/",
        "@type": "Product",
        "name": product.title,
        "image": product.images?.map((img) => img.url) || [],
        "description": product.description || product.shortDescription,
        "sku": product.sku || product._id,
        "brand": {
          "@type": "Brand",
          "name": product.brand?.name || "ScapeGoat",
        },
        "offers": {
          "@type": "Offer",
          "url": window.location.href,
          "priceCurrency": product.maxPrice?.currency || "INR",
          "price": product.sellingPrice?.amount || product.maxPrice?.amount || 0,
          "itemCondition": "https://schema.org/NewCondition",
          "availability":
            product.stockStatus === "instock"
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
      };

      let scriptTag = document.getElementById("scapegoat-jsonld-schema");
      if (!scriptTag) {
        scriptTag = document.createElement("script");
        scriptTag.id = "scapegoat-jsonld-schema";
        scriptTag.type = "application/ld+json";
        document.head.appendChild(scriptTag);
      }
      scriptTag.text = JSON.stringify(schemaData);
    }
  }, [product]);

  // 🎨 Sort & Merge Attributes so COLOR is ALWAYS rendered FIRST (position 0), and options from all variants are harvested!
  const sortedAttributes = useMemo(() => {
    if (!product) return [];

    const attrMap = new Map();

    const addOptionToAttrMap = (attrKey, rawVal) => {
      if (!attrKey || !rawVal) return;
      let existingKey = Array.from(attrMap.keys()).find(
        (mk) => mk.toLowerCase() === attrKey.toLowerCase()
      );
      if (!existingKey) {
        existingKey = attrKey;
        attrMap.set(existingKey, new Set());
      }

      const items = Array.isArray(rawVal) ? rawVal : [rawVal];
      items.forEach((item) => {
        if (!item) return;
        const parts = String(item).split(",");
        parts.forEach((p) => {
          const cleaned = p.trim();
          // Canonical UPPERCASE: dedupes "XL"/"xl" into one chip and matches
          // the new uppercase storage standard
          if (cleaned) attrMap.get(existingKey).add(cleaned.toUpperCase());
        });
      });
    };

    // 1. Add root product attributes
    if (Array.isArray(product.attributes)) {
      product.attributes.forEach((attr) => {
        const name = attr.name || attr.key;
        if (!name) return;
        const options = Array.isArray(attr.options || attr.values) ? attr.options || attr.values : [];
        options.forEach((opt) => addOptionToAttrMap(name, opt));
      });
    }

    // 2. Harvest options from all variants' attributes map/object & dynamicAttributes array
    if (Array.isArray(product.variants)) {
      product.variants.forEach((v) => {
        // 2a. From raw attributes map/object
        const raw = v.attributes instanceof Map
          ? Object.fromEntries(v.attributes)
          : (v.attributes?._doc || v.attributes || {});

        Object.entries(raw).forEach(([k, val]) => {
          addOptionToAttrMap(k, val);
        });

        // 2b. From dynamicAttributes array
        if (Array.isArray(v.dynamicAttributes)) {
          v.dynamicAttributes.forEach((da) => {
            const k = da.key || da.name;
            if (!k) return;
            const vals = da.values || da.options || (da.value ? [da.value] : []);
            vals.forEach((vItem) => addOptionToAttrMap(k, vItem));
          });
        }
      });
    }

    // Convert Map back to array format
    const combinedAttrs = Array.from(attrMap.entries()).map(([name, optSet]) => ({
      name,
      options: Array.from(optSet),
    }));

    // Sort so Color / Colour is ALWAYS rendered FIRST!
    return combinedAttrs.sort((a, b) => {
      const aIsColor = isColorAttribute(a.name);
      const bIsColor = isColorAttribute(b.name);
      if (aIsColor && !bIsColor) return -1;
      if (!aIsColor && bIsColor) return 1;
      return 0;
    });
  }, [product]);

  // 📸 Gallery Images Logic (Smart Variant & Sister-Variant Color Image Inheritance & Positional Fallback)
  const galleryImages = useMemo(() => {
    const activeColor = getActiveAttrVal(selectedAttributes, "Color");
    const colorAttr = sortedAttributes.find((a) => (a.name || a.key || "").toLowerCase().includes("color"));
    const colorOpts = colorAttr?.options || [];
    const colorIndex = activeColor
      ? colorOpts.findIndex((opt) => String(opt).trim().toLowerCase() === String(activeColor).trim().toLowerCase())
      : -1;

    // 1. Direct images on currently selected variant if it has images and matches active color
    if (selectedVariant?.images?.length > 0) {
      const vColorMatch = !activeColor || matchOptionInVariant(selectedVariant, "Color", activeColor);
      if (vColorMatch) {
        const vImgs = selectedVariant.images.map((img) => img?.url).filter(Boolean);
        if (vImgs.length > 0) return vImgs;
      }
    }

    // 2. Sister variant matching active color with custom images
    if (activeColor && product?.variants?.length > 0) {
      const colorSister = product.variants.find((v) => {
        const hasColorMatch = matchOptionInVariant(v, "Color", activeColor);
        return hasColorMatch && v.images?.length > 0;
      });

      if (colorSister?.images?.length > 0) {
        const sisterImgs = colorSister.images.map((img) => img?.url).filter(Boolean);
        if (sisterImgs.length > 0) return sisterImgs;
      }
    }

    // 3. Positional variant matching by color index if variants exist
    if (colorIndex >= 0 && product?.variants?.[colorIndex]?.images?.length > 0) {
      const posImgs = product.variants[colorIndex].images.map((img) => img?.url).filter(Boolean);
      if (posImgs.length > 0) return posImgs;
    }

    // 4. Main product images with color index swap
    if (product?.images?.length > 0) {
      if (colorIndex >= 0 && product.images[colorIndex]?.url) {
        const primaryUrl = product.images[colorIndex].url;
        const remaining = product.images
          .map((img) => img?.url)
          .filter((url) => url && url !== primaryUrl);
        return [primaryUrl, ...remaining];
      }
      const pImgs = product.images.map((img) => img?.url).filter(Boolean);
      if (pImgs.length > 0) return pImgs;
    }

    // 5. Ultimate fallback: Use selectedVariant.images or first variant with images
    if (selectedVariant?.images?.length > 0) {
      const vImgs = selectedVariant.images.map((img) => img?.url).filter(Boolean);
      if (vImgs.length > 0) return vImgs;
    }

    if (product?.variants?.length > 0) {
      const firstVarWithImgs = product.variants.find((v) => v.images?.length > 0);
      if (firstVarWithImgs?.images?.length > 0) {
        return firstVarWithImgs.images.map((img) => img?.url).filter(Boolean);
      }
    }

    return ["https://via.placeholder.com/600x600?text=No+Image"];
  }, [selectedVariant, selectedAttributes, product, sortedAttributes]);

  // Reset active image index when selected variant or gallery changes
  useEffect(() => {
    setActiveImageIndex(0);
  }, [galleryImages, selectedVariant?._id]);

  // Helper to check if an attribute option is available & in-stock for the currently selected color
  const isOptionAvailable = (attrName, optionValue) => {
    if (!product?.variants || product.variants.length === 0) return true;

    const attrNameLower = attrName.toLowerCase();
    const isColorAttr = attrNameLower.includes("color");

    return product.variants.some((v) => {
      // 1. Stock Check: Variant must have stock > 0 & stockStatus !== "outofstock"
      const hasStock = (v.stock === undefined || Number(v.stock) > 0) && v.stockStatus !== "outofstock";
      if (!hasStock) return false;

      // 2. Must match target attribute option (e.g. Size: "S" or Color: "White")
      const matchesTarget = matchOptionInVariant(v, attrName, optionValue);
      if (!matchesTarget) return false;

      // Color swatches are available as long as ANY in-stock variant exists for this color
      if (isColorAttr) return true;

      // For size/other attributes, strictly check if a variant exists that matches BOTH this size AND the active Color
      const activeColor = getActiveAttrVal(selectedAttributes, "Color");
      if (activeColor) {
        return matchOptionInVariant(v, "Color", activeColor) || matchOptionInVariant(v, "color", activeColor);
      }

      return true;
    });
  };

  // 🔀 Handle Attribute Selection & Synchronize Variant & Photos
  const handleSelectAttributeOption = (attrName, optionValue) => {
    const newAttrs = { ...selectedAttributes };

    const existingKey = Object.keys(newAttrs).find(
      (k) => k.toLowerCase() === attrName.toLowerCase()
    ) || attrName;

    newAttrs[existingKey] = optionValue;

    if (product?.variants?.length > 0) {
      // 1. Try finding exact IN-STOCK variant matching ALL new attributes
      let matched = product.variants.find((v) => {
        const hasStock = (v.stock === undefined || Number(v.stock) > 0) && v.stockStatus !== "outofstock";
        if (!hasStock) return false;

        return Object.entries(newAttrs).every(([k, val]) => {
          if (!val) return true;
          return matchOptionInVariant(v, k, val);
        });
      });

      if (matched) {
        setSelectedVariant(matched);
        setSelectedAttributes(newAttrs);
        setQuantity(1);
      } else {
        // 2. Fallback: Find ANY IN-STOCK variant matching the newly selected option (e.g. Color: "light blue")
        matched = product.variants.find((v) => {
          const hasStock = (v.stock === undefined || Number(v.stock) > 0) && v.stockStatus !== "outofstock";
          if (!hasStock) return false;
          return matchOptionInVariant(v, attrName, optionValue);
        });

        // 3. Ultimate fallback if all are out of stock
        if (!matched) {
          matched = product.variants.find((v) => matchOptionInVariant(v, attrName, optionValue));
        }

        if (matched) {
          setSelectedVariant(matched);
          const derived = deriveVariantAttributes(matched, product.attributes, { [existingKey]: optionValue });
          setSelectedAttributes(derived);
          setQuantity(1);
        } else {
          setSelectedAttributes(newAttrs);
        }
      }
    } else {
      setSelectedAttributes(newAttrs);
    }
  };

  // Pricing Logic (Variant vs Root Product)
  const currentPrice = useMemo(() => {
    if (selectedVariant?.price?.amount) {
      return Number(selectedVariant.price.amount);
    }
    if (selectedVariant?.priceAmount !== undefined && selectedVariant?.priceAmount !== "") {
      return Number(selectedVariant.priceAmount);
    }
    if (typeof selectedVariant?.price === "number") {
      return selectedVariant.price;
    }
    return product?.sellingPrice?.amount || product?.maxPrice?.amount || 0;
  }, [selectedVariant, product]);

  const originalPrice = useMemo(() => {
    return product?.maxPrice?.amount || currentPrice;
  }, [product, currentPrice]);

  const discountPercent = useMemo(() => {
    if (originalPrice > currentPrice) {
      return Math.round(((originalPrice - currentPrice) / originalPrice) * 100);
    }
    return 0;
  }, [originalPrice, currentPrice]);

  // Stock Calculation
  const currentStock = useMemo(() => {
    if (selectedVariant && typeof selectedVariant.stock === "number") {
      return selectedVariant.stock;
    }
    return typeof product?.stock === "number" ? product.stock : 0;
  }, [selectedVariant, product]);

  const isOutOfStock = currentStock <= 0 || product?.stockStatus === "outofstock";

  // Mouse move zoom effect handler
  const handleMouseMoveZoom = (e) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const { handleAddToCart: addToCartFn } = useCart();
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Add to Cart Action with Product Drop Animation
  const handleAddToCart = async () => {
    if (isOutOfStock || isAddingToCart) return;
    setIsAddingToCart(true);
    await addToCartFn(product, quantity, selectedVariant?._id, selectedAttributes);
    setTimeout(() => {
      setIsAddingToCart(false);
    }, 1600);
  };

  // Buy Now Action
  const handleBuyNow = async () => {
    if (isOutOfStock) return;
    await addToCartFn(product, quantity, selectedVariant?._id, selectedAttributes);
    navigate("/cart");
  };

  // Wishlist Action
  const user = useSelector((state) => state.auth?.user);
  const { toggleWishlist } = useWishlist();
  const wishlist = useSelector((state) => state.wishlist?.wishlist);
  const isWishlisted = Boolean(
    wishlist?.products?.some((p) => {
      const id = typeof p === "object" ? p?._id || p?.id : p;
      return String(id) === String(product?._id);
    })
  );

  const handleToggleWishlist = async (e) => {
    e?.stopPropagation?.();
    if (!user) {
      dispatch(addToast({ message: "Please log in to save to wishlist", type: "info" }));
      navigate("/login");
      return;
    }
    if (product?._id) {
      await toggleWishlist(product._id);
    }
  };

  // Loading Skeleton State
  if (loading && !product) {
    return <SingleProductSkeleton />;
  }

  if (error || (!loading && !product)) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-6">
        <div className="w-20 h-20 bg-red-500/10 text-red-500 rounded-full flex items-center justify-center mx-auto text-3xl font-extrabold border border-red-500/20">
          ⚠️
        </div>
        <h1 className="text-2xl font-extrabold text-foreground">Product Not Found</h1>
        <p className="text-xs text-foreground/60">
          The requested product or variant could not be retrieved. It may have been unlisted or removed.
        </p>
        <button
          onClick={() => navigate("/")}
          className="px-6 py-3 rounded-xl bg-accent text-accent-content font-extrabold text-xs shadow hover:opacity-90 transition cursor-pointer"
        >
          ← Return to Marketplace
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-12 pb-20 selection:bg-accent selection:text-accent-content">
      {/* ── Product Page Hero Carousel Banner ── */}
      <BannerCarousel page="product" placement="hero" />

      {/* ── Breadcrumb Header ── */}
      <nav className="flex items-center space-x-2 text-xs font-semibold text-foreground/50 border-b border-border-theme pb-4">
        <Link to="/" className="hover:text-accent transition">
          Home
        </Link>
        <span>/</span>
        {product.category && (
          <>
            <span className="hover:text-accent transition">
              {product.category.name}
            </span>
            <span>/</span>
          </>
        )}
        <span className="text-foreground font-bold truncate max-w-xs">
          {product.title}
        </span>
      </nav>

      {/* ── Main Product Display Grid ── */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        {/* 📸 LEFT COLUMN: Gallery & Interactive Zoom (6 cols) */}
        <ProductGallery
          product={product}
          galleryImages={galleryImages}
          activeImageIndex={activeImageIndex}
          setActiveImageIndex={setActiveImageIndex}
          isZoomed={isZoomed}
          setIsZoomed={setIsZoomed}
          zoomPos={zoomPos}
          handleMouseMoveZoom={handleMouseMoveZoom}
          discountPercent={discountPercent}
          isWishlisted={isWishlisted}
          handleToggleWishlist={handleToggleWishlist}
        />

        {/* 🛍️ RIGHT COLUMN: Product Specifications & Order Box (6 cols) */}
        <div className="lg:col-span-6 space-y-8">
          {/* Header Title & Badges */}
          <ProductHeader product={product} isOutOfStock={isOutOfStock} currentStock={currentStock} />

          {/* Price Card + Quantity */}
          <PriceAndQuantity
            currentPrice={currentPrice}
            originalPrice={originalPrice}
            currentStock={currentStock}
            quantity={quantity}
            setQuantity={setQuantity}
            isOutOfStock={isOutOfStock}
          />

          {/* Dynamic Attribute Selectors */}
          <AttributeSelector
            sortedAttributes={sortedAttributes}
            selectedAttributes={selectedAttributes}
            selectedVariant={selectedVariant}
            product={product}
            isOptionAvailable={isOptionAvailable}
            onSelectOption={handleSelectAttributeOption}
          />

          {/* ⚡ Action Buttons (Add to Cart, Buy Now & Wishlist) */}
          <BuyBox
            isOutOfStock={isOutOfStock}
            isAddingToCart={isAddingToCart}
            handleAddToCart={handleAddToCart}
            handleBuyNow={handleBuyNow}
            isWishlisted={isWishlisted}
            handleToggleWishlist={handleToggleWishlist}
          />

          {/* Seller Trust Badge */}
          <SellerCard seller={product.seller} />
        </div>
      </div>

      {/* ── Product Specifications & Details Tabs ── */}
      <TabsSection product={product} activeTab={activeTab} setActiveTab={setActiveTab} />


      {/* Product Page Inline Banner — Rendered after Description */}
      <BannerCarousel page="product" placement="inline" />

      {/* ── 🛒 Frequently Bought Together ── */}
      {fbtProducts && fbtProducts.length > 0 && (
        <div className="pt-8">
          <ProductCarousel
            badge="Co-Purchased"
            title="Frequently Bought Together"
            subtitle="Products commonly purchased alongside this item."
            products={fbtProducts}
            onViewAll={() => navigate("/shop")}
          />
        </div>
      )}

      {/* ── AI Similar / "You May Also Like" Vector Recommendation Grid ── */}
      {similarProducts.length > 0 && (
        <div className="space-y-6 pt-6">
          <div className="flex items-center justify-between border-b border-border-theme pb-4">
            <div>
              <span className="text-[10px] font-black tracking-[0.35em] uppercase text-accent mb-1 flex items-center gap-1.5">
                <i className="ri-cpu-line text-sm text-accent" />
                512-D VECTOR EMBEDDINGS
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-foreground flex items-center gap-2">
                <i className="ri-sparkling-fill text-accent" />
                AI Visual & Similar Recommendations
              </h2>
              <p className="text-xs text-foreground/60 mt-1 font-medium leading-relaxed">
                Items matched using 512-dimensional visual CLIP vector embeddings.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {similarProducts.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </div>
      )}

      {/* ── 🕒 Recently Visited Slider ── */}
      {recentlyViewed && recentlyViewed.length > 0 && (
        <div className="pt-8">
          <ProductCarousel
            badge="Jump Back In"
            title="Recently Visited"
            subtitle="Products you were checking out earlier."
            products={recentlyViewed}
            onViewAll={() => navigate("/shop?filter=recently-viewed")}
          />
        </div>
      )}

      {/* ── 📝 Full Product Description (below recently viewed, above reviews) ── */}
      <div className="bg-background border border-border-theme rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm">
        <h2 className="text-xl sm:text-2xl font-black tracking-tighter text-foreground flex items-center gap-2">
          <i className="ri-file-text-line text-accent" />
          <span>Product Description</span>
        </h2>
        <div
          dangerouslySetInnerHTML={{ __html: adaptDescriptionHtmlToTheme(product.description || "No full description provided for this product.") }}
          className="rich-description-render max-w-none text-xs sm:text-sm leading-relaxed space-y-4"
        />
      </div>

      {/* ── 🌟 Customer Ratings & Reviews Section with Conditional Sidebar Banner ── */}
      <div className="flex flex-col lg:flex-row items-start gap-8">
        <div className="flex-1 w-full min-w-0">
          <ProductReviews productId={product._id} sellerId={product.seller?._id || product.seller} />
        </div>

        <div className={hasSidebarBanner ? "w-full lg:w-[360px] shrink-0 sticky top-24" : "hidden"}>
          <BannerCarousel
            page="product"
            placement="sidebar"
            onBannerCountChange={(count) => setHasSidebarBanner(count > 0)}
          />
        </div>
      </div>
    </div>
  );
};

export default SingleProduct;
