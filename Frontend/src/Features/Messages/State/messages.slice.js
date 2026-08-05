import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  messages: [],
  unreadCount: 0,
  loading: false,
  error: null,
};

const messagesSlice = createSlice({
  name: "messages",
  initialState,
  reducers: {
    setMessages: (state, action) => {
      state.messages = action.payload.messages;
      state.unreadCount = action.payload.unreadCount ?? 0;
    },
    prependMessage: (state, action) => {
      state.messages.unshift(action.payload);
      state.unreadCount += 1;
    },
    markRead: (state, action) => {
      const msg = state.messages.find((m) => m._id === action.payload);
      if (msg && !msg.isRead) {
        msg.isRead = true;
        state.unreadCount = Math.max(0, state.unreadCount - 1);
      }
    },
    removeMessage: (state, action) => {
      const msg = state.messages.find((m) => m._id === action.payload);
      if (msg && !msg.isRead) state.unreadCount = Math.max(0, state.unreadCount - 1);
      state.messages = state.messages.filter((m) => m._id !== action.payload);
    },
    setLoading: (state, action) => {
      state.loading = action.payload;
    },
    setError: (state, action) => {
      state.error = action.payload;
    },
  },
});

export const { setMessages, prependMessage, markRead, removeMessage, setLoading, setError } =
  messagesSlice.actions;

export default messagesSlice.reducer;
