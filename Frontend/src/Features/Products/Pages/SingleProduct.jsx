import React, { useEffect, useState, useMemo } from "react";
import { useParams, useSearchParams, useNavigate, Link } from "react-router-dom";
import { useProduct } from "../Hooks/useProduct";
import { getSimilarProductsApi } from "../Services/product.api";
import { addToast } from "../../../utils/toast.slice";
import { useDispatch, useSelector } from "react-redux";
import { useCart } from "../../Cart/Hooks/useCart";
import { useWishlist } from "../../Wishlist/Hooks/useWishlist";
import { isColorAttribute } from "../../../utils/attributeUtils";
import { useUserActivity, useDwellTracker } from "../Hooks/useUserActivity";
import ProductCarousel from "../Components/ProductCarousel";
import ProductCard from "../Components/ProductCard";
import SingleProductSkeleton from "../Components/Skeletons/SingleProductSkeleton";
import ProductReviews from "../../Reviews/Components/ProductReviews";
import BannerCarousel from "../../Home/Components/BannerCarousel";
import { motion } from "framer-motion";

// Color name to Hex map for fallback swatches
const getColorHex = (colorName) => {
  if (!colorName) return null;
  const c = String(colorName).trim().toLowerCase();
  const colors = {
    white: "#ffffff",
    black: "#18181b",
    grey: "#6b7280",
    gray: "#6b7280",
    red: "#ef4444",
    blue: "#3b82f6",
    navy: "#1e3a8a",
    green: "#22c55e",
    yellow: "#eab308",
    pink: "#ec4899",
    purple: "#a855f7",
    orange: "#f97316",
    brown: "#78350f",
    beige: "#f5f5dc",
  };
  return colors[c] || null;
};

// Robust helper to check if a variant matches a specified attribute option
const matchOptionInVariant = (variant, attrName, optionValue) => {
  if (!variant || !optionValue) return false;
  const optLower = String(optionValue).trim().toLowerCase();
  const attrNameLower = String(attrName).trim().toLowerCase();

  // 1. Check raw attributes map/object (e.g. { Color: "light blue", Size: ["UK 6", "UK 7", "UK 8"] })
  const rawAttrs = variant.attributes instanceof Map
    ? Object.fromEntries(variant.attributes)
    : (variant.attributes?._doc || variant.attributes || {});

  for (const [k, v] of Object.entries(rawAttrs)) {
    if (String(k).trim().toLowerCase() === attrNameLower) {
      const items = Array.isArray(v) ? v : [v];
      const match = items.some((item) => {
        if (!item) return false;
        const parts = String(item).split(",");
        return parts.some((p) => p.trim().toLowerCase() === optLower);
      });
      if (match) return true;
    }
  }

  // 2. Check dynamicAttributes array if present on variant
  if (Array.isArray(variant.dynamicAttributes)) {
    for (const da of variant.dynamicAttributes) {
      const k = da.key || da.name;
      if (k && String(k).trim().toLowerCase() === attrNameLower) {
        const vals = da.values || da.options || (da.value ? [da.value] : []);
        const match = vals.some((v) => {
          if (!v) return false;
          const parts = String(v).split(",");
          return parts.some((p) => p.trim().toLowerCase() === optLower);
        });
        if (match) return true;
      }
    }
  }

  // 3. Fallback to token/word matching against variant.sku AND variant.name
  const textToSearch = `${variant.sku || ""} ${variant.name || ""}`.toLowerCase();
  const vTokens = textToSearch.split(/[\s/\-,_.]+/).filter(Boolean);

  // Exact token match (e.g. "s", "m", "l", "xl", "white", "grey", "red")
  if (vTokens.some((t) => t === optLower)) return true;

  // Multi-word match (e.g. "light blue" -> words ["light", "blue"])
  const optWords = optLower.split(/\s+/).filter(Boolean);
  if (optWords.length > 1 && optWords.every((w) => textToSearch.includes(w))) {
    return true;
  }

  return false;
};

// Case-insensitive helper to look up attribute values from selectedAttributes state
const getActiveAttrVal = (selectedAttrs, attrName) => {
  if (!selectedAttrs || !attrName) return "";
  const targetKey = String(attrName).trim().toLowerCase();
  for (const [k, v] of Object.entries(selectedAttrs)) {
    if (String(k).trim().toLowerCase() === targetKey) {
      return String(v).trim();
    }
  }
  return "";
};

// Helper to derive accurate attribute values directly from a variant while prioritizing user selections
const deriveVariantAttributes = (variant, productAttributes, prioritySelections = {}) => {
  const derived = { ...prioritySelections };
  if (!variant) return derived;

  const rawAttrs = variant.attributes instanceof Map
    ? Object.fromEntries(variant.attributes)
    : (variant.attributes?._doc || variant.attributes || {});

  // Copy raw attributes if not already in prioritySelections
  Object.entries(rawAttrs).forEach(([k, v]) => {
    const keyLower = k.toLowerCase();
    const isAlreadySet = Object.keys(derived).some((dk) => dk.toLowerCase() === keyLower);
    if (!isAlreadySet) {
      derived[k] = Array.isArray(v) ? v[0] : v;
    }
  });

  if (productAttributes && Array.isArray(productAttributes)) {
    productAttributes.forEach((attr) => {
      const attrName = attr.name || attr.key;
      const options = attr.options || attr.values || [];

      const keyLower = attrName.toLowerCase();
      const isAlreadySet = Object.keys(derived).some((dk) => dk.toLowerCase() === keyLower);

      if (!isAlreadySet) {
        const foundOpt = options.find((opt) => matchOptionInVariant(variant, attrName, opt));
        if (foundOpt) {
          derived[attrName] = foundOpt;
        }
      }
    });
  }

  return derived;
};

// Helper to adapt description HTML text colors dynamically so hardcoded white/black text adapts to active theme
const adaptDescriptionHtmlToTheme = (rawHtml) => {
  if (!rawHtml) return "";
  return String(rawHtml)
    .replace(/<font([^>]*)\scolor=["']?(#ffffff|#000000|#fff|#000|white|black|#131313|#0a0a0a|#18181b|#e5e2e1)["']?([^>]*)>/gi, '<font$1$3>')
    .replace(/color:\s*(#ffffff|#000000|#fff|#000|white|black|rgb\(255,\s*255,\s*255\)|rgb\(0,\s*0,\s*0\)|#131313|#0a0a0a|#18181b|#e5e2e1);?/gi, "color: inherit;")
    .replace(/background-color:\s*(#ffffff|#000000|#fff|#000|white|black|rgb\(255,\s*255,\s*255\)|rgb\(0,\s*0,\s*0\));?/gi, "");
};

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
          if (cleaned) attrMap.get(existingKey).add(cleaned);
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
        <div className="lg:col-span-6 space-y-4">
          <div
            className="relative w-full h-[450px] sm:h-[520px] rounded-3xl overflow-hidden bg-background border border-border-theme shadow-lg group cursor-crosshair"
            onMouseEnter={() => setIsZoomed(true)}
            onMouseLeave={() => setIsZoomed(false)}
            onMouseMove={handleMouseMoveZoom}
          >
            <img
              src={galleryImages[activeImageIndex]}
              alt={product.title}
              className={`w-full h-full object-cover transition-transform duration-300 ${
                isZoomed ? "scale-200" : "scale-100"
              }`}
              style={
                isZoomed
                  ? {
                      transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                    }
                  : undefined
              }
            />

            {/* Badges & Wishlist Overlay */}
            <div className="absolute top-4 left-4 right-4 flex justify-between items-start z-10 pointer-events-none">
              <div className="flex flex-col gap-2 items-start max-w-[80%] pointer-events-auto">
                {discountPercent > 0 && (
                  <span className="w-fit inline-flex items-center px-3.5 py-1.5 rounded-full bg-accent text-accent-content text-xs font-black tracking-wider uppercase shadow-md whitespace-nowrap">
                    -{discountPercent}% OFF
                  </span>
                )}
              </div>

              {/* Wishlist Heart Button Overlay */}
              <button
                type="button"
                onClick={handleToggleWishlist}
                className={`w-10 h-10 rounded-full backdrop-blur-md flex items-center justify-center shadow-lg hover:scale-110 active:scale-95 transition-all pointer-events-auto cursor-pointer ${
                  isWishlisted
                    ? "bg-red-500/20 text-red-500 border border-red-500/40"
                    : "bg-background/80 hover:bg-background text-foreground/60"
                }`}
                title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
              >
                <i className={isWishlisted ? "ri-heart-fill text-lg text-red-500" : "ri-heart-line text-lg"} />
              </button>
            </div>
          </div>

          {/* 🖼️ Thumbnails Carousel (Shows ONLY Selected Variant / Color Photos) */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold uppercase text-foreground/50 tracking-wider">
                Product Photos ({galleryImages.length})
              </span>
            </div>
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {galleryImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-20 h-20 sm:w-22 sm:h-22 rounded-2xl overflow-hidden border-2 transition shrink-0 cursor-pointer ${
                    activeImageIndex === idx
                      ? "border-accent ring-4 ring-accent/20 scale-105 shadow-md"
                      : "border-border-theme hover:border-foreground/40 opacity-70 hover:opacity-100"
                  }`}
                >
                  <img
                    src={imgUrl}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 🛍️ RIGHT COLUMN: Product Specifications & Order Box (6 cols) */}
        <div className="lg:col-span-6 space-y-8">
          {/* Header Title & Badges */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              {product.brand && (
                <span className="px-3 py-1 rounded-lg bg-surface border border-border-theme text-foreground/80 font-bold text-xs">
                  {product.brand.name}
                </span>
              )}
              {isOutOfStock ? (
                <span className="px-3 py-1 rounded-lg bg-red-500/10 text-red-400 border border-red-500/20 font-bold text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-red-400"></span>
                  Out of Stock
                </span>
              ) : currentStock <= 5 ? (
                <span className="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse"></span>
                  Only {currentStock} left!
                </span>
              ) : (
                <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold text-xs flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                  In Stock ({currentStock} available)
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold text-foreground tracking-tight leading-tight">
              {product.title}
            </h1>

            {product.shortDescription && (
              <p className="text-xs sm:text-sm text-foreground/70 leading-relaxed font-medium">
                {product.shortDescription}
              </p>
            )}
          </div>

          {/* Price Card */}
          <div className="flex flex-col items-start sm:flex-row sm:items-center justify-between sm:justify-start gap-2">
            <div className="bg-surface border border-border-theme p-4 rounded-2xl space-y-1 shadow-sm">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl sm:text-4xl font-extrabold text-accent">
                ₹{currentPrice.toLocaleString()}
              </span>
              {originalPrice > currentPrice && (
                <span className="text-sm font-semibold text-foreground/40 line-through">
                  ₹{originalPrice.toLocaleString()}
                </span>
              )}
            </div>
            <p className="text-[11px] text-foreground/50 font-medium">
              Inclusive of all taxes. Free shipping on orders over ₹999.
            </p>
          </div>
              <div className="space-y-3 pt-2 bg-surface p-4 rounded-2xl border border-border-theme ">
            <span className="text-xs font-bold text-foreground uppercase tracking-wider">Quantity:</span>
            <div className="flex items-center gap-4">
              <div className="flex items-center bg-background border border-border-theme rounded-xl overflow-hidden px-1">
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.max(1, prev - 1))}
                  disabled={quantity <= 1 || isOutOfStock}
                  className="px-3 py-2.5 text-foreground/70 hover:text-foreground hover:bg-surface font-extrabold text-sm transition disabled:opacity-30 cursor-pointer"
                >
                  -
                </button>
                <input
                  type="number"
                  min={1}
                  max={currentStock || 999}
                  value={quantity}
                  disabled={isOutOfStock}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    if (!isNaN(val) && val >= 1) {
                      setQuantity(Math.min(currentStock || 999, val));
                    }
                  }}
                  className="w-12 text-center bg-transparent font-extrabold text-sm text-foreground outline-none focus:text-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button
                  type="button"
                  onClick={() => setQuantity((prev) => Math.min(currentStock, prev + 1))}
                  disabled={quantity >= currentStock || isOutOfStock}
                  className="px-4 py-2.5 text-foreground/70 hover:text-foreground hover:bg-surface font-extrabold text-sm transition disabled:opacity-30 cursor-pointer"
                >
                  +
                </button>
              </div>

              {currentStock > 0 && currentStock <= 5 && (
                <span className="text-xs font-extrabold text-amber-400 animate-pulse flex items-center gap-1">
                  <i className="ri-flashlight-fill text-amber-400" />
                  <span>Only {currentStock} left in stock - order soon!</span>
                </span>
              )}
            </div>
          </div>
          
          </div>

          {/* Dynamic Attribute Selectors */}
          {sortedAttributes.length > 0 && (
            <div className="space-y-5 pt-2 border-t border-border-theme">
              {/* Selected variant summary pill */}
              {selectedVariant && Object.keys(selectedAttributes || {}).length > 0 && (
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-bold text-foreground/40 uppercase tracking-widest">Selected:</span>
                  {Object.entries(selectedAttributes).map(([k, v]) => (
                    <span
                      key={k}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-accent/10 border border-accent/30 text-accent text-[11px] font-extrabold"
                    >
                      <span className="text-accent/60 font-normal">{k}:</span>
                      {v}
                    </span>
                  ))}
                  {selectedVariant?.price?.amount && (
                    <span className="ml-auto text-xs font-extrabold text-accent">
                      ₹{Number(selectedVariant.price.amount).toLocaleString()}
                    </span>
                  )}
                </div>
              )}

              {sortedAttributes.map((attr, idx) => {
                const attrName = attr.name || attr.key;
                const options = attr.options || attr.values || [];
                const foundVal = getActiveAttrVal(selectedAttributes, attrName);
                const activeVal = foundVal || (options.length > 0 ? options[0] : "");
                const isColorAttr = isColorAttribute(attrName);

                if (isColorAttr) {
                  return (
                    <div key={idx} className="space-y-3">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">{attrName}</span>
                        <span className="text-xs font-extrabold text-foreground">{activeVal}</span>
                      </div>

                      {/* Color swatches with variant images */}
                      <div className="flex flex-wrap gap-3">
                        {options.map((opt, oIdx) => {
                          const isSelected =
                            String(activeVal).trim().toLowerCase() === String(opt).trim().toLowerCase();
                          const available = isOptionAvailable(attrName, opt);

                          // Find variant specific image for this color (or fallback to main cover image)
                          const matchedVarForOpt = product.variants?.find((v) => {
                            return matchOptionInVariant(v, attrName, opt) && v.images?.length > 0;
                          });

                          const optImg =
                            matchedVarForOpt?.images?.[0]?.url ||
                            product.variants?.find((v) => matchOptionInVariant(v, attrName, opt))?.images?.[0]?.url ||
                            product.images?.[0]?.url ||
                            (typeof product.images?.[0] === "string" ? product.images[0] : null);
                          const hexColor = getColorHex(opt);

                          return (
                            <button
                              key={oIdx}
                              type="button"
                              onClick={() => { if (!available) return; handleSelectAttributeOption(attrName, opt); }}
                              disabled={!available}
                              className={`group relative flex flex-col items-center p-1.5 rounded-2xl border-2 transition-all duration-200 ${
                                isSelected
                                  ? "border-accent ring-4 ring-accent/20 bg-accent/5 scale-105 shadow-md cursor-pointer"
                                  : available
                                  ? "border-border-theme hover:border-accent/50 bg-background cursor-pointer"
                                  : "border-border-theme/30 bg-surface/30 opacity-30 cursor-not-allowed grayscale"
                              }`}
                            >
                              <div className="w-14 h-14 sm:w-18 sm:h-18 rounded-xl overflow-hidden bg-surface border border-border-theme/50 relative flex items-center justify-center">
                                {optImg ? (
                                  <img src={optImg} alt={opt} className="w-full h-full object-cover group-hover:scale-110 transition duration-300" />
                                ) : hexColor ? (
                                  <div className="w-8 h-8 rounded-full border border-border-theme/80" style={{ backgroundColor: hexColor }} />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center font-bold text-xs text-foreground/60">{opt}</div>
                                )}
                                {isSelected && (
                                  <div className="absolute inset-0 bg-accent/10 flex items-center justify-center">
                                    <i className="ri-check-line text-accent text-base font-black" />
                                  </div>
                                )}
                              </div>
                              <span className={`text-[10px] font-extrabold mt-1 uppercase ${isSelected ? "text-accent" : "text-foreground/60"}`}>
                                {opt}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                }

                // Size / Other attributes — pill buttons
                return (
                  <div key={idx} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-foreground/50 uppercase tracking-widest">{attrName}</span>
                      <span className="text-xs font-extrabold text-foreground">{activeVal}</span>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      {options.map((opt, oIdx) => {
                        const isSelected =
                          String(activeVal).trim().toLowerCase() === String(opt).trim().toLowerCase();
                        const available = isOptionAvailable(attrName, opt);

                        return (
                          <button
                            key={oIdx}
                            type="button"
                            onClick={() => { if (!available) return; handleSelectAttributeOption(attrName, opt); }}
                            disabled={!available}
                            className={`px-4 py-2 rounded-xl text-xs font-extrabold border transition-all duration-200 ${
                              isSelected
                                ? "bg-accent text-accent-content border-accent shadow-md ring-4 ring-accent/20 cursor-pointer"
                                : available
                                ? "bg-background text-foreground/80 border-border-theme hover:border-accent/50 hover:bg-accent/5 cursor-pointer"
                                : "bg-surface/30 text-foreground/20 border-border-theme/30 opacity-30 cursor-not-allowed line-through"
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}



          {/* ⚡ Action Buttons (Add to Cart, Buy Now & Wishlist) */}
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <motion.button
              type="button"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              whileHover={!isOutOfStock && !isAddingToCart ? { scale: 1.02 } : {}}
              whileTap={!isOutOfStock && !isAddingToCart ? { scale: 0.98 } : {}}
              className={`relative flex-1 py-4 rounded-2xl font-extrabold text-xs uppercase tracking-wider shadow-lg transition overflow-hidden cursor-pointer flex items-center justify-center ${
                isOutOfStock
                  ? "bg-foreground/20 text-foreground/40 border border-border-theme cursor-not-allowed shadow-none"
                  : isAddingToCart
                  ? "bg-emerald-500 text-white shadow-emerald-500/25"
                  : "bg-accent text-accent-content shadow-accent/25 hover:opacity-95"
              }`}
            >
              {isAddingToCart ? (
                <div className="flex items-center gap-2.5 z-10">
                  <div className="relative w-6 h-6 flex items-center justify-center">
                    <motion.i
                      initial={{ scale: 1 }}
                      animate={{ scale: [1, 1.3, 0.9, 1.1, 1], rotate: [0, -10, 10, -5, 0] }}
                      transition={{ duration: 0.6, delay: 0.3, ease: "easeOut" }}
                      className="ri-shopping-bag-3-fill text-lg text-white"
                    />
                    <motion.div
                      initial={{ y: -26, x: -10, opacity: 0, scale: 0.7, rotate: -20 }}
                      animate={{
                        y: [-26, -8, 2],
                        x: [-10, -3, 0],
                        opacity: [0, 1, 0],
                        scale: [0.7, 1, 0.4],
                        rotate: [-20, 0, 15],
                      }}
                      transition={{ duration: 0.45, ease: "easeIn" }}
                      className="absolute text-xs"
                    >
                      👟
                    </motion.div>
                  </div>
                  <motion.span
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="font-black text-xs tracking-wider text-white"
                  >
                    ✓ Added to Bag!
                  </motion.span>
                </div>
              ) : (
                <div className="flex items-center gap-2 z-10">
                  <i className="ri-shopping-bag-line text-base" />
                  <span>{isOutOfStock ? "Out of Stock" : "Add to Cart"}</span>
                </div>
              )}
            </motion.button>

            <button
              type="button"
              onClick={handleBuyNow}
              disabled={isOutOfStock}
              className="flex-1 py-4 rounded-2xl bg-foreground text-background font-extrabold text-xs uppercase tracking-wider shadow-lg hover:opacity-90 transition transform hover:-translate-y-0.5 disabled:opacity-50 cursor-pointer flex items-center justify-center gap-1.5"
            >
              <i className="ri-flashlight-line text-sm" />
              <span>Buy Now</span>
            </button>

            {/* Wishlist Button */}
            <button
              type="button"
              onClick={handleToggleWishlist}
              className={`py-4 px-4 sm:w-14 h-14 rounded-2xl flex items-center justify-center border transition shadow-md hover:scale-105 active:scale-95 cursor-pointer shrink-0 ${
                isWishlisted
                  ? "bg-red-500/15 border-red-500/40 text-red-500"
                  : "bg-surface border-border-theme hover:border-accent/40 text-foreground/70"
              }`}
              title={isWishlisted ? "Remove from Wishlist" : "Save to Wishlist"}
            >
              <i className={isWishlisted ? "ri-heart-fill text-xl text-red-500" : "ri-heart-line text-xl"} />
              <span className="sm:hidden text-xs font-bold uppercase tracking-wider ml-2">
                {isWishlisted ? "Saved in Wishlist" : "Add to Wishlist"}
              </span>
            </button>
          </div>

          {/* Seller Trust Badge */}
          {product.seller && (
            <div className="bg-surface border border-border-theme p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-accent/10 border border-accent/30 text-accent font-extrabold flex items-center justify-center text-sm">
                  {product.seller.fullname?.charAt(0) || "S"}
                </div>
                <div>
                  <p className="text-xs font-extrabold text-foreground">
                    Sold by {product.seller.fullname || "Verified Seller"}
                  </p>
                  <p className="text-[10px] text-foreground/50">Verified Merchant • 98% Positive Feedback</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-accent/10 text-accent text-[10px] font-extrabold">
                Verified Seller
              </span>
            </div>
          )}
        </div>
      </div>

      {/* ── Product Specifications & Details Tabs ── */}
      <div className="bg-background border border-border-theme rounded-3xl p-6 sm:p-10 space-y-6 shadow-sm">
        <div className="flex items-center space-x-4 border-b border-border-theme pb-4">
          {[
            { id: "specs", label: "Specifications & Details" },
            { id: "shipping", label: "Shipping & Returns" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`pb-2 text-xs font-extrabold transition cursor-pointer border-b-2 ${
                activeTab === tab.id
                  ? "border-accent text-accent"
                  : "border-transparent text-foreground/50 hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "specs" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="bg-surface p-4 rounded-xl space-y-1">
              <span className="text-foreground/50 font-medium">Product Type</span>
              <p className="font-bold text-foreground capitalize">{product.productType || "Physical"}</p>
            </div>
            {product.weight && (
              <div className="bg-surface p-4 rounded-xl space-y-1">
                <span className="text-foreground/50 font-medium">Weight</span>
                <p className="font-bold text-foreground">
                  {product.weight} {product.weightUnit || "g"}
                </p>
              </div>
            )}
            {product.unit && (
              <div className="bg-surface p-4 rounded-xl space-y-1">
                <span className="text-foreground/50 font-medium">Unit of Measure</span>
                <p className="font-bold text-foreground">{product.unit.name}</p>
              </div>
            )}
            {product.sku && (
              <div className="bg-surface p-4 rounded-xl space-y-1">
                <span className="text-foreground/50 font-medium">Root SKU</span>
                <p className="font-bold text-foreground">{product.sku}</p>
              </div>
            )}
          </div>
        )}

        {activeTab === "shipping" && (
          <div className="space-y-3 text-xs text-foreground/80">
            <p className="font-bold text-accent">🚚 Delivery & Return Guidelines</p>
            <ul className="list-disc pl-5 space-y-1 text-foreground/70">
              <li>Standard delivery within 3-5 business days across India.</li>
              <li>7 days hassle-free replacement or return policy.</li>
              <li>Cash on Delivery available on select postal codes.</li>
            </ul>
          </div>
        )}
      </div>

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
