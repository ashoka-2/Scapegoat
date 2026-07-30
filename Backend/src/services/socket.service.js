import { Server } from "socket.io";
import { config } from "../config/config.js";

let io;

export const setupSocket = (httpServer) => {
    io = new Server(httpServer, {
        cors: {
            origin: config.FRONTEND_URL,
            methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
            credentials: true,
        },
    });

    io.on("connection", (socket) => {
        console.log(`Socket client connected: ${socket.id}`);

        // Join private room (e.g. "user_64a7b..." or "seller_64a7b...")
        socket.on("join_room", (roomName) => {
            if (roomName) {
                socket.join(roomName);
                console.log(`Socket ${socket.id} joined room: ${roomName}`);
            }
        });

        // Leave private room
        socket.on("leave_room", (roomName) => {
            if (roomName) {
                socket.leave(roomName);
                console.log(`Socket ${socket.id} left room: ${roomName}`);
            }
        });

        socket.on("disconnect", () => {
            console.log(`Socket client disconnected: ${socket.id}`);
        });
    });

    return io;
};

/**
 * Emit an event ONLY to a specific user's private room
 */
export const emitToUser = (userId, eventType, data = {}) => {
    if (io && userId) {
        console.log(`Emitting event to user_${userId}: ${eventType}`);
        io.to(`user_${userId}`).emit(eventType, data);
    }
};

/**
 * Emit an event ONLY to a specific seller's private room (e.g. New Order alert)
 */
export const emitToSeller = (sellerId, eventType, data = {}) => {
    if (io && sellerId) {
        console.log(`Emitting event to seller_${sellerId}: ${eventType}`);
        io.to(`seller_${sellerId}`).emit(eventType, data);
    }
};

/**
 * Broadcast an event globally to ALL connected sockets
 */
export const broadcastUpdate = (eventType, data = {}) => {
    if (io) {
        console.log(`Broadcasting global Socket event: ${eventType}`);
        io.emit("realtime_update", { type: eventType, data });
    } else {
        console.warn("Socket.io is not initialized yet!");
    }
};