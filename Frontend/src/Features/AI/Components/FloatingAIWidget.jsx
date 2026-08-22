import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAIChat } from "../Hooks/useAIChat.js";
import AIChatMessage from "./AIChatMessage.jsx";
import MultiImageUploader from "./MultiImageUploader.jsx";
import AIChatMessagesSkeleton from "./Skeletons/AIChatMessagesSkeleton.jsx";

const SHORTCUT_PROMPTS = [
  {
    label: "✨ Summer Linen Outfit",
    prompt:
      "Suggest me 3 summer coastal outfits with linen shirts and shorts under ₹4,000",
  },
  {
    label: "🧥 Oversized Streetwear",
    prompt:
      "Give me an aesthetic oversized streetwear fit with baggy pants and sneakers",
  },
  {
    label: "💻 PC Setup Under ₹40K",
    prompt:
      "Suggest a clean tech workstation setup with mechanical keyboard and monitor",
  },
  {
    label: "👔 Modern Formal Look",
    prompt:
      "Curate a sharp formal outfit with blazer, trousers and leather loafers",
  },
];

const FloatingAIWidget = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    isOpen,
    isExpanded,
    messages,
    isStreaming,
    streamingContent,
    streamingMeta,
    pendingImages,
    quota,
    loadingChat,
    toggleWidget,
    toggleExpanded,
    removePendingImage,
    handleImageUpload,
    sendMessage,
    startNewChat,
    addBundleToCart,
    addBundleToWishlist,
  } = useAIChat();

  const [inputVal, setInputVal] = useState("");
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, streamingContent]);

  // Don't render floating widget if user is already on the dedicated /ai-assistant page
  if (
    location.pathname.startsWith("/ai-assistant") ||
    location.pathname.startsWith("/ai-stylist")
  ) {
    return null;
  }

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputVal.trim() && pendingImages.length === 0) return;
    sendMessage(inputVal);
    setInputVal("");
  };

  const handleShortcut = (promptText) => {
    sendMessage(promptText);
  };

  const selectedTryOnBundleRef = useRef(null);

  const handleTryOnBundle = (bundle) => {
    if (pendingImages.length > 0) {
      sendMessage(`Please generate a virtual try-on render of the "${bundle.title}" outfit on my photo.`);
    } else {
      selectedTryOnBundleRef.current = bundle;
      fileInputRef.current?.click();
    }
  };

  const onFileInputChange = (e) => {
    if (e.target.files?.length) {
      handleImageUpload(e.target.files);
      const bundle = selectedTryOnBundleRef.current;
      if (bundle) {
        setTimeout(() => {
          sendMessage(`Please generate a virtual try-on render of the "${bundle.title}" outfit on my photo.`);
          selectedTryOnBundleRef.current = null;
        }, 300);
      }
      e.target.value = "";
    }
  };

  return (
    <>
      {/* ── Fixed Bottom-Right Floating Launcher Button (Desktop Only — Mobile uses Center Nav Button) ── */}
      <div className="hidden md:block fixed bottom-6 right-6 z-[9999] select-none">
        <motion.button
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.94 }}
          onClick={() => toggleWidget()}
          className="relative w-14 h-14 rounded-full bg-accent text-accent-content flex items-center justify-center text-xl shadow-2xl shadow-accent/40 cursor-pointer group border-2 border-accent-content/20"
          title="ScapeGoat AI Fashion & Shopping Assistant"
        >
          {/* Animated Glow Pulse Ring (Only visible when chatbox is CLOSED) */}
          {!isOpen && (
            <span className="absolute inset-0 rounded-full bg-accent animate-ping opacity-25 pointer-events-none" />
          )}

          {isOpen ? (
            <i className="ri-close-line text-2xl" />
          ) : (
            <div className="flex items-center justify-center relative">
              <i className="ri-sparkling-2-fill text-2xl group-hover:rotate-12 transition-transform" />
            </div>
          )}
        </motion.button>
      </div>

      {/* ── Collapsible Floating AI Drawer / Popup Box (Above Everything) ── */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 30, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 30 }}
            transition={{ type: "spring", stiffness: 350, damping: 28 }}
            className="fixed bottom-24 right-6 z-[99999] w-[calc(100vw-2rem)] sm:w-[420px] max-h-[720px] h-[82vh] bg-surface/95 backdrop-blur-2xl border border-border-theme rounded-3xl shadow-2xl flex flex-col overflow-hidden select-none overscroll-contain touch-pan-y"
            onWheel={(e) => e.stopPropagation()}
          >
            {/* ── Chat Header ── */}
            <div className="px-5 py-4 bg-background/80 border-b border-border-theme flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent text-accent-content flex items-center justify-center text-lg font-black shadow-md shadow-accent/20">
                  SG
                </div>
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-foreground">
                      ScapeGoat Stylist
                    </h3>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  </div>
                  <p className="text-[10px] text-foreground/50 font-mono">
                    {quota.isAdmin
                      ? "Unlimited Quota"
                      : `${quota.chatRemaining}/${quota.chatLimit} Queries Left Today`}
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-1.5">
                <Link
                  to="/ai-assistant"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-background border border-border-theme hover:border-accent flex items-center justify-center text-foreground/70 hover:text-accent transition"
                  title="Expand to Fullscreen Studio"
                >
                  <i className="ri-fullscreen-line text-sm" />
                </Link>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="w-8 h-8 rounded-xl bg-background border border-border-theme hover:border-accent flex items-center justify-center text-foreground/70 hover:text-accent transition cursor-pointer"
                >
                  <i className="ri-close-line text-base" />
                </button>
              </div>
            </div>

            {/* ── Scrollable Chat Content Stream ── */}
            <div
              className="flex-1 overflow-y-auto overscroll-contain touch-pan-y p-4 space-y-4 scrollbar-thin scrollbar-thumb-border-theme scrollbar-track-transparent"
              onWheel={(e) => e.stopPropagation()}
            >
              {loadingChat ? (
                <AIChatMessagesSkeleton />
              ) : messages.length === 0 && !isStreaming ? (
                <div className="py-6 flex flex-col items-center text-center space-y-4">
                  <div className="w-14 h-14 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-2xl">
                    <i className="ri-sparkling-fill" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="font-black text-sm uppercase tracking-wider text-foreground">
                      Personal Fashion Stylist & AI Search
                    </h4>
                    <p className="text-xs text-foreground/60 max-w-xs">
                      Ask for head-to-toe outfits, PC setups, drop matching, or
                      upload photos to find lowest prices.
                    </p>
                  </div>

                  {/* Starter Quick Chips */}
                  <div className="grid grid-cols-1 gap-1.5 w-full pt-2">
                    {SHORTCUT_PROMPTS.map((p, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => handleShortcut(p.prompt)}
                        className="p-2.5 rounded-2xl bg-background border border-border-theme hover:border-accent text-left text-xs font-semibold text-foreground/80 hover:text-accent transition cursor-pointer flex items-center justify-between group"
                      >
                        <span className="truncate">{p.label}</span>
                        <i className="ri-arrow-right-s-line text-foreground/40 group-hover:text-accent group-hover:translate-x-0.5 transition-transform" />
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {messages.map((msg, idx) => (
                    <AIChatMessage
                      key={msg._id || idx}
                      message={msg}
                      onAddToCart={addBundleToCart}
                      onAddToWishlist={addBundleToWishlist}
                      onTryOn={handleTryOnBundle}
                    />
                  ))}

                  {/* ── Live SSE Streaming Turn ── */}
                  {isStreaming && (
                    <AIChatMessage
                      isStreaming={true}
                      message={{
                        role: "assistant",
                        content: streamingContent,
                        bundles: streamingMeta?.bundles || [],
                        products: streamingMeta?.products || [],
                        sources: streamingMeta?.sources || [],
                        toolCalls: streamingMeta?.toolCalls || [],
                      }}
                      onAddToCart={addBundleToCart}
                      onAddToWishlist={addBundleToWishlist}
                    />
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* ── Input Box & Multi-Image Upload Tray ── */}
            <div className="p-3.5 bg-background/80 border-t border-border-theme/60 space-y-2">
              <MultiImageUploader
                pendingImages={pendingImages}
                onUpload={handleImageUpload}
                onRemove={removePendingImage}
              />

              <form
                onSubmit={handleSend}
                className="relative flex items-center gap-2"
              >
                {/* Image / Camera Attach Trigger */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-10 h-10 rounded-2xl bg-surface border border-border-theme hover:border-accent flex items-center justify-center text-foreground/70 hover:text-accent transition cursor-pointer shrink-0"
                  title="Upload / Camera (up to 5 photos)"
                >
                  <i className="ri-image-add-line text-base" />
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  className="hidden"
                  onChange={onFileInputChange}
                />

                {/* Prompt Text Input */}
                <input
                  type="text"
                  value={inputVal}
                  onChange={(e) => setInputVal(e.target.value)}
                  placeholder="Ask for an outfit, PC build, or attach image..."
                  className="flex-1 bg-surface border border-border-theme focus:border-accent rounded-2xl px-4 py-2.5 text-xs text-foreground outline-none transition focus:ring-2 focus:ring-accent/20 placeholder:text-foreground/40"
                />

                {/* Send Button */}
                <button
                  type="submit"
                  disabled={
                    isStreaming ||
                    (!inputVal.trim() && pendingImages.length === 0)
                  }
                  className="w-10 h-10 rounded-2xl bg-accent text-accent-content flex items-center justify-center text-base shadow-md shadow-accent/25 hover:scale-105 active:scale-95 transition cursor-pointer disabled:opacity-40 disabled:hover:scale-100 shrink-0"
                >
                  {isStreaming ? (
                    <div className="w-4 h-4 border-2 border-accent-content/30 border-t-accent-content rounded-full animate-spin" />
                  ) : (
                    <i className="ri-send-plane-2-fill" />
                  )}
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FloatingAIWidget;
