import rateLimit from "express-rate-limit";

// ─── General API limiter (applied globally) ────────────────────────────────────
// 1000 requests per 15 minutes per IP — broad DDoS protection
export const generalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 1000,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many requests. Please slow down and try again in a few minutes.",
    },
    skip: (req) => {
        // Skip rate limiting for socket.io polling and health check endpoints
        return req.path.startsWith("/socket.io") || req.path === "/api/health" || req.path === "/";
    },
});

// ─── Auth limiter (login, forgot-password, reset-password) ─────────────────────
// 100 login attempts per 15 minutes — prevent brute-force
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please wait 15 minutes before trying again.",
    },
});

// ─── Register limiter ──────────────────────────────────────────────────────────
// 5 registrations per hour per IP — prevent account farming
export const registerLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many accounts created from this IP. Please try again after an hour.",
    },
});

// ─── Checkout / Order limiter ──────────────────────────────────────────────────
// 10 order placements per 15 minutes — prevent checkout spam and bot buying
export const checkoutLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many orders placed in a short time. Please wait before placing another order.",
    },
});
