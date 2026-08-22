import { useCallback, useEffect, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  toggleWidget,
  toggleExpanded,
  setActiveSessionId,
  setSessions,
  setMessages,
  prependMessages,
  setQuota,
  decrementQuota,
  startStreaming,
  appendStreamingChunk,
  setStreamingMeta,
  finishStreaming,
  addPendingImage,
  updatePendingImage,
  removePendingImage,
  clearPendingImages,
  resetChat,
  setLoadingSessions,
  setLoadingChat,
  setHasMoreMessages,
  setLoadingMoreMessages,
} from "../State/aiChat.slice.js";
import {
  fetchAiQuota,
  fetchAiSessions,
  fetchAiSessionById,
  deleteAiSessionApi,
  precomputeImageEmbeddingApi,
  addBundleToCartApi,
  addBundleToWishlistApi,
  streamAiChatApi,
} from "../Services/ai.api.js";
import { addToast } from "../../../utils/toast.slice.js";
import { useCart } from "../../Cart/Hooks/useCart.js";
import { useWishlist } from "../../Wishlist/Hooks/useWishlist.js";

export const useAIChat = () => {
  const dispatch = useDispatch();
  const aiState = useSelector((state) => state.aiChat);
  const user = useSelector((state) => state.auth?.user);
  const { handleGetCart } = useCart();
  const { getWishlist } = useWishlist();

  // ── Load Quota & Sessions on Mount / User change ────────────────────────────
  const refreshQuota = useCallback(async () => {
    try {
      const quota = await fetchAiQuota();
      dispatch(setQuota(quota));
    } catch {
      // Non-blocking
    }
  }, [dispatch]);

  const refreshSessions = useCallback(async () => {
    dispatch(setLoadingSessions(true));
    try {
      const list = await fetchAiSessions();
      dispatch(setSessions(list));
    } catch {
      // Non-blocking
    } finally {
      dispatch(setLoadingSessions(false));
    }
  }, [dispatch]);

  useEffect(() => {
    refreshQuota();
    refreshSessions();
  }, [user, refreshQuota, refreshSessions]);

  const activeLoadingSessionRef = useRef(null);

  // ── Load a Specific Chat Thread with Skeleton State (Default 10 Messages) ──
  const loadSession = useCallback(
    async (sessionId) => {
      if (!sessionId) return;
      activeLoadingSessionRef.current = sessionId;
      dispatch(setActiveSessionId(sessionId));
      dispatch(setLoadingChat(true));
      dispatch(setMessages([]));

      try {
        const data = await fetchAiSessionById(sessionId, { limit: 10 });
        if (activeLoadingSessionRef.current === sessionId) {
          dispatch(setMessages(data.messages || []));
          dispatch(setHasMoreMessages(Boolean(data.hasMore)));
        }
      } catch (err) {
        dispatch(addToast({ message: err.message || "Failed to load chat history.", type: "error" }));
      } finally {
        if (activeLoadingSessionRef.current === sessionId) {
          dispatch(setLoadingChat(false));
        }
      }
    },
    [dispatch]
  );

  // ── Load More (Previous 10 Messages) on Scroll Up ───────────────────────────
  const loadMoreMessages = useCallback(async () => {
    if (aiState.loadingMoreMessages || !aiState.hasMoreMessages || !aiState.activeSessionId) {
      return;
    }

    const oldestMsg = aiState.messages[0];
    if (!oldestMsg) return;

    const before = oldestMsg.createdAt || null;
    if (!before) return;

    dispatch(setLoadingMoreMessages(true));

    try {
      const data = await fetchAiSessionById(aiState.activeSessionId, { limit: 10, before });
      if (data?.messages && data.messages.length > 0) {
        dispatch(prependMessages(data.messages));
        dispatch(setHasMoreMessages(Boolean(data.hasMore)));
      } else {
        dispatch(setHasMoreMessages(false));
      }
    } catch (err) {
      console.warn("Failed to load older messages:", err);
    } finally {
      dispatch(setLoadingMoreMessages(false));
    }
  }, [dispatch, aiState.loadingMoreMessages, aiState.hasMoreMessages, aiState.activeSessionId, aiState.messages]);

  // ── Delete a Session Thread ────────────────────────────────────────────────
  const deleteSession = useCallback(
    async (sessionId) => {
      try {
        await deleteAiSessionApi(sessionId);
        dispatch(addToast({ message: "Chat thread deleted.", type: "info" }));
        if (aiState.activeSessionId === sessionId) {
          dispatch(resetChat());
        }
        refreshSessions();
      } catch (err) {
        dispatch(addToast({ message: err.message || "Failed to delete chat.", type: "error" }));
      }
    },
    [dispatch, aiState.activeSessionId, refreshSessions]
  );

  // ── Start New Chat ──────────────────────────────────────────────────────────
  const startNewChat = useCallback(() => {
    activeLoadingSessionRef.current = null;
    dispatch(resetChat());
  }, [dispatch]);

  // ── Handle Multi-Image Upload & Background Pre-computation ─────────────────
  const handleImageUpload = useCallback(
    async (files) => {
      const fileList = Array.from(files).slice(0, 5 - aiState.pendingImages.length);
      if (!fileList.length) return;

      for (const file of fileList) {
        const tempId = `img_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
        const localPreviewUrl = URL.createObjectURL(file);

        // Convert to Base64 for embedding request
        const reader = new FileReader();
        reader.onload = async () => {
          const base64 = reader.result;

          // 1. Add image to tray with spinner loader active
          dispatch(
            addPendingImage({
              id: tempId,
              url: localPreviewUrl,
              base64,
              name: file.name,
              isEmbedding: true,
              embedding: [],
            })
          );

          // 2. Pre-compute Voyage image embedding in background
          try {
            const embedRes = await precomputeImageEmbeddingApi({ base64 });
            dispatch(
              updatePendingImage({
                id: tempId,
                updates: {
                  embedding: embedRes.embedding || [],
                  isEmbedding: false,
                },
              })
            );
          } catch {
            dispatch(
              updatePendingImage({
                id: tempId,
                updates: { isEmbedding: false },
              })
            );
          }
        };
        reader.readAsDataURL(file);
      }
    },
    [dispatch, aiState.pendingImages]
  );

  // ── Send Message & Handle Live SSE Streaming ───────────────────────────────
  const sendMessage = useCallback(
    async (text) => {
      const queryText = (text || "").trim();
      const imagesToAttach = [...aiState.pendingImages];

      if (!queryText && imagesToAttach.length === 0) return;
      if (aiState.isStreaming) return;

      // Check remaining quota locally
      if (aiState.quota.chatRemaining <= 0) {
        dispatch(
          addToast({
            message: user
              ? "You have reached your 25 daily AI Stylist queries. Resets at midnight!"
              : "You have used your 2 trial queries. Please sign in for 25 free daily queries!",
            type: "warning",
          })
        );
        return;
      }

      // Prepare optimistic user message
      const userMessageObj = {
        _id: `user_${Date.now()}`,
        role: "user",
        content: queryText,
        images: imagesToAttach.map((img) => ({
          url: img.url,
          name: img.name,
          embedding: img.embedding,
        })),
        createdAt: new Date().toISOString(),
      };

      dispatch(startStreaming({ userMessage: userMessageObj }));
      dispatch(clearPendingImages());

      await streamAiChatApi({
        message: queryText,
        sessionId: aiState.activeSessionId,
        images: imagesToAttach.map((img) => ({
          url: img.url,
          base64: img.base64,
          embedding: img.embedding,
        })),
        visitorId: localStorage.getItem("scapegoat_visitor_id") || "",
        onSession: (sessData) => {
          if (sessData?.sessionId && sessData.sessionId !== aiState.activeSessionId) {
            dispatch(setActiveSessionId(sessData.sessionId));
          }
        },
        onChunk: (chunkText) => {
          dispatch(appendStreamingChunk(chunkText));
        },
        onMeta: (metaData) => {
          dispatch(setStreamingMeta(metaData));
        },
        onDone: (doneData) => {
          dispatch(finishStreaming({ messageId: `msg_${Date.now()}` }));
          if (doneData?.quota) {
            dispatch(setQuota(doneData.quota));
          } else {
            dispatch(decrementQuota());
          }
          refreshSessions();
        },
        onError: (err) => {
          dispatch(finishStreaming({ messageId: `msg_err_${Date.now()}` }));
          dispatch(
            addToast({
              message: err.message || "Failed to stream AI response. Please try again.",
              type: "error",
            })
          );
        },
      });
    },
    [dispatch, aiState.pendingImages, aiState.isStreaming, aiState.quota, aiState.activeSessionId, user, refreshSessions]
  );

  // ── 1-Click Action: Bulk Add Bundle to Cart ─────────────────────────────────
  const addBundleToCart = useCallback(
    async (bundle) => {
      if (!user) {
        dispatch(addToast({ message: "Please sign in to add outfits to your cart.", type: "warning" }));
        return;
      }

      const items = (bundle.items || []).map((i) => ({
        productId: i.product,
        variantId: i.variantId || null,
        quantity: 1,
        selectedAttributes: i.selectedAttributes || {},
      }));

      try {
        const res = await addBundleToCartApi({ items });
        dispatch(addToast({ message: `Added ${res.addedCount} items from "${bundle.title}" to cart! 🛍️`, type: "success" }));
        handleGetCart(); // Refresh Redux cart state
      } catch (err) {
        dispatch(addToast({ message: err.message || "Failed to add outfit to cart.", type: "error" }));
      }
    },
    [dispatch, user, handleGetCart]
  );

  // ── 1-Click Action: Bulk Add Bundle to Wishlist ─────────────────────────────
  const addBundleToWishlist = useCallback(
    async (bundle) => {
      if (!user) {
        dispatch(addToast({ message: "Please sign in to save outfits to your wishlist.", type: "warning" }));
        return;
      }

      const productIds = (bundle.items || []).map((i) => i.product);

      try {
        const res = await addBundleToWishlistApi({ productIds, action: "add" });
        dispatch(addToast({ message: `Saved "${bundle.title}" (${res.count} items) to your wishlist! ❤️`, type: "success" }));
        if (typeof getWishlist === "function") {
          getWishlist(); // Refresh Redux wishlist state
        }
      } catch (err) {
        dispatch(addToast({ message: err.message || "Failed to save outfit to wishlist.", type: "error" }));
      }
    },
    [dispatch, user, getWishlist]
  );

  return {
    ...aiState,
    toggleWidget: (val) => dispatch(toggleWidget(val)),
    toggleExpanded: (val) => dispatch(toggleExpanded(val)),
    removePendingImage: (id) => dispatch(removePendingImage(id)),
    clearPendingImages: () => dispatch(clearPendingImages()),
    handleImageUpload,
    sendMessage,
    loadSession,
    loadMoreMessages,
    deleteSession,
    startNewChat,
    refreshQuota,
    refreshSessions,
    addBundleToCart,
    addBundleToWishlist,
  };
};

export default useAIChat;
