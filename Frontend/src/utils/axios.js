import axios from "axios";

// Read API base URL strictly from environment variables (VITE_BACKEND_URL or VITE_API_URL)
const rawEnvUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;

// DEV (vite dev server): use RELATIVE URLs (/api/...) so every request goes through
// the Vite proxy in vite.config.js → same-origin → zero CORS, cookies just work.
// PROD (vite build): VITE_BACKEND_URL (set in Vercel dashboard) is baked in at build
// time and points at the Render backend (cross-origin, handled by backend CORS).
const API_BASE_URL = import.meta.env.DEV
    ? ""
    : (rawEnvUrl && rawEnvUrl.trim())
        ? rawEnvUrl.trim().replace(/\/+$/, "")
        : "";

const customAxios = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

// ── Render free-tier resilience ───────────────────────────────────────────────
// The Render free instance sleeps after ~15 min idle; a visitor's first requests
// hit 502 Bad Gateway (surfacing as "CORS blocked" — the 502 carries no CORS
// headers) until the cold start completes. These helpers retry with backoff so
// production keeps working through the spin-up. Retrying is SAFE whenever the
// request was NEVER processed by the app (network failure or 502/503/504 from
// the Render proxy) — no side effects can have occurred — so POSTs are retried
// too in exactly those cases. A response that the app actually produced (4xx/
// 5xx with a body, e.g. the visual-search 400) is never retried.
const RETRYABLE_CODES = new Set([502, 503, 504]);
const RETRY_DELAYS = [8000, 15000, 25000, 30000]; // ≈ 78s total, covers a cold start

export function attachRetryInterceptor(instance) {
    instance.interceptors.response.use(
        (res) => res,
        async (error) => {
            const config = error.config || {};
            const method = (config.method || "get").toLowerCase();
            const status = error.response ? error.response.status : 0; // 0 = network/CORS-level failure
            const neverProcessed = status === 0 || RETRYABLE_CODES.has(status);
            const retryable = neverProcessed; // any method — the request never reached the app
            if (!retryable || (config.__retryCount || 0) >= RETRY_DELAYS.length) {
                return Promise.reject(error);
            }
            const delay = RETRY_DELAYS[config.__retryCount || 0];
            config.__retryCount = (config.__retryCount || 0) + 1;
            await new Promise((r) => setTimeout(r, delay));
            return instance.request(config);
        }
    );
    return instance;
}

// Wake the backend on app boot so the cold start begins immediately in production
if (!import.meta.env.DEV && API_BASE_URL) {
    fetch(`${API_BASE_URL}/api/health`, { method: "GET" }).catch(() => {});
}

// ── Bearer-token auth (Brave/third-party-cookie-blocked browsers) ─────────────
// Browsers like Brave block cross-site cookies by default, so a cookie set on
// the Render backend never reaches it from vercel.app. The Google OAuth
// redirect now returns ?token=…; we store it here and send it as an
// Authorization header on every request. Cookie auth still works too.
export const AUTH_TOKEN_KEY = "scapegoat_token";

// Anonymous visitors get a stable per-device id so personalization works for
// guests too (the backend falls back to it when no auth token is present).
export function attachVisitorHeader(instance) {
    instance.interceptors.request.use((config) => {
        try {
            let id = localStorage.getItem("scapegoat_visitor_id");
            if (!id) {
                id =
                    "v_" +
                    Date.now().toString(36) +
                    "_" +
                    Math.random().toString(36).slice(2, 10) +
                    Math.random().toString(36).slice(2, 8);
                localStorage.setItem("scapegoat_visitor_id", id);
            }
            config.headers["X-Visitor-Id"] = id;
        } catch { /* ignore */ }
        return config;
    });
    return instance;
}

export function attachAuthHeader(instance) {
    instance.interceptors.request.use((config) => {
        const token = localStorage.getItem(AUTH_TOKEN_KEY);
        if (token && !(config.headers || {}).Authorization) {
            config.headers = config.headers || {};
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    });
    return instance;
}

attachRetryInterceptor(customAxios);
attachRetryInterceptor(axios); // global axios instance used across the app
attachAuthHeader(customAxios);
attachAuthHeader(axios);
attachVisitorHeader(customAxios);
attachVisitorHeader(axios);

// Configure global axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

/**
 * Creates a domain-aware Axios instance for a specific API module (e.g., "/api/products")
 * Guarantees that the base URL inherits API_BASE_URL correctly across environment configurations.
 */
export function createApiInstance(endpoint = "") {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return attachVisitorHeader(attachAuthHeader(attachRetryInterceptor(axios.create({
        baseURL: `${API_BASE_URL}${normalizedEndpoint}`,
        withCredentials: true,
    }))));
}

export default customAxios;
export { API_BASE_URL };

