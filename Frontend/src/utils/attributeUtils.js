/**
 * Check if attribute name is a color attribute (handles color, Colour, COLOUR, etc.)
 */
export const isColorAttribute = (key) => {
  if (!key) return false;
  return /^colou?r$/i.test(String(key).trim());
};

/**
 * Normalizes attribute key name to Title Case.
 * e.g. "  color " -> "Color", "colour" -> "Color", "SIZE" -> "Size"
 */
export const normalizeAttributeKey = (key) => {
  if (!key) return "";
  const cleaned = key.trim();
  if (isColorAttribute(cleaned)) return "Color";

  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Normalizes a single attribute VALUE to Title Case.
 * e.g. "BLUE" -> "Blue", "uk 6" -> "UK 6" (preserves all-upper short codes)
 * Special rule: if ALL chars are uppercase and length <= 4 (e.g. "UK", "XL"), keep as-is.
 */
export const normalizeAttributeValue = (val) => {
  if (!val) return "";
  const s = String(val).trim();
  if (!s) return "";

  return s
    .split(/\s+/)
    .map((token) => {
      if (/^[A-Z0-9]+$/.test(token) && token.length <= 4) return token;
      return token.charAt(0).toUpperCase() + token.slice(1).toLowerCase();
    })
    .join(" ");
};

/**
 * Normalizes a comma-separated string or array of values into clean, Title-Cased, deduplicated array.
 * Case-insensitive deduplication: "Blue", "blue", "BLUE" → ["Blue"]
 */
export const normalizeAttributeValues = (rawValues) => {
  let list = [];
  if (Array.isArray(rawValues)) {
    list = rawValues;
  } else if (typeof rawValues === "string") {
    list = rawValues.split(",");
  }

  const seen = new Map(); // lowercase → normalized
  list.forEach((v) => {
    const cleaned = (typeof v === "string" ? v : String(v)).trim();
    if (!cleaned) return;
    const lower = cleaned.toLowerCase();
    if (!seen.has(lower)) {
      seen.set(lower, normalizeAttributeValue(cleaned));
    }
  });

  return Array.from(seen.values());
};

/**
 * Merge new attribute key+values into an existing attributes list.
 * - Case-insensitive key matching → merges into existing entry
 * - Case-insensitive value deduplication → "Blue", "blue", "BLUE" all treated as "Blue"
 * - Values are normalized to Title Case before storing
 * - Color / Colour attribute ALWAYS placed first in list
 */
export const mergeAttributeItem = (existingList = [], keyInput, valueInput) => {
  const normKey = normalizeAttributeKey(keyInput);
  const newValues = normalizeAttributeValues(valueInput);
  if (!normKey || newValues.length === 0) return existingList;

  const listCopy = [...existingList];

  // Case-insensitive key match (including colour/color unification)
  const matchIdx = listCopy.findIndex((item) => {
    const itemKey = item.name || item.key;
    return itemKey && (
      itemKey.trim().toLowerCase() === normKey.toLowerCase() ||
      (isColorAttribute(itemKey) && isColorAttribute(normKey))
    );
  });

  if (matchIdx !== -1) {
    const currentItem = listCopy[matchIdx];
    const currentRaw = currentItem.options || currentItem.values || (currentItem.value ? [currentItem.value] : []);
    const existingNormalized = normalizeAttributeValues(currentRaw);

    const seen = new Map();
    existingNormalized.forEach((v) => seen.set(v.toLowerCase(), v));

    newValues.forEach((v) => {
      if (!seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v);
    });

    const merged = Array.from(seen.values());
    listCopy[matchIdx] = {
      ...currentItem,
      name: normKey,
      key: normKey,
      options: merged,
      values: merged,
    };
  } else {
    listCopy.push({
      name: normKey,
      key: normKey,
      options: newValues,
      values: newValues,
    });
  }

  // Sort Color first
  return listCopy.sort((a, b) => {
    const aIsColor = isColorAttribute(a.name || a.key);
    const bIsColor = isColorAttribute(b.name || b.key);
    if (aIsColor && !bIsColor) return -1;
    if (!aIsColor && bIsColor) return 1;
    return 0;
  });
};

/**
 * Fully normalizes an attributes array: deduplicates keys (case-insensitive) and values (case-insensitive),
 * and places Color / Colour attribute FIRST.
 */
export const normalizeAttributesArray = (attrs = []) => {
  if (!Array.isArray(attrs)) return [];

  const result = [];
  attrs.forEach((attr) => {
    const name = normalizeAttributeKey(attr.name || attr.key);
    if (!name) return;
    const values = normalizeAttributeValues(attr.options || attr.values || []);
    const existingIdx = result.findIndex((r) => r.name.toLowerCase() === name.toLowerCase() || (isColorAttribute(r.name) && isColorAttribute(name)));
    if (existingIdx !== -1) {
      const seen = new Map(result[existingIdx].options.map((v) => [v.toLowerCase(), v]));
      values.forEach((v) => { if (!seen.has(v.toLowerCase())) seen.set(v.toLowerCase(), v); });
      const merged = Array.from(seen.values());
      result[existingIdx] = { ...result[existingIdx], name, key: name, options: merged, values: merged };
    } else {
      result.push({ name, key: name, options: values, values });
    }
  });

  // Sort Color first ALWAYS
  result.sort((a, b) => {
    const aIsColor = isColorAttribute(a.name || a.key);
    const bIsColor = isColorAttribute(b.name || b.key);
    if (aIsColor && !bIsColor) return -1;
    if (!aIsColor && bIsColor) return 1;
    return 0;
  });

  return result;
};
