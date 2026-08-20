import redisClient, { isRedisReady } from "../config/redis.js";

/**
 * Retrieves a cached value from Redis by key.
 * Returns null if not found, expired, or if Redis is unavailable.
 */
export const getCache = async (key) => {
    if (!isRedisReady()) return null;
    try {
        const data = await redisClient.get(key);
        if (!data) return null;
        return JSON.parse(data);
    } catch (err) {
        console.warn(`[Redis Cache] Get failed for key "${key}":`, err.message);
        return null;
    }
};

/**
 * Stores a value in Redis with a TTL in seconds (default 600s = 10 mins).
 */
export const setCache = async (key, value, ttlSeconds = 600) => {
    if (!isRedisReady()) return false;
    try {
        const serialized = JSON.stringify(value);
        await redisClient.set(key, serialized, "EX", ttlSeconds);
        return true;
    } catch (err) {
        console.warn(`[Redis Cache] Set failed for key "${key}":`, err.message);
        return false;
    }
};

/**
 * Deletes a single cache key.
 */
export const deleteCache = async (key) => {
    if (!isRedisReady()) return false;
    try {
        await redisClient.del(key);
        return true;
    } catch (err) {
        console.warn(`[Redis Cache] Del failed for key "${key}":`, err.message);
        return false;
    }
};

/**
 * Deletes all keys matching a pattern using non-blocking SCAN.
 * Example: deletePattern("products:*")
 */
export const deletePattern = async (pattern) => {
    if (!isRedisReady()) return false;
    try {
        let cursor = "0";
        do {
            const [nextCursor, keys] = await redisClient.scan(cursor, "MATCH", pattern, "COUNT", 100);
            cursor = nextCursor;
            if (keys && keys.length > 0) {
                await redisClient.del(...keys);
            }
        } while (cursor !== "0");
        return true;
    } catch (err) {
        console.warn(`[Redis Cache] Pattern deletion failed for "${pattern}":`, err.message);
        return false;
    }
};

/**
 * Invalidation hook: Clears catalog caches on mutations.
 */
export const clearCatalogCache = async () => {
    await Promise.all([
        deletePattern("products:*"),
        deletePattern("categories:*"),
        deletePattern("brands:*"),
        deletePattern("banners:*"),
    ]);
};
