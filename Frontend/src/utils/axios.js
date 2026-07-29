import axios from "axios";

// Read API base URL from env, or default to empty string for relative paths (working with vite dev proxy)
const API_BASE_URL = import.meta.env.VITE_BACKEND_URL || "";

const customAxios = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true
});

// Configure defaults for global axios instances if used directly in some components
axios.defaults.baseURL = API_BASE_URL;
axios.defaults.withCredentials = true;

export default customAxios;
export { API_BASE_URL };
