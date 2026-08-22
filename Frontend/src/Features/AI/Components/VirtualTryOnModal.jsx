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
        // Strip any existing transformation and enforce high-quality JPG output
        const baseUrl = parts[0].replace(/\/tr:[^/]+/, "");
        return `${baseUrl}/tr:f-jpg,q-95,w-1200/products/${parts[1]}`;
      }
    }
    return rawUrl;
  } catch {
    return rawUrl;
  }
};

const VirtualTryOnModal = ({ isOpen, onClose, bundle }) => {
  const [copied, setCopied] = useState(false);
  const [activeStep, setActiveStep] = useState(null); // 'chatgpt' | 'gemini' | null

  if (!isOpen || !bundle) return null;

  const items = bundle.items || [];
  
  // Format items with direct, prominent high-res JPG image URLs
  const itemsText = items
    .map((item, idx) => {
      const cleanImg = getCleanImageUrl(item.image);
      return `${idx + 1}. [${item.tier}] ${item.title}:\n   ${cleanImg || "Catalog item"}`;
    })
    .join("\n\n");

  const studioPrompt = `Please create an ultra-realistic 8k full-body fashion lookbook photograph of me wearing the exact clothing items shown in these product images:

${itemsText}

INSTRUCTIONS FOR TRY-ON:
1. Examine each product image URL above and replicate the EXACT garment fabric, texture, color, cut, collar, buttons, and silhouette on my body.
2. Maintain my exact facial identity, skin tone, hair style/color, facial features, and physical build from the reference photo I am attaching.
3. Show me wearing these exact pieces together in a clean modern fashion lookbook with studio lighting, realistic fabric drape, and 8k photorealistic detail.`;

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(studioPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleOpenChatGPT = () => {
    handleCopyPrompt();
    setActiveStep("chatgpt");
    const encoded = encodeURIComponent(studioPrompt);
    window.open(`https://chatgpt.com/?q=${encoded}`, "_blank", "noopener,noreferrer");
  };

  const handleOpenGemini = () => {
    handleCopyPrompt();
    setActiveStep("gemini");
    window.open("https://gemini.google.com/app", "_blank", "noopener,noreferrer");
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
            {/* Step Guide Notification Banner when launcher clicked */}
            {activeStep && (
              <motion.div
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 rounded-2xl bg-accent/15 border-2 border-accent space-y-2 shadow-lg"
              >
                <div className="flex items-center gap-2 text-accent text-xs font-black uppercase tracking-wider">
                  <i className="ri-checkbox-circle-fill text-base" />
                  <span>Prompt & Image URLs Copied to Clipboard!</span>
                </div>
                <div className="text-xs text-foreground/90 leading-relaxed space-y-1">
                  <p>
                    <strong>Step 1:</strong> In {activeStep === "chatgpt" ? "ChatGPT" : "Google Gemini"}, press <kbd className="px-1.5 py-0.5 rounded bg-background font-mono font-bold border border-border-theme text-accent">Ctrl + V</kbd> to paste the prompt & image links into the message box.
                  </p>
                  <p>
                    <strong>Step 2:</strong> Click the <strong>+ / Paperclip</strong> icon to attach your selfie or body photo.
                  </p>
                  <p>
                    <strong>Step 3:</strong> Hit <strong>Send</strong> to generate your high-definition Vogue lookbook!
                  </p>
                </div>
              </motion.div>
            )}

            {/* Garment Showcase Grid with 1-Click Download */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black uppercase tracking-wider text-foreground/50">
                  Outfit Pieces to Wear ({items.length})
                </span>
                <span className="text-[10px] text-foreground/40 font-mono">
                  Universal High-Res JPG Images
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {items.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-2xl bg-background border border-border-theme/80 space-y-1.5 flex flex-col items-center text-center relative group"
                  >
                    <div className="w-16 h-20 rounded-xl overflow-hidden bg-surface border border-border-theme shrink-0 relative">
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

                      {/* Download Overlay */}
                      {item.image && (
                        <button
                          type="button"
                          onClick={() => handleDownloadImage(item.image, item.title)}
                          className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold gap-1 cursor-pointer"
                          title="Download Image"
                        >
                          <i className="ri-download-2-line" />
                          <span>Save</span>
                        </button>
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
                Choose AI Studio (Upload Your Photo to Try On)
              </span>

              {/* ChatGPT Option */}
              <button
                type="button"
                onClick={handleOpenChatGPT}
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
                        Auto-Fills Input
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground/60 mt-0.5">
                      Pre-fills prompt & product image URLs in ChatGPT. Attach your selfie to generate!
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
                onClick={handleOpenGemini}
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
                        1-Click Copy
                      </span>
                    </div>
                    <p className="text-[11px] text-foreground/60 mt-0.5">
                      Copies prompt & image URLs to clipboard. Paste in Gemini & attach your photo!
                    </p>
                  </div>
                </div>
                <div className="w-8 h-8 rounded-xl bg-background border border-border-theme flex items-center justify-center text-foreground/70 group-hover:text-blue-500 group-hover:translate-x-0.5 transition shrink-0">
                  <i className="ri-external-link-line" />
                </div>
              </button>
            </div>

            {/* Copy Prompt Box */}
            <div className="p-4 rounded-2xl bg-background border border-border-theme/80 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono text-foreground/50 font-bold uppercase">
                  Formatted Prompt (with Image URLs)
                </span>
                <button
                  type="button"
                  onClick={handleCopyPrompt}
                  className="text-xs font-bold text-accent hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <i className={copied ? "ri-check-line text-emerald-500" : "ri-file-copy-line"} />
                  <span>{copied ? "Copied to Clipboard!" : "Copy Full Prompt"}</span>
                </button>
              </div>
              <pre className="text-[11px] text-foreground/70 font-mono line-clamp-3 bg-surface p-2.5 rounded-xl border border-border-theme whitespace-pre-wrap">
                {studioPrompt}
              </pre>
            </div>
          </div>

          {/* Footer Actions */}
          <div className="p-4 bg-background/80 border-t border-border-theme flex items-center justify-between gap-3 shrink-0">
            <button
              type="button"
              onClick={handleCopyPrompt}
              className="py-2.5 px-4 rounded-2xl bg-surface border border-border-theme hover:border-accent text-foreground hover:text-accent text-xs font-bold transition flex items-center gap-1.5 cursor-pointer"
            >
              <i className="ri-file-copy-line text-sm" />
              <span>{copied ? "Copied!" : "Copy Prompt"}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-6 rounded-2xl bg-accent text-accent-content text-xs font-black uppercase tracking-wider hover:scale-105 transition cursor-pointer"
            >
              Close
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default VirtualTryOnModal;
