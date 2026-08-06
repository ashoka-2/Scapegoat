import { Server } from "socket.io";
import { config } from "../config/config.js";
import mongoose from "mongoose";
import userModel from "../models/user.model.js";
import { parseUserAgent } from "../utils/userAgentParser.js";

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
        socket.on("join_room", async (roomName, metadata = {}) => {
            if (roomName) {
                socket.join(roomName);
                console.log(`Socket ${socket.id} joined room: ${roomName}`);

                const rawUserId = roomName.replace("user_", "").replace("seller_", "");
                if (mongoose.Types.ObjectId.isValid(rawUserId)) {
                    const uaString = socket.handshake.headers["user-agent"] || metadata.userAgent || "";
                    const ip = socket.handshake.address || "";
                    const parsedDevice = parseUserAgent(uaString, ip, socket.handshake.headers);

                    userModel.findByIdAndUpdate(rawUserId, {
                        lastActiveAt: new Date(),
                        deviceInfo: parsedDevice,
                    }).catch(() => {});
                }
            }
        });

        // User heartbeat activity ping
        socket.on("user_ping", async (data = {}) => {
            if (data.userId && mongoose.Types.ObjectId.isValid(data.userId)) {
                const uaString = socket.handshake.headers["user-agent"] || data.userAgent || "";
                const ip = socket.handshake.address || "";
                const parsedDevice = parseUserAgent(uaString, ip, socket.handshake.headers);

                userModel.findByIdAndUpdate(data.userId, {
                    lastActiveAt: new Date(),
                    deviceInfo: parsedDevice,
                }).catch(() => {});
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