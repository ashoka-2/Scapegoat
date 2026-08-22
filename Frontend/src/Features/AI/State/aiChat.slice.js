import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  isOpen: false,
  isExpanded: false,
  activeSessionId: null,
  sessions: [],
  messages: [],
  isStreaming: false,
  streamingContent: "",
  streamingMeta: null,
  pendingImages: [], // [{ id, url, base64, name, embedding: [], isEmbedding: true/false }]
  quota: {
    chatRemaining: 25,
    chatLimit: 25,
    imageRemaining: 5,
    imageLimit: 5,
    isRegistered: false,
    resetsInSeconds: 86400,
  },
  loadingSessions: false,
  loadingChat: false, // Indicates switching or initial loading of messages in current thread
  hasMoreMessages: false, // True if older messages exist for pagination
  loadingMoreMessages: false, // True while loading older 10 messages on scroll up
};

export const aiChatSlice = createSlice({
  name: "aiChat",
  initialState,
  reducers: {
    toggleWidget: (state, action) => {
      state.isOpen = typeof action.payload === "boolean" ? action.payload : !state.isOpen;
    },
    toggleExpanded: (state, action) => {
      state.isExpanded = typeof action.payload === "boolean" ? action.payload : !state.isExpanded;
    },
    setActiveSessionId: (state, action) => {
      state.activeSessionId = action.payload;
    },
    setSessions: (state, action) => {
      state.sessions = action.payload || [];
    },
    setMessages: (state, action) => {
      state.messages = action.payload || [];
    },
    prependMessages: (state, action) => {
      const olderMessages = action.payload || [];
      // Prepend avoiding duplicate IDs
      const existingIds = new Set(state.messages.map((m) => String(m._id)));
      const filteredOlder = olderMessages.filter((m) => !existingIds.has(String(m._id)));
      state.messages = [...filteredOlder, ...state.messages];
    },
    addMessage: (state, action) => {
      state.messages.push(action.payload);
    },
    updateLastAssistantMessage: (state, action) => {
      const last = state.messages[state.messages.length - 1];
      if (last && last.role === "assistant") {
        Object.assign(last, action.payload);
      }
    },
    setQuota: (state, action) => {
      state.quota = { ...state.quota, ...(action.payload || {}) };
    },
    decrementQuota: (state) => {
      if (state.quota.chatRemaining > 0) {
        state.quota.chatRemaining -= 1;
      }
    },
    startStreaming: (state, action) => {
      state.isStreaming = true;
      state.streamingContent = "";
      state.streamingMeta = null;
      if (action.payload?.userMessage) {
        state.messages.push(action.payload.userMessage);
      }
    },
    appendStreamingChunk: (state, action) => {
      state.streamingContent += action.payload;
    },
    setStreamingMeta: (state, action) => {
      state.streamingMeta = action.payload;
    },
    finishStreaming: (state, action) => {
      state.isStreaming = false;
      if (state.streamingContent || state.streamingMeta) {
        state.messages.push({
          _id: action.payload?.messageId || `msg_${Date.now()}`,
          role: "assistant",
          content: state.streamingContent,
          bundles: state.streamingMeta?.bundles || [],
          products: state.streamingMeta?.products || [],
          sources: state.streamingMeta?.sources || [],
          toolCalls: state.streamingMeta?.toolCalls || [],
          modelUsed: state.streamingMeta?.modelUsed || "gemini-2.5-flash",
          createdAt: new Date().toISOString(),
        });
      }
      state.streamingContent = "";
      state.streamingMeta = null;
    },
    // Image Upload Management
    addPendingImage: (state, action) => {
      if (state.pendingImages.length < 5) {
        state.pendingImages.push(action.payload);
      }
    },
    updatePendingImage: (state, action) => {
      const { id, updates } = action.payload;
      const target = state.pendingImages.find((img) => img.id === id);
      if (target) {
        Object.assign(target, updates);
      }
    },
    removePendingImage: (state, action) => {
      state.pendingImages = state.pendingImages.filter((img) => img.id !== action.payload);
    },
    clearPendingImages: (state) => {
      state.pendingImages = [];
    },
    resetChat: (state) => {
      state.activeSessionId = null;
      state.messages = [];
      state.streamingContent = "";
      state.streamingMeta = null;
      state.isStreaming = false;
      state.pendingImages = [];
      state.loadingChat = false;
      state.hasMoreMessages = false;
      state.loadingMoreMessages = false;
    },
    setLoadingSessions: (state, action) => {
      state.loadingSessions = action.payload;
    },
    setLoadingChat: (state, action) => {
      state.loadingChat = action.payload;
    },
    setHasMoreMessages: (state, action) => {
      state.hasMoreMessages = action.payload;
    },
    setLoadingMoreMessages: (state, action) => {
      state.loadingMoreMessages = action.payload;
    },
  },
});

export const {
  toggleWidget,
  toggleExpanded,
  setActiveSessionId,
  setSessions,
  setMessages,
  prependMessages,
  addMessage,
  updateLastAssistantMessage,
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
} = aiChatSlice.actions;

export default aiChatSlice.reducer;
