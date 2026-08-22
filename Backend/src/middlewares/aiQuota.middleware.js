import redisClient, { isRedisReady } from "../config/redis.js";

// In-memory fallback map if Redis is temporarily unreachable
const inMemoryQuotaMap = new Map();

const DAILY_LIMITS = {
  REGISTERED_CHAT: 25,
  REGISTERED_IMAGE: 5,
  GUEST_CHAT: 2,
  GUEST_IMAGE: 0,
};

/**
 * Generates daily date key in YYYY-MM-DD format (UTC)
 */
const getTodayKey = () => {
  const now = new Date();
  return now.toISOString().slice(0, 10);
};

/**
 * Gets remaining seconds until midnight UTC
 */
const getSecondsUntilMidnight = () => {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setUTCHours(24, 0, 0, 0);
  return Math.max(Math.floor((midnight.getTime() - now.getTime()) / 1000), 60);
};

/**
 * Returns current quota metrics for a given user or visitor
 */
export const getUserAiQuotaStatus = async (user, visitorId) => {
  if (user?.role === "admin") {
    return {
      isAdmin: true,
      chatLimit: 999999,
      chatUsed: 0,
      chatRemaining: 999999,
      imageLimit: 999999,
      imageUsed: 0,
      imageRemaining: 999999,
      resetsInSeconds: getSecondsUntilMidnight(),
    };
  }

  const isRegistered = Boolean(user?._id);
  const identifier = isRegistered ? `user:${user._id}` : `guest:${visitorId || "anon"}`;
  const today = getTodayKey();
  const chatKey = `ai_quota:chat:${identifier}:${today}`;
  const imageKey = `ai_quota:image:${identifier}:${today}`;

  const maxChat = isRegistered ? DAILY_LIMITS.REGISTERED_CHAT : DAILY_LIMITS.GUEST_CHAT;
  const maxImage = isRegistered ? DAILY_LIMITS.REGISTERED_IMAGE : DAILY_LIMITS.GUEST_IMAGE;

  let chatUsed = 0;
  let imageUsed = 0;

  if (isRedisReady()) {
    try {
      const [chatVal, imageVal] = await Promise.all([
        redisClient.get(chatKey),
        redisClient.get(imageKey),
      ]);
      chatUsed = parseInt(chatVal || "0", 10);
      imageUsed = parseInt(imageVal || "0", 10);
    } catch {
      // Ignore and fallback to in-memory
      chatUsed = inMemoryQuotaMap.get(chatKey) || 0;
      imageUsed = inMemoryQuotaMap.get(imageKey) || 0;
    }
  } else {
    chatUsed = inMemoryQuotaMap.get(chatKey) || 0;
    imageUsed = inMemoryQuotaMap.get(imageKey) || 0;
  }

  return {
    isAdmin: false,
    isRegistered,
    chatLimit: maxChat,
    chatUsed,
    chatRemaining: Math.max(0, maxChat - chatUsed),
    imageLimit: maxImage,
    imageUsed,
    imageRemaining: Math.max(0, maxImage - imageUsed),
    resetsInSeconds: getSecondsUntilMidnight(),
  };
};

/**
 * Middleware: Enforces daily AI chat quota
 */
export const checkAiChatQuota = async (req, res, next) => {
  try {
    const user = req.user;
    const visitorId = req.headers["x-visitor-id"] || req.body?.visitorId;

    if (user?.role === "admin") {
      req.aiQuota = { isAdmin: true };
      return next();
    }

    const quota = await getUserAiQuotaStatus(user, visitorId);

    if (quota.chatRemaining <= 0) {
      return res.status(429).json({
        success: false,
        isQuotaExceeded: true,
        message: quota.isRegistered
          ? "You have reached your daily limit of 25 AI Stylist queries. Your quota resets at midnight!"
          : "You have used your 2 free trial AI queries. Please sign in to enjoy 25 free daily AI Stylist queries!",
        quota,
      });
    }

    // Increment usage
    const isRegistered = Boolean(user?._id);
    const identifier = isRegistered ? `user:${user._id}` : `guest:${visitorId || "anon"}`;
    const today = getTodayKey();
    const chatKey = `ai_quota:chat:${identifier}:${today}`;
    const ttl = getSecondsUntilMidnight();

    if (isRedisReady()) {
      try {
        const count = await redisClient.incr(chatKey);
        if (count === 1) {
          await redisClient.expire(chatKey, ttl);
        }
      } catch {
        inMemoryQuotaMap.set(chatKey, (inMemoryQuotaMap.get(chatKey) || 0) + 1);
      }
    } else {
      inMemoryQuotaMap.set(chatKey, (inMemoryQuotaMap.get(chatKey) || 0) + 1);
    }

    req.aiQuota = quota;
    next();
  } catch (error) {
    console.error("AI Quota check error:", error);
    next(); // Don't block on internal quota errors
  }
};

/**
 * Middleware: Enforces daily AI image generation / try-on quota
 */
export const checkAiImageQuota = async (req, res, next) => {
  try {
    const user = req.user;
    const visitorId = req.headers["x-visitor-id"] || req.body?.visitorId;

    if (user?.role === "admin") {
      return next();
    }

    if (!user?._id) {
      return res.status(401).json({
        success: false,
        message: "Please sign in to use AI Image Vision and Virtual Try-On features.",
      });
    }

    const quota = await getUserAiQuotaStatus(user, visitorId);

    if (quota.imageRemaining <= 0) {
      return res.status(429).json({
        success: false,
        isQuotaExceeded: true,
        message: "You have reached your daily limit of 5 AI Virtual Try-on / Image generations. Resets at midnight!",
        quota,
      });
    }

    // Increment usage
    const identifier = `user:${user._id}`;
    const today = getTodayKey();
    const imageKey = `ai_quota:image:${identifier}:${today}`;
    const ttl = getSecondsUntilMidnight();

    if (isRedisReady()) {
      try {
        const count = await redisClient.incr(imageKey);
        if (count === 1) {
          await redisClient.expire(imageKey, ttl);
        }
      } catch {
        inMemoryQuotaMap.set(imageKey, (inMemoryQuotaMap.get(imageKey) || 0) + 1);
      }
    } else {
      inMemoryQuotaMap.set(imageKey, (inMemoryQuotaMap.get(imageKey) || 0) + 1);
    }

    next();
  } catch (error) {
    console.error("AI Image Quota check error:", error);
    next();
  }
};
