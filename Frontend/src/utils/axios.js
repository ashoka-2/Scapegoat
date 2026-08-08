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
// headers) until the cold start (~30–60s) completes. These helpers retry
// idempotent requests with backoff so production keeps working through the
// spin-up. POSTs are never auto-retried (no duplicate side effects), and dev is
// unaffected (the local backend never fails, so no retries ever fire).
const RETRYABLE_CODES = new Set([502, 503, 504]);
const RETRY_DELAYS = [8000, 15000, 25000]; // ≈ 48s total, covers a cold start

export function attachRetryInterceptor(instance) {
    instance.interceptors.response.use(
        (res) => res,
        async (error) => {
            const config = error.config || {};
            const method = (config.method || "get").toLowerCase();
            const status = error.response ? error.response.status : 0; // 0 = network/CORS-level failure
            const idempotent = ["get", "put", "delete", "head", "options"].includes(method);
            const retryable = idempotent && (status === 0 || RETRYABLE_CODES.has(status));
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

attachRetryInterceptor(customAxios);
attachRetryInterceptor(axios); // global axios instance used across the app

// Configure global axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

/**
 * Creates a domain-aware Axios instance for a specific API module (e.g., "/api/products")
 * Guarantees that the base URL inherits API_BASE_URL correctly across environment configurations.
 */
export function createApiInstance(endpoint = "") {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return attachRetryInterceptor(axios.create({
        baseURL: `${API_BASE_URL}${normalizedEndpoint}`,
        withCredentials: true,
    }));
}

export default customAxios;
export { API_BASE_URL };

