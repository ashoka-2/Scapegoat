import mongoose from "mongoose";
import { AiChatSession, AiChatMessage } from "../models/aiChat.model.js";
import { runAIAgent } from "../services/ai/aiAgent.service.js";
import { generateImageEmbedding } from "../utils/aiEmbedding.js";
import { uploadFile } from "../services/imageKit.service.js";
import { getUserAiQuotaStatus } from "../middlewares/aiQuota.middleware.js";
import { executeCartAction, executeWishlistAction, getProductReviewInsights } from "../services/ai/aiTools.service.js";
import productModel from "../models/product.model.js";

/**
 * @desc    Get Current User AI Quota Status
 * @route   GET /api/ai/quota
 * @access  Public (Guest & Authenticated)
 */
export const getAiQuota = async (req, res) => {
  try {
    const user = req.user;
    const visitorId = req.headers["x-visitor-id"] || req.query.visitorId;
    const status = await getUserAiQuotaStatus(user, visitorId);
    return res.status(200).json({ success: true, quota: status });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Pre-compute Image Embedding & Upload to ImageKit CDN
 * @route   POST /api/ai/embed-image
 * @access  Public / Authenticated
 */
export const precomputeImageEmbedding = async (req, res) => {
  try {
    const { imageUrl, base64 } = req.body;
    if (!imageUrl && !base64) {
      return res.status(400).json({ success: false, message: "imageUrl or base64 is required." });
    }

    let finalCdnUrl = imageUrl || "";

    // 1. Upload to ImageKit CDN for permanent storage
    if (base64 && base64.startsWith("data:")) {
      try {
        const uploadRes = await uploadFile({
          file: base64,
          filename: `ai_chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`,
          folder: "/ai_chat_uploads",
        });
        if (uploadRes?.url) {
          finalCdnUrl = uploadRes.url;
        }
      } catch (err) {
        console.warn("⚠️ [ImageKit] AI Image upload fallback:", err.message);
      }
    }

    // 2. Generate Voyage AI 1024-dim multimodal vector embedding
    const embedding = await generateImageEmbedding(finalCdnUrl || base64);

    return res.status(200).json({
      success: true,
      url: finalCdnUrl,
      hasEmbedding: Boolean(embedding && embedding.length > 0),
      embedding,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Stream AI Chat Response via Server-Sent Events (SSE)
 * @route   POST /api/ai/chat/stream
 * @access  Public / Authenticated (Quota Guarded)
 */
export const streamAiChat = async (req, res) => {
  const { message = "", sessionId = null, images = [] } = req.body;
  const user = req.user;
  const visitorId = req.headers["x-visitor-id"] || req.body.visitorId;

  if (!message.trim() && (!images || images.length === 0)) {
    return res.status(400).json({ success: false, message: "Message or image is required." });
  }

  // Set SSE Headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no"); // Disable proxy buffering on Render/Nginx
  res.flushHeaders?.();

  const sendEvent = (event, data) => {
    res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
  };

  try {
    // 1. Get or Create Persistent Session
    let session = null;
    if (sessionId && mongoose.Types.ObjectId.isValid(sessionId)) {
      session = await AiChatSession.findById(sessionId);
    }

    if (!session) {
      // Auto-generate title from first 5-6 words
      const autoTitle = message.trim().slice(0, 45) || "Visual Fashion Query";
      session = await AiChatSession.create({
        user: user?._id || null,
        visitorId: user?._id ? null : visitorId,
        title: autoTitle,
      });
    }

    // 2. Fetch recent conversation history
    const priorMessages = await AiChatMessage.find({ session: session._id })
      .sort({ createdAt: 1 })
      .limit(10)
      .lean();

    // 3. Process & Ensure ImageKit CDN URLs for user-uploaded images
    const processedImages = [];
    for (const img of images || []) {
      let cdnUrl = img.url || "";
      if (img.base64 && (!cdnUrl || cdnUrl.startsWith("blob:"))) {
        try {
          const uploadRes = await uploadFile({
            file: img.base64,
            filename: `ai_chat_${Date.now()}_${Math.random().toString(36).slice(2, 7)}.jpg`,
            folder: "/ai_chat_uploads",
          });
          if (uploadRes?.url) {
            cdnUrl = uploadRes.url;
          }
        } catch (err) {
          console.warn("⚠️ [ImageKit] Image upload error:", err.message);
        }
      }

      processedImages.push({
        url: cdnUrl || img.url || "",
        name: img.name || "Upload",
        embedding: img.embedding || [],
      });
    }

    // 4. Save User Message with permanent ImageKit CDN URLs
    const userMsgDoc = await AiChatMessage.create({
      session: session._id,
      role: "user",
      content: message,
      images: processedImages,
    });

    sendEvent("session", { sessionId: session._id, userMessageId: userMsgDoc._id });

    // 4. Run AI Agent Workflow with Live Chunk Streaming
    const agentResult = await runAIAgent(
      {
        userMessage: message,
        history: priorMessages,
        images,
        user,
      },
      (chunk) => {
        sendEvent("chunk", { text: chunk });
      }
    );

    // 5. Populate products for interactive cards & preserve strict similarity ranking
    const rawPopulated = await productModel
      .find({ _id: { $in: agentResult.products } })
      .populate("category", "name")
      .populate("brand", "name")
      .lean();

    const productRankMap = new Map(
      (agentResult.products || []).map((id, index) => [String(id), index])
    );

    const populatedProducts = rawPopulated.sort((a, b) => {
      const rankA = productRankMap.has(String(a._id)) ? productRankMap.get(String(a._id)) : 999;
      const rankB = productRankMap.has(String(b._id)) ? productRankMap.get(String(b._id)) : 999;
      return rankA - rankB;
    });

    // 6. Save Assistant Response in MongoDB
    const assistantMsgDoc = await AiChatMessage.create({
      session: session._id,
      role: "assistant",
      content: agentResult.fullText,
      bundles: agentResult.bundles,
      products: agentResult.products,
      sources: agentResult.sources,
      toolCalls: agentResult.toolCalls,
      modelUsed: agentResult.modelUsed,
    });

    // Update session timestamp
    session.lastMessageAt = new Date();
    await session.save();

    // 7. Emit Final Metadata & Complete Event with Real-Time Quota
    sendEvent("meta", {
      messageId: assistantMsgDoc._id,
      bundles: agentResult.bundles,
      products: populatedProducts,
      sources: agentResult.sources,
      toolCalls: agentResult.toolCalls,
      modelUsed: agentResult.modelUsed,
    });

    const updatedQuota = await getUserAiQuotaStatus(user, visitorId);
    sendEvent("done", { sessionId: session._id, quota: updatedQuota });
    res.end();
  } catch (error) {
    console.error("AI Stream Error:", error);
    sendEvent("error", { message: error.message || "An unexpected error occurred." });
    res.end();
  }
};

/**
 * @desc    Get List of AI Chat Sessions
 * @route   GET /api/ai/sessions
 * @access  Public / Authenticated
 */
export const getAiSessions = async (req, res) => {
  try {
    const user = req.user;
    const visitorId = req.headers["x-visitor-id"] || req.query.visitorId;

    const filter = user?._id
      ? { user: user._id }
      : { visitorId: visitorId || "anon", user: null };

    const sessions = await AiChatSession.find(filter)
      .sort({ isPinned: -1, lastMessageAt: -1 })
      .limit(30)
      .lean();

    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Get Single AI Session with Full Message History
 * @route   GET /api/ai/sessions/:sessionId
 * @access  Public / Authenticated
 */
export const getAiSessionDetail = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid session ID." });
    }

    const session = await AiChatSession.findById(sessionId).lean();
    if (!session) {
      return res.status(404).json({ success: false, message: "Session not found." });
    }

    const messages = await AiChatMessage.find({ session: sessionId })
      .sort({ createdAt: 1 })
      .populate("products", "title sellingPrice maxPrice images stock rating totalReviews category")
      .lean();

    return res.status(200).json({ success: true, session, messages });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Delete AI Chat Session
 * @route   DELETE /api/ai/sessions/:sessionId
 * @access  Public / Authenticated
 */
export const deleteAiSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    if (!sessionId || !mongoose.Types.ObjectId.isValid(sessionId)) {
      return res.status(400).json({ success: false, message: "Invalid session ID." });
    }

    await Promise.all([
      AiChatSession.findByIdAndDelete(sessionId),
      AiChatMessage.deleteMany({ session: sessionId }),
    ]);

    return res.status(200).json({ success: true, message: "Session deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Direct Agent Action: Bulk Add Bundle to Cart
 * @route   POST /api/ai/action/cart
 * @access  Authenticated
 */
export const addBundleToCartAction = async (req, res) => {
  try {
    const { items = [] } = req.body;
    const result = await executeCartAction({ user: req.user, items });
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Direct Agent Action: Bulk Add Bundle to Wishlist
 * @route   POST /api/ai/action/wishlist
 * @access  Authenticated
 */
export const addBundleToWishlistAction = async (req, res) => {
  try {
    const { productIds = [], action = "add" } = req.body;
    const result = await executeWishlistAction({ user: req.user, productIds, action });
    return res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

/**
 * @desc    Direct Agent Action: Get Product Review Insights
 * @route   GET /api/ai/action/review-insights/:productId
 * @access  Public
 */
export const getReviewInsightsAction = async (req, res) => {
  try {
    const { productId } = req.params;
    const result = await getProductReviewInsights({ productId });
    return res.status(200).json({ success: true, insights: result });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
