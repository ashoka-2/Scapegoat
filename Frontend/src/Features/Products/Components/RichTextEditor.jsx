import React, { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { uploadDescriptionImageApi } from "../Services/product.api.js";

/**
 * WooCommerce-style Rich Text Editor for Product Descriptions
 * Supports: Bold, Italic, Underline, Strikethrough, Font Weights,
 * Font Sizes, Steppers, Alignments, Bullet/Numbered Lists, Colors,
 * Image Insertion (Up to 7 Images via Upload + Media Library + URL), Drag & Drop positioning anywhere,
 * Interactive Image Range Resizer & Adjuster, Visual/HTML modes, and React Portal Full-Screen Canvas Mode.
 */
const MAX_DESCRIPTION_IMAGES = 7;

const RichTextEditor = ({ value = "", onChange, placeholder = "Enter product description...", productImages = [] }) => {
  const editorRef = useRef(null);
  const fileInputRef = useRef(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value || "");
  const [fontSize, setFontSize] = useState("14px");
  const [fontWeight, setFontWeight] = useState("400");
  const [customTextColor, setCustomTextColor] = useState("#ffffff");
  const [customBgColor, setCustomBgColor] = useState("#eab308");

  // Image Insertion Modal State
  const [showImageModal, setShowImageModal] = useState(false);
  const [imageTab, setImageTab] = useState(productImages && productImages.length > 0 ? "library" : "upload"); // 'library' | 'upload' | 'url'
  const [imageUrlInput, setImageUrlInput] = useState("");
  const [imageAltInput, setImageAltInput] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  // Selected Image Adjuster State (when user clicks an image inside the editor)
  const [selectedImg, setSelectedImg] = useState(null);
  const [imgWidth, setImgWidth] = useState("100%");
  const [imgAlign, setImgAlign] = useState("center"); // 'left' | 'center' | 'right' | 'inline' | 'full'
  const [imgRounded, setImgRounded] = useState(true);
  const [imgShadow, setImgShadow] = useState(false);
  const [imgAlt, setImgAlt] = useState("");
  const [imgLink, setImgLink] = useState("");

  // Calculate current image count in description
  const getImageCount = () => {
    if (!htmlContent) return 0;
    const matches = htmlContent.match(/<img[^>]*>/gi);
    return matches ? matches.length : 0;
  };

  const imageCount = getImageCount();
  const isMaxImagesReached = imageCount >= MAX_DESCRIPTION_IMAGES;

  // Keep internal HTML content and DOM innerHTML in sync when value or mode changes
  useEffect(() => {
    setHtmlContent(value || "");
    if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value, isHtmlMode, isFullScreen]);

  // Ensure DOM innerHTML is populated on initial mount
  useEffect(() => {
    if (editorRef.current && !isHtmlMode) {
      editorRef.current.innerHTML = value || "";
    }
  }, []);

  // Handle Escape key to exit full screen mode
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isFullScreen) {
        setIsFullScreen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFullScreen]);

  // Lock body scrolling when full screen mode is active so background page stays 100% fixed
  useEffect(() => {
    if (isFullScreen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [isFullScreen]);

  const handleInput = () => {
    if (editorRef.current) {
      const currentHtml = editorRef.current.innerHTML;
      setHtmlContent(currentHtml);
      if (onChange) onChange(currentHtml);
    }
  };

  const handleRawHtmlChange = (e) => {
    const val = e.target.value;
    setHtmlContent(val);
    if (onChange) onChange(val);
  };

  // Handle Paste: Strips unwanted external background colors & dirty inline styles, pasting clean plain text
  const handlePaste = (e) => {
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData("text/plain");

    if (document.queryCommandSupported("insertText")) {
      document.execCommand("insertText", false, text);
    } else {
      const selection = window.getSelection();
      if (!selection.rangeCount) return;
      selection.deleteFromDocument();
      selection.getRangeAt(0).insertNode(document.createTextNode(text));
    }
    handleInput();
  };

  // Click handler on editor to detect when user clicks on an image
  const handleEditorClick = (e) => {
    const target = e.target;
    // Clear previously highlighted images
    if (editorRef.current) {
      const imgs = editorRef.current.querySelectorAll("img");
      imgs.forEach((img) => img.classList.remove("selected-editor-img"));
    }

    if (target && target.tagName === "IMG") {
      target.classList.add("selected-editor-img");
      setSelectedImg(target);

      // Inspect style attributes
      const style = target.style;
      setImgWidth(style.width || target.getAttribute("width") || "100%");

      if (style.float === "left") setImgAlign("left");
      else if (style.float === "right") setImgAlign("right");
      else if (style.display === "inline" || style.display === "inline-block") setImgAlign("inline");
      else if (style.marginLeft === "auto" && style.marginRight === "auto") setImgAlign("center");
      else if (style.width === "100%" || style.display === "block") setImgAlign("full");
      else setImgAlign("center");

      setImgRounded(style.borderRadius !== "0px" && style.borderRadius !== "");
      setImgShadow(style.boxShadow !== "none" && style.boxShadow !== "");
      setImgAlt(target.getAttribute("alt") || "");

      const parentLink = target.closest("a");
      setImgLink(parentLink ? parentLink.getAttribute("href") || "" : "");
    } else {
      setSelectedImg(null);
    }
  };

  // Helper to execute standard editor commands
  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Helper to wrap selected text in custom inline span styles
  const applyInlineStyle = (styleName, styleValue) => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;
    const range = selection.getRangeAt(0);

    if (range.collapsed) {
      if (editorRef.current) editorRef.current.focus();
      return;
    }

    const span = document.createElement("span");
    span.style[styleName] = styleValue;

    try {
      span.appendChild(range.extractContents());
      range.insertNode(span);
      selection.removeAllRanges();
    } catch (e) {
      execCmd("styleWithCSS", true);
    }
    handleInput();
  };

  // Clear Background Highlight from selected text
  const clearHighlight = () => {
    const selection = window.getSelection();
    if (!selection.rangeCount) return;

    try {
      document.execCommand("hiliteColor", false, "inherit");
      document.execCommand("backColor", false, "inherit");
    } catch (e) {}

    if (editorRef.current) {
      const allSpans = editorRef.current.querySelectorAll("span, mark, [style*='background']");
      allSpans.forEach((el) => {
        if (selection.containsNode(el, true)) {
          el.style.backgroundColor = "";
          el.style.background = "";
          const styleAttr = el.getAttribute("style");
          if (!styleAttr || styleAttr.trim() === "" || styleAttr.trim() === ";") {
            el.removeAttribute("style");
          }
        }
      });
    }

    if (editorRef.current) editorRef.current.focus();
    handleInput();
  };

  // Change Font Size by px or stepper (+ / -)
  const handleFontSizeChange = (sizeInPx) => {
    setFontSize(sizeInPx);
    applyInlineStyle("fontSize", sizeInPx);
  };

  const stepFontSize = (delta) => {
    const sizes = [12, 14, 16, 18, 20, 24, 32];
    const currentPx = parseInt(fontSize, 10) || 14;
    let nextIdx = sizes.findIndex((s) => s >= currentPx);
    if (nextIdx === -1) nextIdx = 1;

    let targetIdx = Math.max(0, Math.min(sizes.length - 1, nextIdx + delta));
    const targetPx = `${sizes[targetIdx]}px`;
    handleFontSizeChange(targetPx);
  };

  // Change Font Weight
  const handleFontWeightChange = (weight) => {
    setFontWeight(weight);
    applyInlineStyle("fontWeight", weight);
  };

  // ── Image Insertion Logic (Up to 7 Images Max) ────────────────────────────
  const insertImageHtml = (srcUrl, alt = "") => {
    if (!srcUrl) return;

    if (imageCount >= MAX_DESCRIPTION_IMAGES) {
      alert(`Maximum limit of ${MAX_DESCRIPTION_IMAGES} images per description reached.`);
      return;
    }

    const imgTag = `<img src="${srcUrl}" alt="${alt || "Product Detail Image"}" draggable="true" style="width: 100%; max-width: 100%; height: auto; border-radius: 12px; display: block; margin: 16px auto;" />`;

    if (editorRef.current) {
      editorRef.current.focus();
      document.execCommand("insertHTML", false, imgTag);
      handleInput();
    }
    setShowImageModal(false);
    setImageUrlInput("");
    setImageAltInput("");
  };

  /**
   * Upload the selected file to the backend (ImageKit) and insert the returned
   * public URL. NEVER embed base64 data URLs — a single encoded image can be
   * 100KB+ of text, which instantly blows the description length limit.
   */
  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (imageCount >= MAX_DESCRIPTION_IMAGES) {
      alert(`Maximum limit of ${MAX_DESCRIPTION_IMAGES} images per description reached.`);
      return;
    }

    // Reset input so selecting the same file again still fires onChange
    e.target.value = "";
    setIsUploadingImage(true);

    try {
      const res = await uploadDescriptionImageApi(file);
      if (res && res.success && res.url) {
        insertImageHtml(res.url, imageAltInput || file.name.replace(/\.[^.]+$/, ""));
      } else {
        alert(res?.message || "Image upload failed. Please try again.");
      }
    } catch (err) {
      console.error("Description image upload error:", err);
      alert(err?.response?.data?.message || "Image upload failed. Please check your connection and try again.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  // ── Image Adjustment Logic (Live Updating Selected Image) ──────────────────
  const applyImageChanges = (newWidth, newAlign, newRounded, newShadow, newAlt, newLink) => {
    if (!selectedImg) return;

    // Width & Aspect Ratio
    selectedImg.style.width = newWidth;
    selectedImg.style.maxWidth = "100%";
    selectedImg.style.height = "auto";

    // Alignment & Float
    if (newAlign === "left") {
      selectedImg.style.float = "left";
      selectedImg.style.display = "inline-block";
      selectedImg.style.margin = "8px 16px 12px 0";
    } else if (newAlign === "right") {
      selectedImg.style.float = "right";
      selectedImg.style.display = "inline-block";
      selectedImg.style.margin = "8px 0 12px 16px";
    } else if (newAlign === "inline") {
      selectedImg.style.float = "none";
      selectedImg.style.display = "inline-block";
      selectedImg.style.margin = "0 6px";
      selectedImg.style.verticalAlign = "middle";
    } else if (newAlign === "center") {
      selectedImg.style.float = "none";
      selectedImg.style.display = "block";
      selectedImg.style.marginLeft = "auto";
      selectedImg.style.marginRight = "auto";
      selectedImg.style.marginBottom = "16px";
      selectedImg.style.marginTop = "16px";
    } else if (newAlign === "full") {
      selectedImg.style.float = "none";
      selectedImg.style.display = "block";
      selectedImg.style.width = "100%";
      selectedImg.style.margin = "16px 0";
    }

    // Styling
    selectedImg.style.borderRadius = newRounded ? "12px" : "0px";
    selectedImg.style.boxShadow = newShadow ? "0 10px 25px -5px rgba(0, 0, 0, 0.3)" : "none";

    // Alt text
    if (newAlt) {
      selectedImg.setAttribute("alt", newAlt);
    } else {
      selectedImg.removeAttribute("alt");
    }

    // Link handling
    const parentLink = selectedImg.closest("a");
    if (newLink && newLink.trim() !== "") {
      if (parentLink) {
        parentLink.setAttribute("href", newLink);
      } else {
        const a = document.createElement("a");
        a.setAttribute("href", newLink);
        a.setAttribute("target", "_blank");
        a.setAttribute("rel", "noopener noreferrer");
        selectedImg.parentNode.insertBefore(a, selectedImg);
        a.appendChild(selectedImg);
      }
    } else if (parentLink) {
      // Unwrap from link
      parentLink.parentNode.insertBefore(selectedImg, parentLink);
      parentLink.remove();
    }

    handleInput();
  };

  const deleteSelectedImage = () => {
    if (!selectedImg) return;
    const parentLink = selectedImg.closest("a");
    if (parentLink) {
      parentLink.remove();
    } else {
      selectedImg.remove();
    }
    setSelectedImg(null);
    handleInput();
  };

  // Numeric slider value helper (convert e.g. "50%" or "300px" to number)
  const getNumericWidth = () => {
    if (!imgWidth) return 100;
    const val = parseInt(imgWidth, 10);
    return isNaN(val) ? 100 : val;
  };

  // Color options
  const defaultColors = [
    { color: "inherit", title: "Auto (Theme Adaptive)" },
    { color: "#ffffff", title: "White" },
    { color: "#000000", title: "Black" },
    { color: "#eab308", title: "Yellow" },
    { color: "#ef4444", title: "Red" },
    { color: "#3b82f6", title: "Blue" },
    { color: "#22c55e", title: "Green" },
    { color: "#9ca3af", title: "Gray" },
    { color: "#f97316", title: "Orange" },
    { color: "#a855f7", title: "Purple" },
  ];

  const defaultBgColors = [
    { color: "transparent", title: "Clear" },
    { color: "#000000", title: "Black" },
    { color: "#ffffff", title: "White" },
    { color: "#eab308", title: "Yellow" },
    { color: "#ef4444", title: "Red" },
    { color: "#3b82f6", title: "Blue" },
    { color: "#22c55e", title: "Green" },
    { color: "#27272a", title: "Dark Gray" },
  ];

  // Helper render method for the Editor Toolbar & Canvas
  const renderEditorUI = () => (
    <div
      onWheel={(e) => {
        if (isFullScreen) e.stopPropagation();
      }}
      className={
        isFullScreen
          ? "fixed inset-0 z-[99999] bg-background flex flex-col w-screen h-screen overflow-hidden animate-fadeIn"
          : "border border-border-theme rounded-2xl bg-surface overflow-hidden shadow-sm transition focus-within:border-accent/60 relative"
      }
    >
      {/* 🛠️ Header Bar in Full Screen Mode */}
      {isFullScreen && (
        <div className="flex items-center justify-between bg-surface border-b border-border-theme px-6 py-3 shadow-md shrink-0">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-xl bg-accent/10 border border-accent/30 text-accent flex items-center justify-center font-bold text-sm">
              ✨
            </span>
            <div>
              <h2 className="text-sm font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <span>Product Description Canvas</span>
                <span className="text-[10px] font-bold text-accent bg-accent/10 px-2 py-0.5 rounded-md border border-accent/20">
                  Storefront Live Preview
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Image Counter Badge */}
            <span
              className={`px-3 py-1 rounded-xl text-xs font-extrabold border transition ${
                isMaxImagesReached
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : "bg-surface text-foreground/80 border-border-theme"
              }`}
              title={`Description Images: ${imageCount} of ${MAX_DESCRIPTION_IMAGES} used`}
            >
              🖼️ Images: {imageCount} / {MAX_DESCRIPTION_IMAGES}
            </span>

            {/* HTML / Visual Toggle */}
            <button
              type="button"
              onClick={() => {
                setIsHtmlMode(!isHtmlMode);
                setSelectedImg(null);
              }}
              title="Toggle HTML Source Code View"
              className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold border transition cursor-pointer ${
                isHtmlMode
                  ? "bg-accent text-accent-content border-accent shadow-sm"
                  : "bg-surface text-foreground/70 border-border-theme hover:text-foreground"
              }`}
            >
              {isHtmlMode ? "👁️ Visual" : "</> HTML"}
            </button>

            {/* Exit Full Screen Button */}
            <button
              type="button"
              onClick={() => setIsFullScreen(false)}
              className="flex items-center gap-1.5 px-3.5 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl text-xs font-extrabold transition cursor-pointer border border-red-500/30 shadow-sm"
            >
              <i className="ri-close-line text-base" />
              <span>Close Full Screen (Esc)</span>
            </button>
          </div>
        </div>
      )}

      {/* 🛠️ WooCommerce Formatting Toolbar */}
      <div className="bg-background/80 border-b border-border-theme p-2 flex flex-wrap items-center gap-1.5 text-foreground text-xs select-none shrink-0">
        
        {/* Font Weight Selector */}
        <select
          value={fontWeight}
          onChange={(e) => handleFontWeightChange(e.target.value)}
          title="Font Weight / Style"
          className="bg-surface border border-border-theme/80 rounded-lg px-2 py-1 text-xs font-semibold text-foreground outline-none hover:border-accent cursor-pointer"
        >
          <option value="100">Thin (100)</option>
          <option value="300">Light (300)</option>
          <option value="400">Normal (400)</option>
          <option value="600">Semi-Bold (600)</option>
          <option value="700">Bold (700)</option>
          <option value="800">Extra-Bold (800)</option>
          <option value="900">Black (900)</option>
        </select>

        <div className="w-px h-5 bg-border-theme/60 mx-1" />

        {/* Font Size Dropdown & Stepper */}
        <div className="flex items-center gap-0.5 bg-surface border border-border-theme/80 rounded-lg overflow-hidden p-0.5">
          <button
            type="button"
            onClick={() => stepFontSize(-1)}
            title="Decrease Font Size (-)"
            className="px-1.5 py-0.5 hover:bg-background rounded font-bold text-foreground/70 hover:text-foreground transition cursor-pointer"
          >
            A-
          </button>
          <select
            value={fontSize}
            onChange={(e) => handleFontSizeChange(e.target.value)}
            title="Font Size"
            className="bg-transparent border-none text-xs font-bold text-foreground outline-none cursor-pointer px-1"
          >
            <option value="12px">12px</option>
            <option value="14px">14px</option>
            <option value="16px">16px</option>
            <option value="18px">18px</option>
            <option value="20px">20px</option>
            <option value="24px">24px</option>
            <option value="32px">32px</option>
          </select>
          <button
            type="button"
            onClick={() => stepFontSize(1)}
            title="Increase Font Size (+)"
            className="px-1.5 py-0.5 hover:bg-background rounded font-bold text-foreground/70 hover:text-foreground transition cursor-pointer"
          >
            A+
          </button>
        </div>

        <div className="w-px h-5 bg-border-theme/60 mx-1" />

        {/* Formatting Buttons (Bold, Italic, Underline, Strikethrough) */}
        <button
          type="button"
          onClick={() => execCmd("bold")}
          title="Bold (Ctrl+B)"
          className="p-1.5 hover:bg-surface rounded-lg border border-transparent hover:border-border-theme font-black text-xs transition cursor-pointer"
        >
          <i className="ri-bold" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("italic")}
          title="Italic (Ctrl+I)"
          className="p-1.5 hover:bg-surface rounded-lg border border-transparent hover:border-border-theme font-bold text-xs transition cursor-pointer"
        >
          <i className="ri-italic" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("underline")}
          title="Underline (Ctrl+U)"
          className="p-1.5 hover:bg-surface rounded-lg border border-transparent hover:border-border-theme font-bold text-xs transition cursor-pointer"
        >
          <i className="ri-underline" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("strikethrough")}
          title="Strikethrough"
          className="p-1.5 hover:bg-surface rounded-lg border border-transparent hover:border-border-theme font-bold text-xs transition cursor-pointer"
        >
          <i className="ri-strikethrough" />
        </button>

        <div className="w-px h-5 bg-border-theme/60 mx-1" />

        {/* Alignments */}
        <button
          type="button"
          onClick={() => execCmd("justifyLeft")}
          title="Align Left"
          className="p-1.5 hover:bg-surface rounded-lg border border-transparent hover:border-border-theme text-xs transition cursor-pointer"
        >
          <i className="ri-align-left" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("justifyCenter")}
          title="Align Center"
          className="p-1.5 hover:bg-surface rounded-lg border border-transparent hover:border-border-theme text-xs transition cursor-pointer"
        >
          <i className="ri-align-center" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("justifyRight")}
          title="Align Right"
          className="p-1.5 hover:bg-surface rounded-lg border border-transparent hover:border-border-theme text-xs transition cursor-pointer"
        >
          <i className="ri-align-right" />
        </button>

        <div className="w-px h-5 bg-border-theme/60 mx-1" />

        {/* Bullet & Numbered Lists */}
        <button
          type="button"
          onClick={() => execCmd("insertUnorderedList")}
          title="Bullet List"
          className="p-1.5 hover:bg-surface rounded-lg border border-transparent hover:border-border-theme text-xs transition cursor-pointer"
        >
          <i className="ri-list-unordered" />
        </button>
        <button
          type="button"
          onClick={() => execCmd("insertOrderedList")}
          title="Numbered List"
          className="p-1.5 hover:bg-surface rounded-lg border border-transparent hover:border-border-theme text-xs transition cursor-pointer"
        >
          <i className="ri-list-ordered" />
        </button>

        <div className="w-px h-5 bg-border-theme/60 mx-1" />

        {/* 🎨 Text Color Section */}
        <div className="flex items-center gap-1 bg-surface border border-border-theme/80 rounded-lg p-1" title="Text Color">
          <span className="text-[10px] font-bold text-foreground/60 px-1">A:</span>
          {defaultColors.map((c) => (
            <button
              key={c.color}
              type="button"
              onClick={() => {
                if (c.color === "inherit") {
                  applyInlineStyle("color", "inherit");
                } else {
                  execCmd("foreColor", c.color);
                }
              }}
              title={`Text Color: ${c.title}`}
              className="w-3.5 h-3.5 rounded-full border border-border-theme hover:scale-125 transition cursor-pointer shadow-sm relative flex items-center justify-center overflow-hidden shrink-0"
              style={{ backgroundColor: c.color === "inherit" ? "transparent" : c.color }}
            >
              {c.color === "inherit" && (
                <div className="w-full h-full flex">
                  <div className="w-1/2 h-full bg-white" />
                  <div className="w-1/2 h-full bg-black" />
                </div>
              )}
            </button>
          ))}
          <label title="Pick Custom Text Color" className="w-4 h-4 rounded-full border border-border-theme overflow-hidden cursor-pointer relative flex items-center justify-center bg-gradient-to-tr from-indigo-500 via-pink-500 to-yellow-400 hover:scale-110 transition">
            <input
              type="color"
              value={customTextColor}
              onChange={(e) => {
                setCustomTextColor(e.target.value);
                execCmd("foreColor", e.target.value);
              }}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>

        {/* 🖌️ Text Background Color Section */}
        <div className="flex items-center gap-1 bg-surface border border-border-theme/80 rounded-lg p-1" title="Text Background Highlight Color">
          <span className="text-[10px] font-bold text-foreground/60 px-1">Bg:</span>
          {defaultBgColors.map((c) => (
            <button
              key={c.color}
              type="button"
              onClick={() => {
                if (c.color === "transparent") {
                  clearHighlight();
                } else {
                  applyInlineStyle("backgroundColor", c.color);
                }
              }}
              title={`Highlight: ${c.title}`}
              className="w-3.5 h-3.5 rounded-sm border border-border-theme hover:scale-125 transition cursor-pointer shadow-sm relative flex items-center justify-center"
              style={{ backgroundColor: c.color === "transparent" ? "#3f3f46" : c.color }}
            >
              {c.color === "transparent" && <span className="text-[8px] font-bold text-white">✕</span>}
            </button>
          ))}
          <label title="Pick Custom Highlight Background Color" className="w-4 h-4 rounded-sm border border-border-theme overflow-hidden cursor-pointer relative flex items-center justify-center bg-gradient-to-tr from-emerald-400 via-sky-400 to-purple-500 hover:scale-110 transition">
            <input
              type="color"
              value={customBgColor}
              onChange={(e) => {
                setCustomBgColor(e.target.value);
                applyInlineStyle("backgroundColor", e.target.value);
              }}
              className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
            />
          </label>
        </div>

        <div className="w-px h-5 bg-border-theme/60 mx-1" />

        {/* 🖼️ INSERT IMAGE BUTTON WITH MAX 7 COUNTER BADGE */}
        <button
          type="button"
          disabled={isMaxImagesReached}
          onClick={() => setShowImageModal(true)}
          title={isMaxImagesReached ? "Limit of 7 description images reached" : "Insert Image anywhere inside Description (Up to 7)"}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-xs font-bold transition cursor-pointer ${
            isMaxImagesReached
              ? "bg-surface text-foreground/40 border-border-theme cursor-not-allowed opacity-60"
              : "bg-accent/10 hover:bg-accent text-accent hover:text-accent-content border-accent/30"
          }`}
        >
          <i className="ri-image-add-line text-sm" />
          <span>Add Image</span>
        </button>

        {!isFullScreen && (
          <>
            {/* Image Counter Badge (Normal View) */}
            <span
              className={`px-2 py-0.5 rounded-md text-[10px] font-extrabold border transition ${
                isMaxImagesReached
                  ? "bg-red-500/10 text-red-500 border-red-500/30"
                  : "bg-surface text-foreground/70 border-border-theme"
              }`}
              title={`Description Images: ${imageCount} of ${MAX_DESCRIPTION_IMAGES} used`}
            >
              🖼️ {imageCount} / {MAX_DESCRIPTION_IMAGES}
            </span>

            {/* Full-Screen Expand Button (Normal View) */}
            <button
              type="button"
              onClick={() => setIsFullScreen(true)}
              title="Expand to Full-Screen Canvas (Storefront Live View)"
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border-theme bg-surface hover:bg-background text-foreground/80 hover:text-foreground text-xs font-bold transition cursor-pointer ml-1"
            >
              <i className="ri-fullscreen-line text-sm" />
              <span>Full Screen</span>
            </button>

            {/* HTML / Visual Toggle (Normal View) */}
            <div className="ml-auto flex items-center">
              <button
                type="button"
                onClick={() => {
                  setIsHtmlMode(!isHtmlMode);
                  setSelectedImg(null);
                }}
                title="Toggle HTML Source Code View"
                className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold border transition cursor-pointer ${
                  isHtmlMode
                    ? "bg-accent text-accent-content border-accent shadow-sm"
                    : "bg-surface text-foreground/70 border-border-theme hover:text-foreground"
                }`}
              >
                {isHtmlMode ? "👁️ Visual" : "</> HTML"}
              </button>
            </div>
          </>
        )}
      </div>

      {/* ⚙️ INTERACTIVE IMAGE ADJUSTER & RESIZER TOOLBAR (Shows when an image is clicked) */}
      {selectedImg && !isHtmlMode && (
        <div className="bg-surface/95 backdrop-blur border-b border-border-theme p-3 flex flex-wrap items-center gap-3 text-xs shadow-md animate-fadeIn z-10 shrink-0">
          <div className="flex items-center gap-1.5 text-accent font-extrabold shrink-0">
            <i className="ri-image-edit-line text-sm" />
            <span>Resize Image:</span>
          </div>

          {/* Width Presets */}
          <div className="flex items-center gap-1 bg-background border border-border-theme p-0.5 rounded-lg shrink-0">
            <span className="text-[10px] text-foreground/60 px-1 font-bold">Width:</span>
            {["15%", "25%", "50%", "75%", "100%"].map((w) => (
              <button
                key={w}
                type="button"
                onClick={() => {
                  setImgWidth(w);
                  applyImageChanges(w, imgAlign, imgRounded, imgShadow, imgAlt, imgLink);
                }}
                className={`px-2 py-0.5 rounded text-[11px] font-bold transition cursor-pointer ${
                  imgWidth === w ? "bg-accent text-accent-content" : "hover:bg-surface text-foreground/70"
                }`}
              >
                {w}
              </button>
            ))}
          </div>

          {/* Interactive Range Slider Resizer */}
          <div className="flex items-center gap-2 bg-background border border-border-theme px-2.5 py-1 rounded-lg shrink-0" title="Drag slider to adjust image size smoothly">
            <i className="ri-aspect-ratio-line text-foreground/50 text-xs" />
            <input
              type="range"
              min="10"
              max="100"
              value={getNumericWidth()}
              onChange={(e) => {
                const newW = `${e.target.value}%`;
                setImgWidth(newW);
                applyImageChanges(newW, imgAlign, imgRounded, imgShadow, imgAlt, imgLink);
              }}
              className="w-24 accent-accent cursor-pointer h-1.5 bg-surface rounded-lg"
            />
            <span className="text-[11px] font-mono font-bold text-accent min-w-[36px]">
              {imgWidth}
            </span>
          </div>

          {/* Alignment & Float Selector */}
          <div className="flex items-center gap-1 bg-background border border-border-theme p-0.5 rounded-lg shrink-0">
            <span className="text-[10px] text-foreground/60 px-1 font-bold">Align:</span>
            <button
              type="button"
              onClick={() => {
                setImgAlign("left");
                applyImageChanges(imgWidth, "left", imgRounded, imgShadow, imgAlt, imgLink);
              }}
              title="Float Left (Text wraps around image)"
              className={`p-1 px-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                imgAlign === "left" ? "bg-accent text-accent-content" : "hover:bg-surface text-foreground/70"
              }`}
            >
              <i className="ri-align-left" /> Left
            </button>
            <button
              type="button"
              onClick={() => {
                setImgAlign("center");
                applyImageChanges(imgWidth, "center", imgRounded, imgShadow, imgAlt, imgLink);
              }}
              title="Center Block"
              className={`p-1 px-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                imgAlign === "center" ? "bg-accent text-accent-content" : "hover:bg-surface text-foreground/70"
              }`}
            >
              <i className="ri-align-center" /> Center
            </button>
            <button
              type="button"
              onClick={() => {
                setImgAlign("right");
                applyImageChanges(imgWidth, "right", imgRounded, imgShadow, imgAlt, imgLink);
              }}
              title="Float Right (Text wraps around left)"
              className={`p-1 px-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                imgAlign === "right" ? "bg-accent text-accent-content" : "hover:bg-surface text-foreground/70"
              }`}
            >
              <i className="ri-align-right" /> Right
            </button>
            <button
              type="button"
              onClick={() => {
                setImgAlign("full");
                setImgWidth("100%");
                applyImageChanges("100%", "full", imgRounded, imgShadow, imgAlt, imgLink);
              }}
              title="Full Width Block"
              className={`p-1 px-1.5 rounded transition cursor-pointer flex items-center gap-1 ${
                imgAlign === "full" ? "bg-accent text-accent-content" : "hover:bg-surface text-foreground/70"
              }`}
            >
              <i className="ri-aspect-ratio-line" /> Full
            </button>
          </div>

          {/* Style Toggles (Rounded & Shadow) */}
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => {
                const next = !imgRounded;
                setImgRounded(next);
                applyImageChanges(imgWidth, imgAlign, next, imgShadow, imgAlt, imgLink);
              }}
              className={`px-2 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                imgRounded ? "bg-accent/20 border-accent text-accent" : "border-border-theme text-foreground/60"
              }`}
            >
              <i className="ri-rounded-corner" /> Rounded
            </button>

            <button
              type="button"
              onClick={() => {
                const next = !imgShadow;
                setImgShadow(next);
                applyImageChanges(imgWidth, imgAlign, imgRounded, next, imgAlt, imgLink);
              }}
              className={`px-2 py-1 rounded-lg border text-xs font-semibold transition cursor-pointer ${
                imgShadow ? "bg-accent/20 border-accent text-accent" : "border-border-theme text-foreground/60"
              }`}
            >
              <i className="ri-shadow-line" /> Shadow
            </button>
          </div>

          {/* Delete Image */}
          <button
            type="button"
            onClick={deleteSelectedImage}
            title="Delete Image from description"
            className="ml-auto px-2.5 py-1 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg border border-red-500/30 text-xs font-bold transition cursor-pointer flex items-center gap-1 shrink-0"
          >
            <i className="ri-delete-bin-line" /> Delete
          </button>
        </div>
      )}

      {/* 📝 Content Area (Clean single scrollable container matching storefront width) */}
      <div className={isFullScreen ? "flex-1 overflow-y-auto min-h-0 p-4 sm:p-10 flex flex-col items-center bg-background/60" : "w-full"}>
        <div className={isFullScreen ? "w-full max-w-[1392px] bg-surface border border-border-theme p-6 sm:p-10 rounded-3xl shadow-2xl space-y-4 my-6 shrink-0" : "w-full"}>
          {isHtmlMode ? (
            <textarea
              value={htmlContent}
              onChange={handleRawHtmlChange}
              placeholder={placeholder}
              rows={isFullScreen ? 24 : 8}
              className={`w-full p-4 bg-surface text-foreground font-mono text-xs outline-none ${isFullScreen ? "min-h-[500px] resize-none" : "resize-y"}`}
            />
          ) : (
            <div
              ref={editorRef}
              contentEditable
              onInput={handleInput}
              onBlur={handleInput}
              onClick={handleEditorClick}
              onPaste={handlePaste}
              placeholder={placeholder}
              className={`w-full ${
                isFullScreen ? "min-h-[500px] overflow-visible" : "min-h-[160px]"
              } bg-surface text-foreground text-sm outline-none focus:outline-none rich-description-render max-w-none leading-relaxed`}
              style={{ minHeight: isFullScreen ? "500px" : "160px" }}
            />
          )}
        </div>
      </div>

      {/* 🖼️ INSERT IMAGE MODAL */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-[100000] flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface border border-border-theme rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl space-y-4 p-6">
            <div className="flex items-center justify-between border-b border-border-theme pb-3">
              <h3 className="text-base font-extrabold text-foreground flex items-center gap-2">
                <i className="ri-image-add-line text-accent text-lg" />
                <span>Insert Image in Description ({imageCount}/{MAX_DESCRIPTION_IMAGES})</span>
              </h3>
              <button
                type="button"
                onClick={() => setShowImageModal(false)}
                className="w-8 h-8 rounded-full hover:bg-background flex items-center justify-center text-foreground/70 hover:text-foreground text-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Tab selector */}
            <div className="flex border-b border-border-theme text-xs font-bold gap-1 overflow-x-auto">
              <button
                type="button"
                onClick={() => setImageTab("library")}
                className={`py-2 px-3 border-b-2 transition cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  imageTab === "library"
                    ? "border-accent text-accent"
                    : "border-transparent text-foreground/60 hover:text-foreground"
                }`}
              >
                🖼️ Product Media ({productImages ? productImages.length : 0})
              </button>

              <button
                type="button"
                onClick={() => setImageTab("upload")}
                className={`py-2 px-3 border-b-2 transition cursor-pointer shrink-0 ${
                  imageTab === "upload"
                    ? "border-accent text-accent"
                    : "border-transparent text-foreground/60 hover:text-foreground"
                }`}
              >
                📁 Upload New File
              </button>

              <button
                type="button"
                onClick={() => setImageTab("url")}
                className={`py-2 px-3 border-b-2 transition cursor-pointer shrink-0 ${
                  imageTab === "url"
                    ? "border-accent text-accent"
                    : "border-transparent text-foreground/60 hover:text-foreground"
                }`}
              >
                🔗 Web URL
              </button>
            </div>

            {/* Tab 1: Product Media Library */}
            {imageTab === "library" && (
              <div className="space-y-3 pt-2">
                <p className="text-xs text-foreground/70">
                  Select an existing uploaded product image to insert into description (No extra ImageKit upload):
                </p>
                {!productImages || productImages.length === 0 ? (
                  <div className="border border-dashed border-border-theme rounded-xl p-8 text-center text-xs text-foreground/50 space-y-2">
                    <i className="ri-image-line text-3xl text-foreground/30 block" />
                    <p className="font-semibold">No product images uploaded yet.</p>
                    <p className="text-[11px] text-foreground/40">
                      Upload main or gallery images above, or use the "Upload New File" tab.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 max-h-60 overflow-y-auto p-1">
                    {productImages.map((imgUrl, index) => (
                      <div
                        key={index}
                        onClick={() => insertImageHtml(imgUrl, "Product Detail Image")}
                        className="group relative aspect-square rounded-xl overflow-hidden border border-border-theme hover:border-accent cursor-pointer transition shadow-sm bg-background"
                      >
                        <img
                          src={imgUrl}
                          alt={`Product Image ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                        />
                        <div className="absolute inset-0 bg-accent/80 opacity-0 group-hover:opacity-100 flex items-center justify-center text-accent-content font-extrabold text-[11px] text-center p-1 transition shadow-inner">
                          + Insert
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab 2: Upload File */}
            {imageTab === "upload" && (
              <div className="space-y-4 pt-2">
                <div
                  onClick={() => {
                    if (!isUploadingImage) fileInputRef.current?.click();
                  }}
                  className={`border-2 border-dashed rounded-xl p-8 text-center transition group bg-background/50 ${
                    isUploadingImage
                      ? "border-accent/50 opacity-60 cursor-wait"
                      : "border-border-theme hover:border-accent cursor-pointer"
                  }`}
                >
                  {isUploadingImage ? (
                    <>
                      <i className="ri-loader-4-line text-4xl text-accent animate-spin inline-block" />
                      <p className="mt-2 text-xs font-bold text-accent">Uploading image to ImageKit…</p>
                      <p className="text-[11px] text-foreground/50 mt-1">Please wait a moment</p>
                    </>
                  ) : (
                    <>
                      <i className="ri-upload-cloud-2-line text-4xl text-foreground/40 group-hover:text-accent transition" />
                      <p className="mt-2 text-xs font-bold text-foreground">Click to select an image from your computer</p>
                      <p className="text-[11px] text-foreground/50 mt-1">Supports PNG, JPG, WebP, GIF (Max {MAX_DESCRIPTION_IMAGES} images)</p>
                    </>
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={isUploadingImage}
                  className="hidden"
                />
              </div>
            )}

            {/* Tab 3: URL Input */}
            {imageTab === "url" && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-foreground/70 block mb-1">Image URL</label>
                  <input
                    type="url"
                    value={imageUrlInput}
                    onChange={(e) => setImageUrlInput(e.target.value)}
                    placeholder="https://example.com/product-banner.jpg"
                    className="w-full bg-background border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-foreground/70 block mb-1">Alt Text (Optional for SEO)</label>
                  <input
                    type="text"
                    value={imageAltInput}
                    onChange={(e) => setImageAltInput(e.target.value)}
                    placeholder="e.g. Size Chart Diagram"
                    className="w-full bg-background border border-border-theme rounded-xl px-3 py-2 text-xs text-foreground outline-none focus:border-accent"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowImageModal(false)}
                    className="px-4 py-2 bg-background border border-border-theme text-foreground rounded-xl text-xs font-bold hover:bg-surface transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={!imageUrlInput.trim()}
                    onClick={() => insertImageHtml(imageUrlInput, imageAltInput)}
                    className="px-5 py-2 bg-accent text-accent-content rounded-xl text-xs font-extrabold hover:brightness-110 transition disabled:opacity-50"
                  >
                    Insert Image
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <>
      {/* In-Place Normal Form Field View */}
      {!isFullScreen && renderEditorUI()}

      {/* React Portal Full-Screen Canvas Overlay Attached Directly to document.body */}
      {isFullScreen && createPortal(renderEditorUI(), document.body)}
    </>
  );
};

export default RichTextEditor;
