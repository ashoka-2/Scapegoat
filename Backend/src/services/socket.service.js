import { Server } from "socket.io";
import { config } from "../config/config.js";
import mongoose from "mongoose";
import userModel from "../models/user.model.js";
import { parseUserAgent } from "../utils/userAgentParser.js";
import jwt from "jsonwebtoken";
import { isAllowedCorsOrigin, parseAllowedOrigins } from "../config/corsPolicy.js";

let io;
const activeSocketsMap = new Map();

export const setupSocket = (httpServer) => {
  const allowedOrigins = parseAllowedOrigins(config.FRONTEND_URL);
  io = new Server(httpServer, {
    cors: {
      origin: (origin, callback) => {
        if (isAllowedCorsOrigin(origin, allowedOrigins, config.NODE_ENV)) return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS"));
      },
      methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
      credentials: true,
    },
    allowRequest: (request, callback) => {
      const origin = request.headers.origin;
      callback(null, isAllowedCorsOrigin(origin, allowedOrigins, config.NODE_ENV));
    },
  });

  // Private user and seller events are authorized from the signed session,
  // never from a room name supplied by the browser.
  io.use(async (socket, next) => {
    try {
      const cookieHeader = socket.handshake.headers.cookie || "";
      const cookieToken = cookieHeader.split(";").map((part) => part.trim()).find((part) => part.startsWith("token="))?.slice(6);
      const token = socket.handshake.auth?.token || (cookieToken ? decodeURIComponent(cookieToken) : null);
      if (!token) return next();
      const decoded = jwt.verify(token, config.JWT_SECRET);
      const user = await userModel.findById(decoded.id).select("_id role fullname isBanned").lean();
      if (user && !user.isBanned) {
        socket.data.userId = String(user._id);
        socket.data.userRole = user.role;
        socket.data.fullname = user.fullname;
      }
      return next();
    } catch {
      return next();
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket client connected: ${socket.id}`);

    // Track initial guest connection with request user-agent
    const initialUa = socket.handshake.headers["user-agent"] || "";
    const initialIp = socket.handshake.address || "";
    const initialDevice = parseUserAgent(
      initialUa,
      initialIp,
      socket.handshake.headers,
    );

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

    if (socket.data.userId) {
      socket.join(`user_${socket.data.userId}`);
      if (socket.data.userRole === "seller") socket.join(`seller_${socket.data.userId}`);
    }

    // Join only the caller's own private rooms. Arbitrary room names would
    // expose other customers' orders and billing events.
    socket.on("join_room", async (roomName, metadata = {}) => {
      const userId = socket.data.userId;
      const canJoinOwnUserRoom = userId && roomName === `user_${userId}`;
      const canJoinOwnSellerRoom = userId && socket.data.userRole === "seller" && roomName === `seller_${userId}`;
      if (canJoinOwnUserRoom || canJoinOwnSellerRoom) {
        socket.join(roomName);
        const rawUserId = userId;
        if (mongoose.Types.ObjectId.isValid(rawUserId)) {
          const uaString =
            socket.handshake.headers["user-agent"] || metadata.userAgent || "";
          const ip = socket.handshake.address || "";
          const parsedDevice = parseUserAgent(
            uaString,
            ip,
            socket.handshake.headers,
          );

          userModel
            .findByIdAndUpdate(rawUserId, {
              lastActiveAt: new Date(),
              deviceInfo: parsedDevice,
            })
            .catch(() => {});
        }
      }
    });

    // User or Guest heartbeat activity ping & client device detection
    socket.on("client_heartbeat", async (data = {}) => {
      const uaString =
        socket.handshake.headers["user-agent"] || data.userAgent || "";
      const ip = socket.handshake.address || "";
      const parsedDevice = parseUserAgent(
        uaString,
        ip,
        socket.handshake.headers,
      );

      const finalDevice = {
        device: data.device || parsedDevice.device,
        browser: data.browser || parsedDevice.browser,
        os: data.os || parsedDevice.os,
        model: data.model || parsedDevice.model,
        ip: ip || "127.0.0.1",
        userAgent: uaString,
      };

      const authenticatedId = socket.data.userId || null;
      const sessionInfo = {
        socketId: socket.id,
        _id: authenticatedId || `guest_${socket.id}`,
        userId: authenticatedId,
        fullname: socket.data.fullname || "Guest Visitor",
        email: null,
        profilePic: null,
        role: socket.data.userRole || "guest",
        isGuest: !authenticatedId,
        deviceInfo: finalDevice,
        lastActiveAt: new Date(),
      };

      activeSocketsMap.set(socket.id, sessionInfo);

      if (authenticatedId && mongoose.Types.ObjectId.isValid(authenticatedId)) {
        await userModel
          .findByIdAndUpdate(authenticatedId, {
            lastActiveAt: new Date(),
            deviceInfo: finalDevice,
          })
          .catch(() => {});
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
