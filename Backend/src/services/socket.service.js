import { Server } from "socket.io";
import { config } from "../config/config.js";
import mongoose from "mongoose";
import userModel from "../models/user.model.js";
import { parseUserAgent } from "../utils/userAgentParser.js";

let io;
const activeSocketsMap = new Map();

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

        // Track initial guest connection with request user-agent
        const initialUa = socket.handshake.headers["user-agent"] || "";
        const initialIp = socket.handshake.address || "";
        const initialDevice = parseUserAgent(initialUa, initialIp, socket.handshake.headers);

        activeSocketsMap.set(socket.id, {
            socketId: socket.id,
            _id: `guest_${socket.id}`,
            userId: null,
            fullname: "Guest Visitor",
            email: null,
            profilePic: null,
            role: "guest",
            isGuest: true,
            deviceInfo: initialDevice,
            lastActiveAt: new Date(),
        });

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

        // User or Guest heartbeat activity ping & client device detection
        socket.on("client_heartbeat", async (data = {}) => {
            const uaString = socket.handshake.headers["user-agent"] || data.userAgent || "";
            const ip = socket.handshake.address || "";
            const parsedDevice = parseUserAgent(uaString, ip, socket.handshake.headers);

            const finalDevice = {
                device: data.device || parsedDevice.device,
                browser: data.browser || parsedDevice.browser,
                os: data.os || parsedDevice.os,
                model: data.model || parsedDevice.model,
                ip: ip || "127.0.0.1",
                userAgent: uaString,
            };

            const sessionInfo = {
                socketId: socket.id,
                _id: data.userId || `guest_${socket.id}`,
                userId: data.userId || null,
                fullname: data.fullname || (data.userId ? "Registered User" : "Guest Visitor"),
                email: data.email || null,
                profilePic: data.profilePic || null,
                role: data.role || "guest",
                isGuest: !data.userId || data.role === "guest",
                deviceInfo: finalDevice,
                lastActiveAt: new Date(),
            };

            activeSocketsMap.set(socket.id, sessionInfo);

            if (data.userId && mongoose.Types.ObjectId.isValid(data.userId)) {
                await userModel.findByIdAndUpdate(data.userId, {
                    lastActiveAt: new Date(),
                    deviceInfo: finalDevice,
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
            activeSocketsMap.delete(socket.id);
        });
    });

    return io;
};

/**
 * Returns array of active non-admin live sessions (registered shoppers + guest visitors)
 */
export const getActiveShoppersAndGuests = () => {
    const twoMinsAgo = Date.now() - 2 * 60 * 1000;
    const activeSessions = [];
    const seenUsers = new Set();

    for (const [socketId, session] of activeSocketsMap.entries()) {
        const lastActiveTime = new Date(session.lastActiveAt).getTime();
        if (lastActiveTime >= twoMinsAgo && session.role !== "admin") {
            if (session.userId) {
                if (!seenUsers.has(session.userId)) {
                    seenUsers.add(session.userId);
                    activeSessions.push(session);
                }
            } else {
                activeSessions.push(session);
            }
        } else if (lastActiveTime < twoMinsAgo) {
            activeSocketsMap.delete(socketId);
        }
    }

    return activeSessions;
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