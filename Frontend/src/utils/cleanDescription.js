/**
 * cleanDescriptionHtml — sanitizes & compresses rich-text product description HTML
 * before it is sent to the backend.
 *
 * The RichTextEditor (document.execCommand based) produces heavily nested markup:
 * <font><span></span></font> chains, empty wrappers, copy-paste font metadata
 * (face/color), and editor-internal classes. That bloat inflates the description
 * string past storage limits and pollutes the storefront DOM.
 *
 * This cleaner is visually lossless:
 *   - removes empty elements (no text / no media children)
 *   - unwraps <font> into <span> carrying color/size inline styles (face dropped —
 *     the site font is applied globally by CSS anyway)
 *   - strips editor artifacts (selected-editor-img class, draggable attr, empty style)
 *
 * @param {string} html
 * @returns {string} cleaned HTML fragment
 */
export function cleanDescriptionHtml(html) {
  if (!html || typeof html !== "string") return html || "";
  const doc = new DOMParser().parseFromString(html, "text/html");
  const root = doc.body;

  const MEDIA_TAGS = new Set([
    "BR", "IMG", "HR", "IFRAME", "VIDEO", "AUDIO", "SOURCE", "INPUT", "CANVAS", "SVG",
  ]);

  const isMedia = (el) => MEDIA_TAGS.has(el.tagName);

  const hasContent = (el) => {
    if (isMedia(el)) return true;
    for (const child of el.childNodes) {
      if (child.nodeType === Node.TEXT_NODE) {
        if ((child.textContent || "").replace(/\u00a0/g, " ").trim().length > 0) return true;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        if (hasContent(child)) return true;
      }
    }
    return false;
  };

  // 1. Remove empty elements bottom-up — kills <font><span></span></font> bloat
  const removeEmpty = (parent) => {
    Array.from(parent.children).forEach((el) => {
      removeEmpty(el);
      if (!hasContent(el)) el.remove();
    });
  };
  removeEmpty(root);

  // 2. Convert <font> → <span>, preserving color & size, dropping face metadata
  const SIZE_TO_PX = { 1: "10px", 2: "13px", 3: "", 4: "18px", 5: "24px", 6: "32px", 7: "48px" };
  root.querySelectorAll("font").forEach((font) => {
    const span = doc.createElement("span");
    const styleParts = [];
    const color = font.getAttribute("color");
    if (color) styleParts.push(`color: ${color}`);
    const size = SIZE_TO_PX[font.getAttribute("size")];
    if (size) styleParts.push(`font-size: ${size}`);
    const existing = (font.getAttribute("style") || "").trim();
    if (existing) styleParts.push(existing.replace(/;$/, ""));
    if (styleParts.length) span.setAttribute("style", `${styleParts.join("; ")};`);
    while (font.firstChild) span.appendChild(font.firstChild);
    font.replaceWith(span);
  });

  // 3. Strip editor artifacts
  root.querySelectorAll("img").forEach((img) => {
    img.classList.remove("selected-editor-img");
    img.removeAttribute("draggable");
  });

  // 4. Drop empty style="" attributes & redundant `color: inherit` declarations
  //    (color inherits by default in CSS, so `color: inherit` is always a no-op)
  root.querySelectorAll("[style]").forEach((el) => {
    const s = (el.getAttribute("style") || "").trim();
    if (!s || s === ";") {
      el.removeAttribute("style");
      return;
    }
    const decls = s
      .split(";")
      .map((d) => d.trim())
      .filter((d) => d && !/^color\s*:\s*inherit$/i.test(d));
    if (decls.length) el.setAttribute("style", `${decls.join("; ")};`);
    else el.removeAttribute("style");
  });

  // 5. Serialize back to a clean HTML fragment (no <html>/<body> wrappers)
  const container = doc.createElement("div");
  while (root.firstChild) container.appendChild(root.firstChild);
  return container.innerHTML;
}
