/**
 * imageConvert.js — normalize ANY image the user picks (iPhone HEIC, BMP,
 * TIFF, giant PNGs…) into a web-friendly, uniformly-sized JPEG so the preview
 * and the backend CLIP pipeline always get a decodable file.
 *
 * Pipeline:
 *   1. HEIC/HEIF (mobile cameras) → heic2any (client-side WASM decode) → JPEG
 *   2. Everything else → createImageBitmap (EXIF-corrected) → canvas → JPEG
 *   3. Older browsers → <img> fallback → canvas → JPEG
 *   4. Total failure → return the ORIGINAL file untouched (the backend then
 *      reports its normal "could not create an embedding" error)
 */
import heic2any from "heic2any";

const isHeic = (file) =>
  /heic|heif/i.test(file.type || "") || /\.heic$/i.test(file.name || "");

export const convertImageFile = async (file, { maxDimension = 1024, quality = 0.9 } = {}) => {
  if (!file || !file.type || !file.type.startsWith("image/")) return file;

  try {
    let source = file;

    // 1. HEIC/HEIF — the browser itself cannot decode these on most platforms
    //    (Windows Chrome, Android), so convert with the WASM libheif decoder.
    if (isHeic(file)) {
      try {
        const converted = await heic2any({ blob: file, toType: "image/jpeg", quality });
        const blob = Array.isArray(converted) ? converted[0] : converted;
        if (blob && blob.size > 0) {
          source = new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
        }
      } catch (err) {
        console.warn("[imageConvert] heic2any failed:", err?.message);
        // fall through — a few browsers can still decode HEIC natively
      }
    }

    // 2. Decode (EXIF orientation applied) → 3. canvas → JPEG
    let bitmap;
    try {
      bitmap = await createImageBitmap(source, { imageOrientation: "from-image" });
    } catch {
      return decodeViaImage(source, maxDimension, quality);
    }

    const canvas = document.createElement("canvas");
    const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
    canvas.width = Math.max(1, Math.round(bitmap.width * scale));
    canvas.height = Math.max(1, Math.round(bitmap.height * scale));
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      bitmap.close();
      return file;
    }
    ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();

    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
};

const decodeViaImage = async (file, maxDimension, quality) => {
  try {
    const url = URL.createObjectURL(file);
    const img = new Image();
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
      img.src = url;
    });
    URL.revokeObjectURL(url);
    const canvas = document.createElement("canvas");
    const scale = Math.min(1, maxDimension / Math.max(img.naturalWidth, img.naturalHeight));
    canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
    canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
    canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } catch {
    return file;
  }
};

export { isHeic };
