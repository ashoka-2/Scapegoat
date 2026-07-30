import jwt from "jsonwebtoken";

import userModel from "../models/user.model.js";

import { config } from "../config/config.js";
import redisClient from "../config/redis.js"

export const verifyToken = async (req,res,next)=>{
    const token = req.cookies.token;

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

