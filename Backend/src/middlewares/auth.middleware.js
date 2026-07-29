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

