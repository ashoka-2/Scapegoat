import { Redis } from "ioredis";
import { config } from "./config.js";

let redisClient = null;
let isConnected = false;

try {
    redisClient = new Redis({
        host: config.REDIS_HOST,
        port: config.REDIS_PORT,
        password: config.REDIS_PASSWORD,
        maxRetriesPerRequest: 2,
        connectTimeout: 5000,
        retryStrategy: (times) => {
            // Exponential backoff up to 10s
            return Math.min(times * 200, 10000);
        },
        lazyConnect: false,
    });

    redisClient.on("connect", () => {
        isConnected = true;
        console.log("✅ [Redis] Connected successfully to Redis server");
    });

    redisClient.on("ready", () => {
        isConnected = true;
    });

    redisClient.on("close", () => {
        isConnected = false;
    });

    redisClient.on("error", (error) => {
        isConnected = false;
        console.warn("⚠️ [Redis] Non-fatal Redis connection issue:", error.message || error);
    });
} catch (err) {
    console.warn("⚠️ [Redis] Failed to initialize Redis client. Fallback to direct DB queries:", err.message);
    redisClient = null;
}

export const isRedisReady = () => isConnected && redisClient && redisClient.status === "ready";

export default redisClient;