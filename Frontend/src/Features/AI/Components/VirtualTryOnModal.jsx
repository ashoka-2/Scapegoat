import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

/**
 * Normalizes ImageKit URLs to clean, universally readable high-res JPGs for ChatGPT and Gemini
 */
export const getCleanImageUrl = (rawUrl) => {
  if (!rawUrl) return "";
  try {
    if (rawUrl.includes("ik.imagekit.io")) {
      const parts = rawUrl.split("/products/");
      if (parts.length === 2) {
        const baseUrl = parts[0].replace(/\/tr:[^/]+/, "");
        return `${baseUrl}/tr:f-jpg,q-95,w-1200/products/${parts[1]}`;
      }
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
};

/**
 * Creates a high-definition composite reference image of all outfit pieces on an HTML canvas
 * and writes the actual PNG image binary to the user's clipboard for direct Ctrl+V pasting into ChatGPT/Gemini
 */
const copyOutfitCompositeImageToClipboard = async (items, bundleTitle) => {
  try {
    const loadedImages = await Promise.all(
      items.map((item) => {
        return new Promise((resolve) => {
          if (!item.image) return resolve(null);
          const img = new Image();
          img.crossOrigin = "anonymous";
          img.onload = () => resolve({ img, item });
          img.onerror = () => resolve(null);
          img.src = getCleanImageUrl(item.image);
        });
      })
    );

    const validImages = loadedImages.filter(Boolean);
    if (validImages.length === 0) return false;

    // Dimensions for high-res lookbook board
    const cols = Math.min(validImages.length, 3);
    const cellW = 400;
    const cellH = 500;
    const padding = 24;
    const headerH = 70;
    const totalW = cols * cellW + (cols + 1) * padding;
    const rows = Math.ceil(validImages.length / cols);
    const totalH = headerH + rows * cellH + (rows + 1) * padding;

    const canvas = document.createElement("canvas");
    canvas.width = totalW;
    canvas.height = totalH;
    const ctx = canvas.getContext("2d");

    // Luxury Dark Background
    ctx.fillStyle = "#0f1117";
    ctx.fillRect(0, 0, totalW, totalH);

    // Title Header
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 24px sans-serif";
    ctx.fillText(`ScapeGoat Lookbook: ${bundleTitle || "Coordinated Outfit"}`, padding, 44);

    ctx.fillStyle = "#9ca3af";
    ctx.font = "14px monospace";
    ctx.fillText("Exact Garments Reference for Virtual Try-On", padding, 64);

    // Draw Garments Grid
    validImages.forEach(({ img, item }, idx) => {
      const c = idx % cols;
      const r = Math.floor(idx / cols);
      const x = padding + c * (cellW + padding);
      const y = headerH + padding + r * (cellH + padding);

      // Card Background
      ctx.fillStyle = "#1c1f2e";
      ctx.beginPath();
      ctx.roundRect(x, y, cellW, cellH, 16);
      ctx.fill();

      // Draw Image centered with cover/contain
      const imgPad = 16;
      const targetW = cellW - imgPad * 2;
      const targetH = cellH - 70;

      const scale = Math.min(targetW / img.width, targetH / img.height);
      const drawW = img.width * scale;
      const drawH = img.height * scale;
      const drawX = x + imgPad + (targetW - drawW) / 2;
      const drawY = y + imgPad + (targetH - drawH) / 2;

      ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Tier Badge & Title
      ctx.fillStyle = "#a855f7";
      ctx.font = "bold 12px sans-serif";
      ctx.fillText(item.tier.toUpperCase(), x + 16, y + cellH - 36);

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 13px sans-serif";
      const titleStr = item.title.length > 32 ? item.title.slice(0, 30) + "..." : item.title;
      ctx.fillText(titleStr, x + 16, y + cellH - 16);
    });

    // Write to clipboard as actual PNG Image
    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            resolve(true);
          } catch (clipErr) {
            console.warn("Clipboard write error:", clipErr);
            resolve(false);
          }
        } else {
          resolve(false);
        }
      }, "image/png");
    });
  } catch (err) {
    console.error("Composite image creation error:", err);
    return false;
  }
};

/**
 * Copies a single image to clipboard as PNG
 */
const copySingleImageToClipboard = async (imgUrl) => {
  try {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.src = getCleanImageUrl(imgUrl);
    await new Promise((resolve, reject) => {
      img.onload = resolve;
      img.onerror = reject;
    });

    const canvas = document.createElement("canvas");
    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 1000;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(img, 0, 0);

    return new Promise((resolve) => {
      canvas.toBlob(async (blob) => {
        if (blob) {
          try {
            await navigator.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            resolve(true);
          } catch {
            resolve(false);
          }
        } else {
          resolve(false);
        }
      }, "image/png");
    });
  } catch {
    return false;
  }
};

const VirtualTryOnModal = ({ isOpen, onClose, bundle }) => {
  const [copiedType, setCopiedType] = useState(null); // 'image' | 'prompt' | item title
  const [activeStep, setActiveStep] = useState(null); // 'chatgpt' | 'gemini' | null

  if (!isOpen || !bundle) return null;

  const items = bundle.items || [];

  const studioPromptText = `Please create an ultra-realistic 8k full-body fashion lookbook photograph of me wearing the exact outfit pieces shown in the attached reference image:

INSTRUCTIONS:
1. Replicate the EXACT clothing designs, colors, fabrics, textures, collars, cuts, and silhouettes from the attached outfit image onto my body.
2. Maintain my exact facial identity, skin tone, hairstyle, facial features, and physical build from the reference photo of me that I am attaching.
3. Place me in a clean modern Vogue fashion studio lookbook with soft cinematic lighting and 8k photorealistic detail.`;

  const handleCopyPromptText = () => {
    navigator.clipboard.writeText(studioPromptText);
    setCopiedType("prompt");
    setTimeout(() => setCopiedType(null), 3000);
  };

  const handleCopyEntireOutfitImage = async () => {
    const ok = await copyOutfitCompositeImageToClipboard(items, bundle.title);
    if (ok) {
      setCopiedType("image");
      setTimeout(() => setCopiedType(null), 3500);
    } else {
      handleCopyPromptText();
    }
  };

  const handleOpenChatGPTWithImage = async () => {
    setActiveStep("chatgpt");
    await handleCopyEntireOutfitImage();
    const encoded = encodeURIComponent(studioPromptText);
    window.open(`https://chatgpt.com/?q=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const handleOpenGeminiWithImage = async () => {
    setActiveStep("gemini");
    await handleCopyEntireOutfitImage();
    window.open("https://gemini.google.com/app", "_blank", "noopener,noreferrer");
  };

  const handleCopySingleGarmentImage = async (item) => {
    const ok = await copySingleImageToClipboard(item.image);
    if (ok) {
      setCopiedType(item.title);
      setTimeout(() => setCopiedType(null), 3000);
    }
  };

  const handleDownloadImage = async (imgUrl, title) => {
    try {
      const cleanUrl = getCleanImageUrl(imgUrl);
      const res = await fetch(cleanUrl);
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-zA-Z0-9]/g, "_")}.jpg`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
    } catch {
      window.open(getCleanImageUrl(imgUrl), "_blank");
    }
  };

  return (
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[999999] bg-black/80 backdrop-blur-md flex items-center justify-center p-4 selection:bg-accent selection:text-accent-content"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 20 }}
          onClick={(e) => e.stopPropagation()}
          className="relative max-w-xl w-full bg-surface border border-border-theme rounded-3xl shadow-2xl overflow-hidden font-sans flex flex-col max-h-[92vh]"
        >
          {/* Header */}
          <div className="px-6 py-5 bg-background/80 border-b border-border-theme flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-accent text-accent-content flex items-center justify-center text-xl shadow-md shadow-accent/20">
                <i className="ri-sparkling-fill" />
              </div>
              <div>
                <h3 className="text-base font-black uppercase tracking-tight text-foreground">
                  AI Virtual Try-On Studio
                </h3>
                <p className="text-xs text-foreground/60">
                  Try on <span className="text-accent font-bold">"{bundle.title}"</span> with your photo
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 rounded-xl bg-background border border-border-theme hover:border-accent flex items-center justify-center text-foreground/70 hover:text-accent transition cursor-pointer"
            >
              <i className="ri-close-line text-lg" />
            </button>
          </div>

          {/* Body Content */}
          <div className="p-6 overflow-y-auto space-y-5 scrollbar-none flex-1">
            {/* Step Guide Notification Banner */}
            {activeStep && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-accent/15 border-2 border-accent space-y-2 shadow-lg"
              >
                <div className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-wider">
                  <i className="ri-checkbox-circle-fill text-base" />
                  <span>Outfit Image Copied to Clipboard!</span>
                </div>
                <div className="text-xs text-foreground/90 leading-relaxed space-y-1">
                  <p>
                    <strong>Step 1:</strong> In {activeStep === "chatgpt" ? "ChatGPT" : "Google Gemini"}, press <kbd className="px-1.5 py-0.5 rounded bg-background font-mono font-bold border border-border-theme text-accent">Ctrl + V</kbd> to paste the <strong>outfit reference image</strong> into the chat!
                  </p>
                  <p>
                    <strong>Step 2:</strong> Click the <strong>+ / Paperclip</strong> icon to attach your selfie or body photo.
                  </p>
                  <p>
                    <strong>Step 3:</strong> Hit <strong>Send</strong> to generate your custom lookbook!
                  </p>
                </div>
              </motion.div>
            )}

            {/* Quick Action: 1-Click Copy Outfit Image */}
            <div className="p-4 rounded-2xl bg-background border border-border-theme space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-wider text-foreground">
                  1-Click Direct Paste Workflow
                </span>
                {copiedType === "image" && (
                  <span className="text-xs font-bold text-emerald-400 flex items-center gap-1">
                    <i className="ri-check-line" /> Image Ready to Paste!
                  </span>
                )}
              </div>
              <p className="text-xs text-foreground/60 leading-relaxed">
                Click below to copy the combined outfit reference image to your clipboard, then simply press <strong className="text-foreground">Ctrl + V</strong> in ChatGPT or Gemini to attach the actual image directly!
              </p>
              <button
                type="button"
                onClick={handleCopyEntireOutfitImage}
                className="w-full py-3 px-4 rounded-xl bg-accent text-accent-content text-xs font-black uppercase tracking-wider flex items-center justify-center gap-2 hover:scale-[1.01] transition shadow-md shadow-accent/20 cursor-pointer"
              >
                <i className="ri-clipboard-fill text-base" />
                <span>
                  {copiedType === "image" ? "✓ Outfit Image Copied! Press Ctrl+V" : "Copy Outfit Reference Image (Ctrl+V)"}
                </span>
              </button>
            </div>

            {/* Garment Showcase Grid with Individual Image Copy & Save */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
                  Individual Outfit Pieces ({items.length})
                </span>
                <span className="text-[10px] text-foreground/40 font-mono">
                  Click 'Copy' to paste specific piece
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-background border border-border-theme/80 space-y-2 flex flex-col items-center text-center relative group"
                  >
                    <div className="w-18 h-22 rounded-xl overflow-hidden bg-surface border border-border-theme shrink-0 relative">
                      {item.image ? (
                        <img
                          src={getCleanImageUrl(item.image)}
                          alt={item.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-foreground/20 text-xs">
                          <i className="ri-image-line" />
                        </div>
                      )}

                      {/* Action Buttons on Hover */}
                      {item.image && (
                        <div className="absolute inset-0 bg-black/75 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1.5 p-2">
                          <button
                            type="button"
                            onClick={() => handleCopySingleGarmentImage(item)}
                            className="w-full py-1 px-2 rounded-lg bg-accent text-accent-content text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            title="Copy image to clipboard"
                          >
                            <i className="ri-file-copy-line" />
                            <span>{copiedType === item.title ? "Copied!" : "Copy"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleDownloadImage(item.image, item.title)}
                            className="w-full py-1 px-2 rounded-lg bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                            title="Save image to file"
                          >
                            <i className="ri-download-2-line" />
                            <span>Save</span>
                          </button>
                        </div>
                      )}
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wider text-accent">
                      {item.tier}
                    </span>
                    <p className="text-[11px] font-bold text-foreground line-clamp-1">
                      {item.title}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* AI Studio Launchers (ChatGPT & Gemini) */}
            <div className="space-y-3 pt-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50 block">
                Launch AI Studio (Outfit Image Auto-Copied to Clipboard)
              </span>

              {/* ChatGPT Option */}
              <button
                type="button"
                onClick={handleOpenChatGPTWithImage}
                className="w-full p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:border-emerald-500 hover:bg-emerald-500/15 transition cursor-pointer flex items-center justify-between group shadow-sm text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-emerald-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-emerald-500/20 shrink-0">
                    <i className="ri-openai-fill" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-emerald-500 transition">
                        Try On with ChatGPT (GPT-4o)
                      </h4>
                      <span className="text-[9px] font-black px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400">
                        Image Copied to Clipboard
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground/60 mt-0.5">
                      Copies outfit image & prompt. Press Ctrl+V in ChatGPT to paste the image directly!
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-background border border-border-theme flex items-center justify-center text-foreground/70 group-hover:text-emerald-500 group-hover:translate-x-0.5 transition shrink-0">
                  <i className="ri-external-link-line" />
                </div>
              </button>

              {/* Google Gemini Option */}
              <button
                type="button"
                onClick={handleOpenGeminiWithImage}
                className="w-full p-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:border-blue-500 hover:bg-blue-500/15 transition cursor-pointer flex items-center justify-between group shadow-sm text-left"
              >
                <div className="flex items-center gap-3">
                  <div className="w-11 h-11 rounded-2xl bg-blue-500 text-white flex items-center justify-center text-2xl font-bold shadow-md shadow-blue-500/20 shrink-0">
                    <i className="ri-google-fill" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h4 className="text-xs font-black uppercase tracking-wider text-foreground group-hover:text-blue-500 transition">
                        Try On with Google Gemini
                      </h4>
                      <span className="text-[9px] font-black px-2 py-0.2 rounded-full bg-blue-500/20 text-blue-400">
                        Image Copied to Clipboard
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground/60 mt-0.5">
                      Copies outfit image to clipboard. Press Ctrl+V in Gemini to attach the image & prompt!
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-background border border-border-theme flex items-center justify-center text-foreground/70 group-hover:text-blue-500 group-hover:translate-x-0.5 transition shrink-0">
                  <i className="ri-external-link-line" />
                </div>
              </button>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-background/80 border-t border-border-theme flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCopyPromptText}
              className="py-2.5 px-4 rounded-2xl bg-surface border border-border-theme hover:border-accent text-foreground hover:text-accent text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-file-copy-line text-sm" />
              <span>{copiedType === "prompt" ? "Prompt Copied!" : "Copy Text Prompt"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 rounded-2xl bg-accent text-accent-content text-xs font-black uppercase tracking-wider hover:scale-105 transition cursor-pointer"
            >
              Done
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VirtualTryOnModal;
