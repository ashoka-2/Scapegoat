import crypto from "crypto";

const COOKIE_NAME = "scapegoat_ai_guest";

const cookieOptions = {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
  secure: process.env.NODE_ENV === "production",
  maxAge: 1000 * 60 * 60 * 24 * 30,
  path: "/api/ai",
};

export const getGuestSessionHash = (req) => {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token || typeof token !== "string" || token.length < 32) return null;
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const ensureGuestSession = (req, res) => {
  const existing = getGuestSessionHash(req);
  if (existing) return existing;

  const token = crypto.randomBytes(32).toString("base64url");
  res.cookie(COOKIE_NAME, token, cookieOptions);
  return crypto.createHash("sha256").update(token).digest("hex");
};

export const aiGuestCookieName = COOKIE_NAME;
