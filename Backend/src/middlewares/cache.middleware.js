import { getCache, setCache } from "../services/cache.service.js";

/**
 * Express middleware for automatic Cache-Aside caching on GET routes.
 * @param {string} prefix - Key namespace (e.g., 'products', 'categories', 'banners')
 * @param {number} ttlSeconds - Time-to-live in seconds (default 600s = 10 mins)
 */
export const cacheRoute = (prefix, ttlSeconds = 600) => {
    return async (req, res, next) => {
        // Only cache safe GET requests
        if (req.method !== "GET") {
            return next();
        }

        // Bypass cache if request specifically asks for fresh data
        const forceFresh = req.query.fresh === "true" || req.headers["cache-control"] === "no-cache";
        if (forceFresh) {
            res.setHeader("X-Cache", "BYPASS");
            return next();
        }

        // Build a normalized, deterministic cache key
        const sortedQueryParams = Object.keys(req.query)
            .filter((k) => k !== "fresh" && k !== "_")
            .sort()
            .map((k) => `${k}=${encodeURIComponent(req.query[k])}`)
            .join("&");

        const normalizedPath = req.originalUrl.split("?")[0].replace(/\/+$/, "");
        const cacheKey = sortedQueryParams
            ? `${prefix}:${normalizedPath}:${sortedQueryParams}`
            : `${prefix}:${normalizedPath}`;

        try {
            const cachedData = await getCache(cacheKey);

            if (cachedData) {
                res.setHeader("X-Cache", "HIT");
                res.setHeader("X-Cache-Key", cacheKey);
                return res.status(200).json(cachedData);
            }

            // Cache MISS: Intercept res.json to store into Redis before sending to client
            res.setHeader("X-Cache", "MISS");
            res.setHeader("X-Cache-Key", cacheKey);

            const originalJson = res.json.bind(res);

            res.json = (body) => {
                // Only cache successful JSON payloads
                if (res.statusCode >= 200 && res.statusCode < 300 && body && body.success !== false) {
                    setCache(cacheKey, body, ttlSeconds).catch(() => {});
                }
                return originalJson(body);
            };

            next();
        } catch (err) {
            console.warn(`[Cache Middleware Error] Proceeding without cache:`, err.message);
            next();
        }
    };
};
