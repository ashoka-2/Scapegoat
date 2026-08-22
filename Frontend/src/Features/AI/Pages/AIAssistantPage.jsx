import React, { useState, useRef, useEffect } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useAIChat } from "../Hooks/useAIChat.js";
import AIChatSidebar from "../Components/AIChatSidebar.jsx";
import AIChatMessage from "../Components/AIChatMessage.jsx";
import MultiImageUploader from "../Components/MultiImageUploader.jsx";
import AIChatMessagesSkeleton from "../Components/Skeletons/AIChatMessagesSkeleton.jsx";

const STUDIO_SHORTCUTS = [
  { icon: "ri-t-shirt-air-line", title: "Coastal Summer Outfit", prompt: "Suggest me 3 summer coastal outfits with linen shirts, shorts and shades under ₹4,000" },
  { icon: "ri-pant-line", title: "Oversized Streetwear", prompt: "Give me an oversized streetwear fit with baggy trousers and sneakers" },
  { icon: "ri-computer-line", title: "Tech PC Workstation", prompt: "Suggest a clean tech PC workstation setup with mechanical keyboard and monitor" },
  { icon: "ri-sparkling-fill", title: "Evening Party Drop", prompt: "Curate a sharp luxury party outfit with blazers, trousers and leather footwear" },
];

const AIAssistantPage = () => {
  const navigate = useNavigate();
  const { sessionId: routeSessionId } = useParams();

  const {
    sessions,
    activeSessionId,
    messages,
    isStreaming,
    streamingContent,
    streamingMeta,
    pendingImages,
    quota,
    loadingSessions,
    loadingChat,
    hasMoreMessages,
    loadingMoreMessages,
    removePendingImage,
    handleImageUpload,
    sendMessage,
    loadSession,
    loadMoreMessages,
    deleteSession,
    startNewChat,
    addBundleToCart,
    addBundleToWishlist,
  } = useAIChat();

  const [inputVal, setInputVal] = useState("");
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);
  const chatContainerRef = useRef(null);
  const fileInputRef = useRef(null);
  const isPrependingRef = useRef(false);

  // ── Load Chat Session whenever routeSessionId changes in URL ────────────────
  useEffect(() => {
    if (routeSessionId) {
      loadSession(routeSessionId);
    } else {
      startNewChat();
    }
  }, [routeSessionId, loadSession, startNewChat]);

  // ── Sync URL when a brand new session is created during first message ───────
  useEffect(() => {
    if (activeSessionId && !routeSessionId) {
      navigate(`/ai-assistant/${activeSessionId}`, { replace: true });
    }
  }, [activeSessionId, routeSessionId, navigate]);

  // ── Auto-scroll to latest message on new stream / message (not when prepending) ──
  useEffect(() => {
    if (!isPrependingRef.current && !loadingChat) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, streamingContent, loadingChat]);

  // ── Handle Infinite Scroll / Load Previous 10 Messages on Scroll Up ─────────
  const handleScroll = (e) => {
    const container = e.target;
    if (container.scrollTop < 40 && hasMoreMessages && !loadingMoreMessages && !loadingChat) {
      isPrependingRef.current = true;
      const prevScrollHeight = container.scrollHeight;
      const prevScrollTop = container.scrollTop;

      loadMoreMessages().then(() => {
        requestAnimationFrame(() => {
          if (chatContainerRef.current) {
            const newScrollHeight = chatContainerRef.current.scrollHeight;
            chatContainerRef.current.scrollTop = prevScrollTop + (newScrollHeight - prevScrollHeight);
          }
          setTimeout(() => {
            isPrependingRef.current = false;
          }, 300);
        });
      });
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputVal.trim() && pendingImages.length === 0) return;
    isPrependingRef.current = false;
    sendMessage(inputVal);
    setInputVal("");
  };

  const handleNewChatClick = () => {
    startNewChat();
    navigate("/ai-assistant");
    setMobileSidebarOpen(false);
  };

  const handleSelectSession = (sId) => {
    if (sId === routeSessionId) return;
    navigate(`/ai-assistant/${sId}`);
    setMobileSidebarOpen(false);
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
        }, 500);
      }
      e.target.value = "";
    }
  };

  return (
    <div className="h-[100dvh] w-full bg-background text-foreground font-sans selection:bg-accent selection:text-accent-content flex overflow-hidden">
      {/* ── Desktop Left Sidebar (Thread History) ── */}
      <div className="hidden md:flex h-full">
        <AIChatSidebar
          sessions={sessions}
          activeSessionId={activeSessionId || routeSessionId}
          loading={loadingSessions}
          quota={quota}
          onSelectSession={handleSelectSession}
          onNewChat={handleNewChatClick}
          onDeleteSession={deleteSession}
        />
      </div>

      {/* ── Mobile Sidebar Drawer ── */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 z-[2000] bg-black/70 backdrop-blur-sm md:hidden flex"
          >
            <motion.div
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              onClick={(e) => e.stopPropagation()}
              className="w-72 h-full bg-surface"
            >
              <AIChatSidebar
                sessions={sessions}
                activeSessionId={activeSessionId || routeSessionId}
                loading={loadingSessions}
                quota={quota}
                onSelectSession={handleSelectSession}
                onNewChat={handleNewChatClick}
                onDeleteSession={deleteSession}
                onCloseMobile={() => setMobileSidebarOpen(false)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main Chat & AI Studio Area ── */}
      <main className="flex-1 flex flex-col justify-between h-full min-w-0 bg-background">
        {/* Top Navbar */}
        <header className="px-3 sm:px-6 py-3 sm:py-4 border-b border-border-theme/60 bg-surface/60 backdrop-blur-xl flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden w-8 h-8 rounded-xl bg-background border border-border-theme flex items-center justify-center text-foreground shrink-0 cursor-pointer"
              title="Open Chat Threads"
            >
              <i className="ri-menu-2-line" />
            </button>

            <Link
              to="/shop"
              className="flex items-center gap-1 text-xs font-bold text-foreground/60 hover:text-accent transition cursor-pointer shrink-0"
            >
              <i className="ri-arrow-left-line text-sm" />
              <span className="hidden sm:inline">Store</span>
            </Link>

            <span className="text-foreground/30 hidden sm:inline">•</span>

            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-5 h-5 sm:w-6 sm:h-6 rounded-lg bg-accent text-accent-content flex items-center justify-center font-black text-[9px] sm:text-[10px] shadow-sm shrink-0">
                AI
              </span>
              <h1 className="text-xs sm:text-sm font-black uppercase tracking-wider text-foreground truncate">
                AI Stylist
              </h1>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Quota Pill */}
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-background border border-border-theme text-xs font-mono font-bold">
              <i className="ri-flashlight-fill text-accent text-xs" />
              <span>{quota.isAdmin ? "Unlimited Quota" : `${quota.chatRemaining}/${quota.chatLimit} Daily Queries`}</span>
            </div>

            <button
              type="button"
              onClick={handleNewChatClick}
              className="px-3.5 py-1.5 rounded-xl bg-accent text-accent-content text-xs font-bold uppercase tracking-wider shadow-sm hover:scale-105 transition cursor-pointer flex items-center gap-1.5"
            >
              <i className="ri-add-line" />
              <span>New Chat</span>
            </button>
          </div>
        </header>

        {/* ── Scrollable Chat Messages Stream ── */}
        <div
          ref={chatContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto overscroll-contain p-4 sm:p-8 lg:p-12 space-y-6 scrollbar-none max-w-4xl mx-auto w-full"
        >
          {/* Top Pagination Loader / Load Earlier Button */}
          {hasMoreMessages && !loadingChat && (
            <div className="flex justify-center py-2">
              <button
                type="button"
                onClick={() => {
                  isPrependingRef.current = true;
                  loadMoreMessages();
                }}
                disabled={loadingMoreMessages}
                className="px-4 py-1.5 rounded-full bg-surface border border-border-theme text-[11px] font-bold text-foreground/70 hover:text-accent hover:border-accent transition flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-50"
              >
                {loadingMoreMessages ? (
                  <>
                    <i className="ri-loader-4-line animate-spin text-accent text-xs" />
                    <span>Loading previous 10 messages...</span>
                  </>
                ) : (
                  <>
                    <i className="ri-arrow-up-line text-xs" />
                    <span>Scroll up or click to load earlier messages</span>
                  </>
                )}
              </button>
            </div>
          )}

          {/* Skeleton Loader during Chat Switching */}
          {loadingChat ? (
            <AIChatMessagesSkeleton />
          ) : messages.length === 0 && !isStreaming ? (
            <div className="py-12 sm:py-20 flex flex-col items-center text-center space-y-6">
              <div className="w-20 h-20 rounded-3xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent text-4xl shadow-inner">
                <i className="ri-sparkling-fill" />
              </div>

              <div className="space-y-2 max-w-lg">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">
                  Next-Gen Multimodal Fashion AI
                </span>
                <h2 className="text-2xl sm:text-4xl font-black uppercase tracking-tight text-foreground">
                  Your Personal Stylist & Search Engine
                </h2>
                <p className="text-xs sm:text-sm text-foreground/60 leading-relaxed">
                  Ask for personalized coordinated outfits, search products by
                  style or budget, or upload reference photos to find matching
                  items from the ScapeGoat catalog.
                </p>
              </div>

              {/* Quick Starter Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-2xl pt-4">
                {STUDIO_SHORTCUTS.map((card, idx) => (
                  <motion.div
                    key={idx}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      sendMessage(card.prompt);
                    }}
                    className="p-4 rounded-3xl bg-surface border border-border-theme hover:border-accent cursor-pointer transition text-left space-y-2 group shadow-sm"
                  >
                    <div className="flex items-center gap-2">
                      <i className={`${card.icon} text-lg text-accent`} />
                      <span className="text-xs font-black uppercase tracking-wider group-hover:text-accent">
                        {card.title}
                      </span>
                    </div>
                    <p className="text-xs text-foreground/60 line-clamp-2">
                      {card.prompt}
                    </p>
                  </motion.div>
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

              {/* Live Streaming Message */}
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

        {/* ── Studio Input Box with Multi-Image Tray ── */}
        <div className="p-3 sm:p-6 pb-4 sm:pb-6 bg-surface/80 border-t border-border-theme/60 backdrop-blur-xl shrink-0">
          <div className="max-w-4xl mx-auto space-y-3">
            {/* Multi-Image Tray */}
            <MultiImageUploader
              pendingImages={pendingImages}
              onRemoveImage={removePendingImage}
              onUploadImages={handleImageUpload}
            />

            {/* Hidden File Input for Triggering from Camera / Try-on Button */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/jpeg,image/png,image/webp,image/avif"
              multiple
              className="hidden"
              onChange={onFileInputChange}
            />

            {/* Main Form */}
            <form onSubmit={handleSend} className="relative flex items-center">
              <input
                type="text"
                value={inputVal}
                onChange={(e) => setInputVal(e.target.value)}
                placeholder="Ask about outfits, style advice, or describe an item..."
                disabled={isStreaming}
                className="w-full py-3.5 sm:py-4 pl-4 sm:pl-5 pr-24 sm:pr-28 rounded-2xl bg-background border border-border-theme focus:border-accent focus:ring-1 focus:ring-accent outline-none text-xs sm:text-sm text-foreground placeholder:text-foreground/40 transition shadow-inner disabled:opacity-50"
              />

              <div className="absolute right-2 sm:right-2.5 flex items-center gap-1 sm:gap-1.5">
                {/* Photo Upload Attachment Button */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isStreaming || pendingImages.length >= 5}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-surface border border-border-theme hover:border-accent flex items-center justify-center text-foreground/70 hover:text-accent transition disabled:opacity-30 cursor-pointer"
                  title="Attach reference photos for AI visual match"
                >
                  <i className="ri-image-add-line text-sm sm:text-base" />
                </button>

                {/* Send Query Button */}
                <button
                  type="submit"
                  disabled={isStreaming || (!inputVal.trim() && pendingImages.length === 0)}
                  className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-accent text-accent-content flex items-center justify-center text-sm shadow-md shadow-accent/20 hover:scale-105 active:scale-95 transition disabled:opacity-30 disabled:scale-100 cursor-pointer"
                >
                  {isStreaming ? (
                    <i className="ri-loader-4-line animate-spin text-sm" />
                  ) : (
                    <i className="ri-send-plane-2-fill text-sm" />
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AIAssistantPage;
