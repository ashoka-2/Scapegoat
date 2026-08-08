import { io } from "socket.io-client";
import { API_BASE_URL } from "./axios";

// Determine Socket.IO server URL dynamically based on environment configuration
// DEV: same-origin (window.location.origin) → Vite proxies /socket.io to the local
// backend → no CORS, cookies just work. PROD: VITE_BACKEND_URL baked in at build time.
const SOCKET_SERVER_URL = import.meta.env.DEV
  ? window.location.origin
  : (import.meta.env.VITE_BACKEND_URL || API_BASE_URL || window.location.origin);

const socket = io(SOCKET_SERVER_URL, {
  withCredentials: true,
  transports: ["polling", "websocket"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

export default socket;
