// Shared pure helpers for the SingleProduct page + its components.
import { isColorAttribute } from "../../../../utils/attributeUtils";

// Color name → Hex map for fallback swatches
export const getColorHex = (colorName) => {
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

export { isColorAttribute };

// Robust helper to check if a variant matches a specified attribute option
export const matchOptionInVariant = (variant, attrName, optionValue) => {
  if (!variant || !optionValue) return false;
  const optLower = String(optionValue).trim().toLowerCase();
  const attrNameLower = String(attrName).trim().toLowerCase();
  const isColorAttr = /color/i.test(attrNameLower);

  // 1. Structured attributes map/object (e.g. { Color: "light blue", Size: ["UK 6", "UK 7", "UK 8"] })
  //    For COLOR attributes this is AUTHORITATIVE: a variant that declares its
  //    color in the map is matched ONLY by that value. The name/sku fallback
  //    below is skipped for colors because variant names embed the product
  //    title (e.g. "Linen Pants: Indigo - BLACK"), which would falsely match
  //    every variant of a product whose title contains a color word.
  const rawAttrs =
    variant.attributes instanceof Map
      ? Object.fromEntries(variant.attributes)
      : variant.attributes?._doc || variant.attributes || {};

  let structuredFound = false;
  for (const [k, v] of Object.entries(rawAttrs)) {
    if (String(k).trim().toLowerCase() === attrNameLower) {
      structuredFound = true;
      const items = Array.isArray(v) ? v : [v];
      const match = items.some((item) => {
        if (!item) return false;
        const parts = String(item).split(",");
        return parts.some((p) => p.trim().toLowerCase() === optLower);
      });
      if (match) return true;
      if (isColorAttr) return false; // declared color that doesn't match → no fallback
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
        if (isColorAttr) return false;
      }
    }
  }

  // 3. Fallback to token/word matching against variant.sku AND variant.name
  //    (only reached when the variant has no structured value for this attr)
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
export const getActiveAttrVal = (selectedAttrs, attrName) => {
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
export const deriveVariantAttributes = (variant, productAttributes, prioritySelections = {}) => {
  const derived = { ...prioritySelections };
  if (!variant) return derived;

  const rawAttrs =
    variant.attributes instanceof Map
      ? Object.fromEntries(variant.attributes)
      : variant.attributes?._doc || variant.attributes || {};

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
export const adaptDescriptionHtmlToTheme = (rawHtml) => {
  if (!rawHtml) return "";
  return String(rawHtml)
    .replace(/<font([^>]*)\scolor=["']?(#ffffff|#000000|#fff|#000|white|black|#131313|#0a0a0a|#18181b|#e5e2e1)["']?([^>]*)>/gi, "<font$1$3>")
    .replace(/color:\s*(#ffffff|#000000|#fff|#000|white|black|rgb\(255,\s*255,\s*255\)|rgb\(0,\s*0,\s*0\)|#131313|#0a0a0a|#18181b|#e5e2e1);?/gi, "color: inherit;")
    .replace(/background-color:\s*(#ffffff|#000000|#fff|#000|white|black|rgb\(255,\s*255,\s*255\)|rgb\(0,\s*0,\s*0\));?/gi, "");
};
