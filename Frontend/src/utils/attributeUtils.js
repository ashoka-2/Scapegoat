/**
 * Normalizes attribute key name (e.g. "  color " -> "Color", "SIZE" -> "Size", "CARE INSTRUCTIONS" -> "Care Instructions")
 * Handles case-insensitivity while keeping proper title capitalization.
 */
export const normalizeAttributeKey = (key) => {
  if (!key) return "";
  const cleaned = key.trim();
  if (!cleaned) return "";

  return cleaned
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
};

/**
 * Normalizes value list (comma-separated string or array) into clean array of unique values
 */
export const normalizeAttributeValues = (rawValues) => {
  let list = [];
  if (Array.isArray(rawValues)) {
    list = rawValues;
  } else if (typeof rawValues === "string") {
    list = rawValues.split(",");
  }
  return list
    .map((v) => (typeof v === "string" ? v.trim() : String(v)))
    .filter(Boolean);
};

/**
 * Merge new attribute key-value into an existing list of attributes
 * Prevents case-insensitive duplicate keys & duplicate values!
 */
export const mergeAttributeItem = (existingList = [], keyInput, valueInput) => {
  const normKey = normalizeAttributeKey(keyInput);
  const newValues = normalizeAttributeValues(valueInput);
  if (!normKey || newValues.length === 0) return existingList;

  const listCopy = [...existingList];

  // Case-insensitive key match (e.g. "Color", "color", "COLOR" all match)
  const matchIdx = listCopy.findIndex((item) => {
    const itemKey = item.name || item.key;
    return itemKey && itemKey.trim().toLowerCase() === normKey.toLowerCase();
  });

  if (matchIdx !== -1) {
    // Key exists -> Merge values without duplicate strings
    const currentItem = listCopy[matchIdx];
    const currentValues = currentItem.options || currentItem.values || (currentItem.value ? [currentItem.value] : []);

    const mergedValues = [...currentValues];
    newValues.forEach((val) => {
      const exists = mergedValues.some((v) => String(v).trim().toLowerCase() === val.toLowerCase());
      if (!exists) {
        mergedValues.push(val);
      }
    });

    listCopy[matchIdx] = {
      ...currentItem,
      name: normKey,
      key: normKey,
      options: mergedValues,
      values: mergedValues,
    };
  } else {
    // New Key
    listCopy.push({
      name: normKey,
      key: normKey,
      options: newValues,
      values: newValues,
    });
  }

  return listCopy;
};
