import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";
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

const app = express();

// Parse environment configured origins
const allowedOrigins = (config.FRONTEND_URL || "")
  .split(",")
  .concat(config.BACKEND_URL || "")
  .map((url) => url.trim().replace(/\/+$/, ""))
  .filter(Boolean);

const originsList = Array.from(new Set(allowedOrigins));

// Helper function to validate allowed CORS origins (Localhost, Vercel, Render)
const isAllowedOrigin = (origin) => {
  if (!origin) return true;
  const cleanOrigin = origin.trim().replace(/\/+$/, "");
  if (
    cleanOrigin.startsWith("http://localhost") ||
    cleanOrigin.startsWith("http://127.0.0.1") ||
    cleanOrigin.endsWith(".vercel.app") ||
    cleanOrigin.endsWith(".onrender.com") ||
    originsList.includes(cleanOrigin)
  ) {
    return true;
  }
  return false;
};

// 1. CORS Middleware (Must be registered FIRST before all routes and parsers)
const corsOptions = {
  origin: (origin, callback) => {
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Fallback to allow request in dev/prod
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With", "Accept"],
};

app.use(cors(corsOptions));

// 2. Logging & Body Parsers (Increased to 50mb for rich product description images)
app.use(morgan("dev"));
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
app.use(passport.initialize());

// 3. Health Check
app.get("/", (_req, res) => {
  res.status(200).json({ message: "Scapegoat API Server is running" });
});

// 4. API Routes
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

// 5. Global Error Handling Middleware (Ensures CORS headers are preserved on error responses)
app.use((err, req, res, next) => {
  const origin = req.headers.origin;
  if (origin && isAllowedOrigin(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Credentials", "true");
  }

  console.error("Unhandled Backend Error:", err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

export default app;
