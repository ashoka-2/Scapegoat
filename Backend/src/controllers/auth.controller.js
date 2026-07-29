import userModel from "../models/user.model.js";
import jwt from "jsonwebtoken";
import {config } from "../config/config.js";
import { handleServerError } from "../utils/errorHandler.js";
import redisClient from "../config/redis.js";


async function sendTokenResponse(user,res,message){
    const token = jwt.sign(
        {
            id:user._id,
            fullname:user.fullname,
            email:user.email,
            contact:user.contact,
            role:user.role,
            profilePic:user.profilePic,
            verified:user.verified,
        },
        config.JWT_SECRET,
        {
            expiresIn:"7d"
        }
    );

    res.cookie("token",token,{
        httpOnly:true,
        secure:config.NODE_ENV==="production",
        sameSite:"strict",
    });

    res.status(200).json({
        message,
        success:true,
        user:{
            id:user._id,
            email:user.email,
            contact:user.contact,
            fullname:user.fullname,
            role:user.role,
            profilePic:user.profilePic,
        }
    });
}


export const register = async (req,res) =>{
    const {email,contact,password,fullname,isseller} = req.body;

    try{
        const isExistingUser = await userModel.findOne({
            $or:[{email},{contact}],
        });

        if(isExistingUser){
            return res.status(400).json({
                message:"User with this email or contact already exists",
                success:false,
            })
        }
        const user = await userModel.create({
            email,contact,password,fullname,role:isseller?"seller":"buyer",
        });

        await sendTokenResponse(user,res,"user registered successfully");
    }
    catch(error){
        return handleServerError(res,error)
    }
}




export const login = async (req,res)=>{
    const {identifier,password} = req.body;

    try{
        const user = await userModel.findOne({
            $or:[{email: identifier},{contact:identifier}],
        }).select("+password");

        if(!user){
            return res.status(400).json({
                message:"Invalid email/contact or password",
                success:false,
            })
        }

        if(user.isBanned){
            return res.status(403).json({
                message:"You are banned and cannot login."
            })
        }

        const isPasswordValid = await user.comparePassword(password);

        if(!isPasswordValid){
            return res.status(400).json({
                message:"Invalid email/contact or password"
            })
        }

        await sendTokenResponse(user,res,"User Logged In successfully")

    }
    catch(error){
        return handleServerError(res,error)
        
    }
} 


export const getMe = async (req,res) => {
    const userId = req.user?.id;

    if (!userId) {
        return res.status(401).json({ message: "Not authenticated" });
    }

    const user = await userModel.findById(userId);

    if (!user) {
        return res.status(400).json({
            success: false,
            message: "User not found",
            err: "user not found",
        });
    }

    res.status(200).json({
        success: true,
        user,
    });
};


export const logout = async (req, res) => {
    const token = req.cookies.token;

    try {
        if (token) {
            await redisClient.set(`blacklist_${token}`, "true", "EX", 7 * 24 * 60 * 60);
        }

        res.clearCookie("token", {
            httpOnly: true,
            secure: config.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.status(200).json({
            success: true,
            message: "Logged out successfully",
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: "Server error during logout" });
    }
};



export const googleCallback = async (req,res) => {
    const passportUser = req.user;

    if (!passportUser) {
        return res.redirect(`${config.FRONTEND_URL}/login?error=auth_failed`);
    }

    const { id, displayName, emails, photos } = passportUser;
    const email = emails[0].value;
    const profilePic = photos && photos.length > 0 ? photos[0].value : undefined;

    try {
        let user = await userModel.findOne({ email });

        if (!user) {
            user = await userModel.create({
                email,
                googleId: id,
                fullname: displayName,
                contact: `G-${id}`.slice(0, 15), 
                role: "buyer", 
                profilePic: profilePic, 
            });
        }

        if (user.isBanned) {
            return res.redirect(`${config.FRONTEND_URL}/login?error=banned`);
        }

        const token = jwt.sign(
            {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
                contact: user.contact,
                role: user.role,
                profilePic: user.profilePic,
                verified: user.verified,
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "strict",
        });

        res.redirect(config.FRONTEND_URL);
    } catch (error) {
        console.log(error);
        res.redirect(`${config.FRONTEND_URL}/login?error=server_error`);
    }
};