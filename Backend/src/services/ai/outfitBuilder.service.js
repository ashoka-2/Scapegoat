import productModel from "../../models/product.model.js";

/**
 * Category Classification Mappings for Multi-Tier Outfit Building
 */
const OUTFIT_TIER_KEYWORDS = {
  Headwear: ["cap", "hat", "beanie", "sunglass", "glasses", "shades", "eyewear", "goggles", "headband"],
  Topwear: [
    "shirt", "t-shirt", "tshirt", "tee", "hoodie", "jacket", "oversized", "polo", "sweater",
    "sweatshirt", "blazer", "kurta", "coat", "cardigan", "top", "vest", "shacket"
  ],
  Bottomwear: [
    "pant", "pants", "trouser", "trousers", "jeans", "cargo", "shorts", "chinos", "joggers",
    "trackpants", "denim", "bottom"
  ],
  Footwear: [
    "shoe", "shoes", "sneaker", "sneakers", "loafer", "loafers", "slide", "slides", "sandal",
    "sandals", "chappal", "boots", "footwear", "mules"
  ],
  Accessories: ["watch", "belt", "bag", "backpack", "wallet", "necklace", "bracelet", "ring", "perfume"],
};

const PC_SETUP_TIER_KEYWORDS = {
  Display: ["monitor", "screen", "display", "ultrawide"],
  Peripherals: ["keyboard", "mouse", "headset", "headphones", "desk mat", "mousepad"],
  Core_Hardware: ["cabinet", "case", "motherboard", "processor", "cpu", "gpu", "graphics card", "ram", "power supply"],
  Accessories: ["chair", "desk", "webcam", "microphone", "speaker"],
};

/**
 * Helper to determine which tier a product belongs to based on title, category, and tags
 */
const classifyProductTier = (product, tierKeywordsMap) => {
  const text = `${product.title || ""} ${product.category?.name || ""} ${(product.tags || []).join(" ")}`.toLowerCase();

  for (const [tier, keywords] of Object.entries(tierKeywordsMap)) {
    if (keywords.some((kw) => text.includes(kw))) {
      return tier;
    }
  }
  return "Other";
};

/**
 * Helper to match user requested size and color from product variants and attributes
 */
const matchAttributes = (product, requestedAttributes = {}) => {
  const { size, color } = requestedAttributes;
  let matchingVariant = null;
  let matchingImage = product.images?.[0]?.url || "";
  let price = product.sellingPrice?.amount || product.maxPrice?.amount || 0;

  if (Array.isArray(product.variants) && product.variants.length > 0) {
    // Try to find variant matching both size & color, or at least one
    const matched = product.variants.find((v) => {
      const vSize = v.attributes?.get ? v.attributes.get("Size") : v.attributes?.Size;
      const vColor = v.attributes?.get ? v.attributes.get("Color") : v.attributes?.Color;

      const sizeMatches = !size || (vSize && vSize.toLowerCase() === size.toLowerCase());
      const colorMatches = !color || (vColor && vColor.toLowerCase() === color.toLowerCase());

      return sizeMatches && colorMatches;
    });

    if (matched) {
      matchingVariant = matched;
      price = matched.price?.amount || price;
      if (matched.images?.[0]?.url) {
        matchingImage = matched.images[0].url;
      }
    }
  }

  return {
    variantId: matchingVariant?._id || null,
    price,
    image: matchingImage,
    selectedAttributes: matchingVariant?.attributes || {},
  };
};

/**
 * Builds up to 4 complete Head-to-Toe Outfits from a set of candidate products
 *
 * @param {Array} candidateProducts - Candidate Mongoose product objects
 * @param {Object} preferences - { theme: "Summer Linen", targetBudget: 5000, requestedAttributes: { size: "M", color: "blue" } }
 * @returns {Array} Array of bundle objects
 */
export const buildHierarchicalOutfits = (candidateProducts = [], preferences = {}) => {
  if (!candidateProducts.length) return [];

  // Group candidate products by Outfit Tier
  const tierBuckets = {
    Headwear: [],
    Topwear: [],
    Bottomwear: [],
    Footwear: [],
    Accessories: [],
  };

  for (const prod of candidateProducts) {
    const tier = classifyProductTier(prod, OUTFIT_TIER_KEYWORDS);
    if (tierBuckets[tier]) {
      tierBuckets[tier].push(prod);
    }
  }

  const { theme = "Curated Style", requestedAttributes = {} } = preferences;
  const outfits = [];
  const maxOutfits = Math.min(4, Math.max(1, tierBuckets.Topwear.length || 1));

  for (let i = 0; i < maxOutfits; i++) {
    const top = tierBuckets.Topwear[i % (tierBuckets.Topwear.length || 1)];
    const bottom = tierBuckets.Bottomwear[i % (tierBuckets.Bottomwear.length || 1)];
    const footwear = tierBuckets.Footwear[i % (tierBuckets.Footwear.length || 1)];
    const headwear = tierBuckets.Headwear[i % (tierBuckets.Headwear.length || 1)];
    const accessory = tierBuckets.Accessories[i % (tierBuckets.Accessories.length || 1)];

    const items = [];

    // Layer 1: Headwear / Eyewear (Displayed on top if available)
    if (headwear) {
      const attr = matchAttributes(headwear, requestedAttributes);
      items.push({
        tier: "Headwear & Eyewear",
        product: headwear._id,
        variantId: attr.variantId,
        title: headwear.title,
        price: attr.price,
        image: attr.image,
        selectedAttributes: attr.selectedAttributes,
        stockStatus: headwear.stockStatus || "instock",
      });
    }

    // Layer 2: Topwear (Shirts, Hoodies, Tees)
    if (top) {
      const attr = matchAttributes(top, requestedAttributes);
      items.push({
        tier: "Topwear",
        product: top._id,
        variantId: attr.variantId,
        title: top.title,
        price: attr.price,
        image: attr.image,
        selectedAttributes: attr.selectedAttributes,
        stockStatus: top.stockStatus || "instock",
      });
    }

    // Layer 3: Bottomwear (Pants, Trousers, Shorts)
    if (bottom) {
      const attr = matchAttributes(bottom, requestedAttributes);
      items.push({
        tier: "Bottomwear",
        product: bottom._id,
        variantId: attr.variantId,
        title: bottom.title,
        price: attr.price,
        image: attr.image,
        selectedAttributes: attr.selectedAttributes,
        stockStatus: bottom.stockStatus || "instock",
      });
    }

    // Layer 4: Footwear (Sneakers, Loafers, Slides)
    if (footwear) {
      const attr = matchAttributes(footwear, requestedAttributes);
      items.push({
        tier: "Footwear",
        product: footwear._id,
        variantId: attr.variantId,
        title: footwear.title,
        price: attr.price,
        image: attr.image,
        selectedAttributes: attr.selectedAttributes,
        stockStatus: footwear.stockStatus || "instock",
      });
    }

    // Layer 5: Accessories (Optional add-on)
    if (accessory && items.length < 4) {
      const attr = matchAttributes(accessory, requestedAttributes);
      items.push({
        tier: "Accessories",
        product: accessory._id,
        variantId: attr.variantId,
        title: accessory.title,
        price: attr.price,
        image: attr.image,
        selectedAttributes: attr.selectedAttributes,
        stockStatus: accessory.stockStatus || "instock",
      });
    }

    if (items.length >= 2) {
      const totalPrice = items.reduce((acc, curr) => acc + (curr.price || 0), 0);
      outfits.push({
        bundleId: `outfit-${Date.now()}-${i + 1}`,
        type: "outfit",
        title: `${theme} Look #${i + 1}`,
        description: `Complete head-to-toe coordination with ${items.length} matching pieces`,
        totalPrice,
        savings: Math.round(totalPrice * 0.1), // 10% bundle incentive
        items,
      });
    }
  }

  return outfits;
};

/**
 * Builds Tech / PC Setups or Room Workstation Bundles
 */
export const buildTechSetupBundle = (candidateProducts = [], preferences = {}) => {
  if (!candidateProducts.length) return [];

  const tierBuckets = {
    Display: [],
    Peripherals: [],
    Core_Hardware: [],
    Accessories: [],
  };

  for (const prod of candidateProducts) {
    const tier = classifyProductTier(prod, PC_SETUP_TIER_KEYWORDS);
    if (tierBuckets[tier]) {
      tierBuckets[tier].push(prod);
    }
  }

  const items = [];
  ["Display", "Peripherals", "Core_Hardware", "Accessories"].forEach((tierName) => {
    const prods = tierBuckets[tierName] || [];
    prods.slice(0, 2).forEach((prod) => {
      const price = prod.sellingPrice?.amount || prod.maxPrice?.amount || 0;
      items.push({
        tier: tierName.replace("_", " "),
        product: prod._id,
        variantId: null,
        title: prod.title,
        price,
        image: prod.images?.[0]?.url || "",
        selectedAttributes: {},
        stockStatus: prod.stockStatus || "instock",
      });
    });
  });

  if (items.length < 2) return [];

  const totalPrice = items.reduce((acc, curr) => acc + (curr.price || 0), 0);
  return [
    {
      bundleId: `setup-${Date.now()}`,
      type: "setup",
      title: preferences.theme || "Complete PC / Tech Setup",
      description: `Optimized component matching with ${items.length} compatible products`,
      totalPrice,
      savings: Math.round(totalPrice * 0.08),
      items,
    },
  ];
};
