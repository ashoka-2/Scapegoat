import axios from "axios";

// Read API base URL strictly from environment variables (VITE_BACKEND_URL or VITE_API_URL)
const rawEnvUrl = import.meta.env.VITE_BACKEND_URL || import.meta.env.VITE_API_URL;

// Ensure base URL has no trailing slash. If not defined in .env, default to empty string for relative dev/proxy routing.
const API_BASE_URL = (rawEnvUrl && rawEnvUrl.trim())
    ? rawEnvUrl.trim().replace(/\/+$/, "")
    : "";

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

