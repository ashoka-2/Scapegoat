import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
import helmet from "helmet";
import passport from "passport";
import "./config/passport.js";

import { config } from "./config/config.js";

import authRouter from "./routes/auth.routes.js";
import productRouter from "./routes/product.routes.js";
import cartRouter from "./routes/cart.routes.js";
import wishlistRouter from "./routes/wishlist.routes.js";
import categoryRouter from "./routes/category.routes.js";
import brandRouter from "./routes/brand.routes.js";
import unitRouter from "./routes/unit.routes.js";
import activityRouter from "./routes/userActivity.routes.js";
import messageRouter from "./routes/message.routes.js";
import settingRouter from "./routes/setting.routes.js";
import orderRouter from "./routes/order.routes.js";
import reviewRouter from "./routes/review.routes.js";
import adminRouter from "./routes/admin.routes.js";
import bannerRouter from "./routes/banner.routes.js";
import notificationRouter from "./routes/notification.routes.js";
import couponRouter from "./routes/coupon.routes.js";
import aiRouter from "./routes/ai.routes.js";
import billRouter from "./routes/bill.routes.js";
import { generalLimiter } from "./middlewares/rateLimiter.middleware.js";
import { isAllowedCorsOrigin, parseAllowedOrigins } from "./config/corsPolicy.js";

const app = express();

// Parse environment configured origins
const originsList = parseAllowedOrigins(config.FRONTEND_URL);

// CORS is a browser boundary, not authorization. Credentialed browser requests
// must use an explicit allowlist; never reflect arbitrary origins.
const isAllowedOrigin = (origin) => isAllowedCorsOrigin(origin, originsList, config.NODE_ENV);

// 1. CORS Middleware (Must be registered FIRST before all routes and parsers)
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(new Error("Origin is not allowed by CORS"));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  // X-Visitor-Id is sent by the frontend axios interceptor on EVERY request
  // (guest activity tracking) — omitting it here makes every preflight fail,
  // which the axios retry interceptor then re-fires with 8/15/25s backoffs
  // (pages take tens of seconds to load). Reflect the client's requested
  // headers instead of a fixed list so future custom headers keep working.
  allowedHeaders: [
    "Content-Type",
    "Authorization",
    "X-Requested-With",
    "Accept",
    "X-Visitor-Id",
    "X-Visitor",
  ],
  maxAge: 86400, // cache preflight responses 24h → no OPTIONS round-trip on repeat calls
};

// 1. Security Headers (Configured safely for separated Frontend/Backend domains)
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
    contentSecurityPolicy: false,
  })
);

// 2. CORS Handling
app.use(cors(corsOptions));

// 3. Logging & Body Parsers
app.use(morgan("dev"));
// Razorpay signs the exact request bytes. This route must run before the
// JSON parser so its HMAC verification is not performed over re-serialized JSON.
app.use("/api/orders/razorpay/webhook", express.raw({ type: "application/json", limit: "1mb" }));
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ extended: true, limit: "25mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// 3. Health Check
app.get("/", (_req, res) => {
  res.status(200).json({ message: "Scapegoat API Server is running" });
});

// Public health endpoint — used by the frontend wake-ping and uptime keep-alive
// monitors so the Render free tier doesn't serve 502s while spinning up.
app.get("/api/health", (_req, res) => {
  res.set("Cache-Control", "no-store");
  res.status(200).json({ ok: true, service: "scapegoat-api", uptime: Math.round(process.uptime()) });
});

// 4. Rate Limiting (DDoS & Abuse Protection matching Snitch)
app.use("/api", generalLimiter);

// 5. API Routes
app.use("/api/auth", authRouter);
app.use("/api/products", productRouter);
app.use("/api/cart", cartRouter);
app.use("/api/wishlist", wishlistRouter);
app.use("/api/categories", categoryRouter);
app.use("/api/brands", brandRouter);
app.use("/api/units", unitRouter);
app.use("/api/activity", activityRouter);
app.use("/api/messages", messageRouter);
app.use("/api/settings", settingRouter);
app.use("/api/orders", orderRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/admin", adminRouter);
app.use("/api/banners", bannerRouter);
app.use("/api/notifications", notificationRouter);
app.use("/api/coupons", couponRouter);
app.use("/api/ai", aiRouter);
app.use("/api/bills", billRouter);

// 6. Global Error Handling Middleware (Ensures CORS headers are preserved on error responses)
app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  if (err && (err.name === "MulterError" || err.code?.startsWith?.("LIMIT_"))) {
    return res.status(400).json({
      success: false,
      message: err.message || "File upload error: payload or field size exceeds allowed limit",
    });
  }

  console.error("Unhandled Backend Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
