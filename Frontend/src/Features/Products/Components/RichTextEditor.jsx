import React, { useRef, useState, useEffect } from "react";

/**
 * WooCommerce-style Rich Text Editor for Product Descriptions
 * Supports: Bold, Italic, Underline, Strikethrough, Font Weights (Thin, Normal, SemiBold, Bold, ExtraBold),
 * Font Sizes (12px to 32px), Font Size +/- steppers, Text Alignments, Bullet/Numbered Lists,
 * Text Colors (with presets including Black & White + Custom Color Picker), Text Background Colors (presets + Custom Color Picker), and Visual/HTML modes.
 */
const RichTextEditor = ({ value = "", onChange, placeholder = "Enter product description..." }) => {
  const editorRef = useRef(null);
  const [isHtmlMode, setIsHtmlMode] = useState(false);
  const [htmlContent, setHtmlContent] = useState(value || "");
  const [fontSize, setFontSize] = useState("14px");
  const [fontWeight, setFontWeight] = useState("400");
  const [customTextColor, setCustomTextColor] = useState("#ffffff");
  const [customBgColor, setCustomBgColor] = useState("#eab308");

  // Keep internal HTML content in sync when external value prop changes
  useEffect(() => {
    if (value !== htmlContent) {
      setHtmlContent(value || "");
      if (editorRef.current && editorRef.current.innerHTML !== (value || "")) {
        editorRef.current.innerHTML = value || "";
      }
    }
  }, [value]);

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

  // Helper to execute standard editor commands
  const execCmd = (command, value = null) => {
    document.execCommand(command, false, value);
    if (editorRef.current) {
      editorRef.current.focus();
      handleInput();
    }
  };

  // Helper to wrap selected text in custom inline span styles (Font Weight, Font Size, Background Color)
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
    const range = selection.getRangeAt(0);

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

  // Change Font Weight (Thin: 100, Normal: 400, SemiBold: 600, Bold: 700, ExtraBold: 800)
  const handleFontWeightChange = (weight) => {
    setFontWeight(weight);
    applyInlineStyle("fontWeight", weight);
  };

  // Default color options including White & Black
  const defaultColors = [
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

  return (
    <div className="border border-border-theme rounded-2xl bg-surface overflow-hidden shadow-sm transition focus-within:border-accent/60">
      {/* 🛠️ WooCommerce Rich Formatting Toolbar */}
      <div className="bg-background/80 border-b border-border-theme p-2 flex flex-wrap items-center gap-1.5 text-foreground text-xs select-none">
        
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

        {/* 🎨 Text Color Section (Presets + Custom Color Picker) */}
        <div className="flex items-center gap-1 bg-surface border border-border-theme/80 rounded-lg p-1" title="Text Color">
          <span className="text-[10px] font-bold text-foreground/60 px-1">A:</span>
          {defaultColors.map((c) => (
            <button
              key={c.color}
              type="button"
              onClick={() => execCmd("foreColor", c.color)}
              title={`Text Color: ${c.title}`}
              className="w-3.5 h-3.5 rounded-full border border-border-theme hover:scale-125 transition cursor-pointer shadow-sm"
              style={{ backgroundColor: c.color }}
            />
          ))}
          {/* Custom Text Color Picker */}
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

        {/* 🖌️ Text Background Color Section (Presets + Custom Picker) */}
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
          {/* Custom Background Color Picker */}
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

        {/* HTML / Visual Toggle */}
        <div className="ml-auto flex items-center">
          <button
            type="button"
            onClick={() => setIsHtmlMode(!isHtmlMode)}
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
      </div>

      {/* 📝 Content Area (Visual ContentEditable vs Raw HTML Textarea) */}
      {isHtmlMode ? (
        <textarea
          value={htmlContent}
          onChange={handleRawHtmlChange}
          placeholder={placeholder}
          rows={8}
          className="w-full p-4 bg-surface text-foreground font-mono text-xs outline-none resize-y"
        />
      ) : (
        <div
          ref={editorRef}
          contentEditable
          onInput={handleInput}
          onBlur={handleInput}
          onPaste={handlePaste}
          placeholder={placeholder}
          className="w-full min-h-[160px] max-h-[400px] overflow-y-auto p-4 bg-surface text-foreground text-sm outline-none focus:outline-none prose prose-invert max-w-none leading-relaxed"
          style={{ minHeight: "160px" }}
        />
      )}
    </div>
  );
};

export default RichTextEditor;
