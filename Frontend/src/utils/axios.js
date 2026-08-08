import axios from "axios";

// Read API base URL from env (supports both VITE_API_URL and VITE_BACKEND_URL)
const rawEnvUrl = import.meta.env.VITE_API_URL || import.meta.env.VITE_BACKEND_URL;

// Ensure base URL has no trailing slash.
// In production (Vercel), fallback to production Render backend if env is undefined,
// ensuring requests never hit Vercel's host domain.
// In development mode, fallback to empty string so Vite proxy handles /api.
const API_BASE_URL = (rawEnvUrl && rawEnvUrl.trim())
    ? rawEnvUrl.trim().replace(/\/+$/, "")
    : (import.meta.env.PROD ? "https://scapegoat-5rmz.onrender.com" : "");

const customAxios = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

// Configure global axios defaults
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

/**
 * Creates a domain-aware Axios instance for a specific API module (e.g., "/api/products")
 * Guarantees that the base URL inherits API_BASE_URL correctly across environment configurations.
 */
export function createApiInstance(endpoint = "") {
    const normalizedEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return axios.create({
        baseURL: `${API_BASE_URL}${normalizedEndpoint}`,
        withCredentials: true,
    });
}

export default customAxios;
export { API_BASE_URL };

