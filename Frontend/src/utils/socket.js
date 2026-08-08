import { io } from "socket.io-client";
import { API_BASE_URL } from "./axios";

// Determine Socket.IO server URL dynamically based on environment configuration
const SOCKET_SERVER_URL = import.meta.env.VITE_BACKEND_URL || API_BASE_URL || window.location.origin;

const socket = io(SOCKET_SERVER_URL, {
  withCredentials: true,
  transports: ["polling", "websocket"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 2000,
});

export default socket;
