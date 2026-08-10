import jwt from "jsonwebtoken";
import userModel from "../models/user.model.js";
import { config } from "../config/config.js";
import redisClient from "../config/redis.js";

import { parseUserAgent } from "../utils/userAgentParser.js";

export const verifyToken = async (req,res,next)=>{
    // Cookie-first (works in Chrome/Firefox), then Bearer-header fallback for
    // browsers that block cross-site cookies in third-party/embedded contexts
    // (Brave Shields). The Google OAuth redirect stores a token that the
    // frontend sends as `Authorization: Bearer <token>`; email/password login
    // also returns the cookie normally.
    const bearer =
        req.headers.authorization && req.headers.authorization.startsWith("Bearer ")
            ? req.headers.authorization.slice(7)
            : null;
    const token = req.cookies.token || bearer;

    if(!token){
        return res.status(401).json({
            message:"Not authenticated"
        });
    }
    try{
        const isBlacklisted = await redisClient.get(`blacklist_${token}`);
        if(isBlacklisted){
            return res.status(401).json({
                message:"Token is no longer valid"
            });
        }

        const decoded = jwt.verify(token,config.JWT_SECRET);
        const user = await userModel.findById(decoded.id);

        if(!user||user.isBanned){
            return res.status(401).json({
                message:"Not authenticated or account is banned."
            })
        }

        // Asynchronously update activity timestamp & deviceInfo (including Brave & mobile models)
        const uaHeader = req.headers["user-agent"] || "";
        const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
        user.lastActiveAt = new Date();
        user.deviceInfo = parseUserAgent(uaHeader, clientIp, req.headers);
        user.save().catch(() => {});

        req.user = user;
        next();
    }
    catch(error){
        return res.status(401).json({
            message:"Invalid token"
        });
    }
};

export const requireRole = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ message: "Not authenticated" });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(403).json({
                message: `Access denied. Requires one of the following roles: ${allowedRoles.join(", ")}`
            });
        }
        next();
    };
};

export const optionalVerifyToken = async (req, res, next) => {
    const token = req.cookies?.token;
    if (!token) return next();
    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await userModel.findById(decoded.id);
        if (user && !user.isBanned) {
            const uaHeader = req.headers["user-agent"] || "";
            const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
            user.lastActiveAt = new Date();
            user.deviceInfo = parseUserAgent(uaHeader, clientIp, req.headers);
            user.save().catch(() => {});
            req.user = user;
        }
    } catch (e) {}
    next();
};
