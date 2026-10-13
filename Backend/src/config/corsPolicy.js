export const parseAllowedOrigins = (frontendUrl = "") =>
  Array.from(
    new Set(
      frontendUrl
        .split(",")
        .map((url) => url.trim().replace(/\/+$/, ""))
        .filter(Boolean)
    )
  );

export const isAllowedCorsOrigin = (origin, allowedOrigins, nodeEnv = "development") => {
  if (!origin) return true; // non-browser clients; authentication still applies
  const cleanOrigin = origin.trim().replace(/\/+$/, "");
  const localDevelopmentOrigin = nodeEnv !== "production" &&
    (cleanOrigin.startsWith("http://localhost:") || cleanOrigin.startsWith("http://127.0.0.1:"));
  return localDevelopmentOrigin || allowedOrigins.includes(cleanOrigin);
};
