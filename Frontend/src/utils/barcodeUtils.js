/**
 * Barcode Generator Utility for SCAPEGOAT Marketplace
 * Supports EAN-13, UPC-A, and Code128 format strings
 */

/**
 * Generates a valid 13-digit EAN-13 barcode string
 * Prefix 890 (India country code for SCAPEGOAT) + 9 random digits + 1 checksum digit
 */
export function generateEAN13Barcode() {
  const prefix = "890";
  let randomPart = "";
  for (let i = 0; i < 9; i++) {
    randomPart += Math.floor(Math.random() * 10);
  }
  const raw12 = prefix + randomPart;

  // Calculate EAN-13 Checksum digit
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(raw12[i], 10);
    sum += i % 2 === 0 ? digit : digit * 3;
  }
  const checksum = (10 - (sum % 10)) % 10;
  return raw12 + checksum;
}

/**
 * Generates a SKU-based Code128 string
 * e.g. SG-NK-89012345
 */
export function generateCode128Barcode(prefix = "SG") {
  const timestamp = Date.now().toString().slice(-6);
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${prefix.toUpperCase()}-${timestamp}-${randomPart}`;
}
