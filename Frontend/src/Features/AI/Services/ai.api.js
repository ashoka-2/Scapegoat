import customAxios, { API_BASE_URL, AUTH_TOKEN_KEY } from "../../../utils/axios.js";

/**
 * Fetches the user's daily AI quota status
 */
export const fetchAiQuota = async () => {
  const response = await customAxios.get("/api/ai/quota");
  return response.data.quota;
};

/**
 * Pre-computes image vector embedding in background
 */
export const precomputeImageEmbeddingApi = async ({ imageUrl, base64 }) => {
  const response = await customAxios.post("/api/ai/embed-image", { imageUrl, base64 });
  return response.data;
};

/**
 * Fetches all past AI chat sessions for sidebar
 */
export const fetchAiSessions = async () => {
  const response = await customAxios.get("/api/ai/sessions");
  return response.data.sessions;
};

/**
 * Fetches message history for a specific session thread (paginated, default 10 most recent)
 */
export const fetchAiSessionById = async (sessionId, { limit = 10, before = null } = {}) => {
  const params = { limit };
  if (before) params.before = before;
  const response = await customAxios.get(`/api/ai/sessions/${sessionId}`, { params });
  return response.data;
};

/**
 * Deletes an AI chat session thread
 */
export const deleteAiSessionApi = async (sessionId) => {
  const response = await customAxios.delete(`/api/ai/sessions/${sessionId}`);
  return response.data;
};

/**
 * 1-Click Action: Bulk Add Bundle to Cart
 */
export const addBundleToCartApi = async ({ items }) => {
  const response = await customAxios.post("/api/ai/action/cart", { items });
  return response.data;
};

/**
 * 1-Click Action: Bulk Add Bundle to Wishlist
 */
export const addBundleToWishlistApi = async ({ productIds, action = "add" }) => {
  const response = await customAxios.post("/api/ai/action/wishlist", { productIds, action });
  return response.data;
};

/**
 * Reads SSE Stream from /api/ai/chat/stream using standard Fetch + ReadableStream
 */
export const streamAiChatApi = async ({
  message,
  sessionId,
  images = [],
  visitorId = "",
  onSession,
  onChunk,
  onMeta,
  onDone,
  onError,
}) => {
  try {
    const token = localStorage.getItem(AUTH_TOKEN_KEY);
    const headers = {
      "Content-Type": "application/json",
    };
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    if (visitorId) {
      headers["X-Visitor-Id"] = visitorId;
    }

    const url = `${API_BASE_URL}/api/ai/chat/stream`;

    const response = await fetch(url, {
      method: "POST",
      headers,
      credentials: "include",
      body: JSON.stringify({
        message,
        sessionId,
        images,
        visitorId,
      }),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      throw new Error(errData.message || `Server error (${response.status})`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder("utf-8");
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n\n");
      buffer = lines.pop() || ""; // keep incomplete tail

      for (const line of lines) {
        if (!line.trim()) continue;

        let eventType = "message";
        let dataPayload = "";

        const lineParts = line.split("\n");
        for (const part of lineParts) {
          if (part.startsWith("event:")) {
            eventType = part.replace("event:", "").trim();
          } else if (part.startsWith("data:")) {
            dataPayload = part.replace("data:", "").trim();
          }
        }

        if (dataPayload) {
          try {
            const parsed = JSON.parse(dataPayload);
            if (eventType === "session") {
              onSession?.(parsed);
            } else if (eventType === "chunk") {
              onChunk?.(parsed.text);
            } else if (eventType === "meta") {
              onMeta?.(parsed);
            } else if (eventType === "done") {
              onDone?.(parsed);
            } else if (eventType === "error") {
              onError?.(new Error(parsed.message || "AI Stream Error"));
            }
          } catch {
            // Ignore parse errors on partial frames
          }
        }
      }
    }
  } catch (error) {
    onError?.(error);
  }
};
