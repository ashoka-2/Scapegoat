import userModel from "../models/user.model.js";
import wishlistModel from "../models/wishlist.model.js";
import cartModel from "../models/cart.model.js";
import orderModel from "../models/order.model.js";
import productModel from "../models/product.model.js";
import sellerCustomerModel from "../models/sellerCustomer.model.js";
import jwt from "jsonwebtoken";
import {config } from "../config/config.js";
import { handleServerError } from "../utils/errorHandler.js";
import redisClient from "../config/redis.js";
import { sendEmail } from "../services/mail.service.js";
import { getVerificationEmailTemplate, getPasswordResetEmailTemplate } from "../utils/emailTemplates.js";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;


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
            profileCompleted:user.profileCompleted,
        },
        config.JWT_SECRET,
        {
            expiresIn:"7d"
        }
    );

    // Cookie persists for 7 days (fixes daily login bug)
    res.cookie("token",token,{
        httpOnly:true,
        secure:config.NODE_ENV==="production",
        sameSite: config.NODE_ENV === "production" ? "none" : "strict",
        maxAge: SEVEN_DAYS_MS,
    });

    res.status(200).json({
        message,
        success: true,
        user: {
            id: user._id,
            email: user.email,
            contact: user.contact,
            fullname: user.fullname,
            role: user.role,
            profilePic: user.profilePic,
            profileCompleted: user.profileCompleted,
            verified: user.verified,
            addresses: user.addresses || [],
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
            email,contact,password,fullname,role:isseller?"seller":"buyer", profileCompleted: true
        });

        const emailVerificationToken = jwt.sign(
            { email: user.email },
            config.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const verificationLink = `${config.BACKEND_URL}/api/auth/verify-email?token=${emailVerificationToken}`;
        
        await sendEmail({
            to: email,
            subject: "Verify your Scapegoat email",
            html: getVerificationEmailTemplate(user.fullname, verificationLink)
        });

        res.status(200).json({
            success: true,
            message: "User registered successfully. Please check your email to verify your account.",
            user: {
                id: user._id,
                fullname: user.fullname,
                email: user.email,
            },
        });
    }
    catch(error){
        return handleServerError(res,error)
    }
}




import { parseUserAgent } from "../utils/userAgentParser.js";

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

        if (!user.verified) {
            return res.status(400).json({
                message: "Please verify your email to login",
                success: false
            });
        }

        // Save device info & login timestamps
        const uaHeader = req.headers["user-agent"] || "";
        const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
        user.deviceInfo = parseUserAgent(uaHeader, clientIp, req.headers);
        user.lastLoginAt = new Date();
        user.lastActiveAt = new Date();
        await user.save();

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

    // Update active timestamp and device info on heartbeats
    const uaHeader = req.headers["user-agent"] || "";
    const clientIp = req.ip || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "";
    user.deviceInfo = parseUserAgent(uaHeader, clientIp, req.headers);
    user.lastActiveAt = new Date();
    await user.save();

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
            sameSite: config.NODE_ENV === "production" ? "none" : "strict",
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
                verified: true, // Google users are auto-verified
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
                profileCompleted: user.profileCompleted,
            },
            config.JWT_SECRET,
            {
                expiresIn: "7d",
            }
        );

        res.cookie("token", token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: process.env.NODE_ENV === "production" ? "none" : "strict",
        });

        // Also pass the token in the URL so the frontend can store it and send
        // it as a Bearer header — this covers browsers that block cross-site
        // cookies (e.g. Brave Shields), where the cookie alone won't reach the API.
        res.redirect(`${config.FRONTEND_URL}/login?token=${token}`);
    } catch (error) {
        console.log(error);
        res.redirect(`${config.FRONTEND_URL}/login?error=server_error`);
    }
};

export const verifyEmail = async (req, res) => {
    const { token } = req.query;

    try {
        const decoded = jwt.verify(token, config.JWT_SECRET);
        const user = await userModel.findOne({ email: decoded.email });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid token or user not found" });
        }

        if (user.verified) {
            return res.status(200).send("<h1 style='font-family:sans-serif; text-align:center; margin-top:50px;'>Already verified! You can log in.</h1>");
        }

        user.verified = true;
        await user.save();

        return res.status(200).send("<h1 style='font-family:sans-serif; text-align:center; margin-top:50px; color:green;'>Successfully verified! You can now log in.</h1>");
    } catch (err) {
        return res.status(400).send("<h1 style='font-family:sans-serif; text-align:center; margin-top:50px; color:red;'>Verification failed. Token invalid or expired.</h1>");
    }
};

export const resendVerificationEmail = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const user = await userModel.findOne({ email });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        if (user.verified) {
            return res.status(400).json({ success: false, message: "User is already verified. Please log in." });
        }

        const emailVerificationToken = jwt.sign(
            { email: user.email },
            config.JWT_SECRET,
            { expiresIn: '1h' }
        );

        const verificationLink = `${config.BACKEND_URL}/api/auth/verify-email?token=${emailVerificationToken}`;

        await sendEmail({
            to: email,
            subject: "Verify your Scapegoat email",
            html: getVerificationEmailTemplate(user.fullname, verificationLink)
        });

        res.status(200).json({
            success: true,
            message: "Verification email sent successfully",
        });
    } catch (err) {
        return handleServerError(res, err);
    }
};

export const completeProfile = async (req, res) => {
    const { password, contact, isSeller } = req.body;
    const userId = req.user?.id;

    try {
        if (!userId) return res.status(401).json({ message: "Not authenticated" });
        
        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found" });

        if (user.profileCompleted) {
            return res.status(400).json({ message: "Profile already completed" });
        }

        user.password = password;
        user.contact = contact;
        user.role = isSeller ? "seller" : "buyer";
        user.profileCompleted = true;

        await user.save();

        await sendTokenResponse(user, res, "Profile completed successfully");
    } catch (error) {
        return handleServerError(res, error);
    }
};

export const updateProfile = async (req, res) => {
    const userId = req.user?.id;
    const { fullname, contact, profilePic, address, addresses } = req.body;

    try {
        if (!userId) return res.status(401).json({ message: "Not authenticated", success: false });

        const user = await userModel.findById(userId);
        if (!user) return res.status(404).json({ message: "User not found", success: false });

        if (fullname && fullname.trim()) user.fullname = fullname.trim();
        if (contact && contact.trim()) user.contact = contact.trim();
        if (profilePic && profilePic.trim()) user.profilePic = profilePic.trim();

        if (Array.isArray(addresses) && addresses.length > 0) {
            user.addresses = addresses;
        } else if (address && typeof address === "object") {
            const { street, city, state, country = "India", pincode } = address;
            if (street || city || pincode) {
                user.addresses = [
                    {
                        street: street || "",
                        city: city || "",
                        state: state || "",
                        country: country || "India",
                        pincode: pincode || "",
                        isDefault: true,
                    },
                ];
            }
        }

        await user.save();
        await sendTokenResponse(user, res, "Profile updated successfully");
    } catch (error) {
        return handleServerError(res, error);
    }
};

export const becomeSeller = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const user = await userModel.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        if (user.role === "seller") {
            return res.status(400).json({ success: false, message: "You are already a seller." });
        }
        user.role = "seller";
        await user.save();
        await sendTokenResponse(user, res, "Congratulations! You are now a Seller Partner on ScapeGoat.");
    } catch (error) {
        return handleServerError(res, error);
    }
};

export const changePassword = async (req, res) => {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;

    try {
        if (!userId) return res.status(401).json({ message: "Not authenticated", success: false });
        if (!currentPassword || !newPassword) {
            return res.status(400).json({ message: "Both current and new passwords are required", success: false });
        }

        const user = await userModel.findById(userId).select("+password");
        if (!user) return res.status(404).json({ message: "User not found", success: false });

        if (user.password) {
            const isMatch = await user.comparePassword(currentPassword);
            if (!isMatch) {
                return res.status(400).json({ message: "Current password is incorrect", success: false });
            }
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ success: true, message: "Password updated successfully" });
    } catch (error) {
        return handleServerError(res, error);
    }
};

export const forgotPassword = async (req, res) => {
    const { email } = req.body;

    try {
        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        const user = await userModel.findOne({ email: email.toLowerCase().trim() });
        if (!user) {
            return res.status(200).json({
                success: true,
                message: "If an account with that email exists, a password reset link has been sent.",
            });
        }

        const resetToken = jwt.sign(
            { id: user._id, email: user.email },
            config.JWT_SECRET,
            { expiresIn: "15m" }
        );

        const resetLink = `${config.FRONTEND_URL}/reset-password?token=${resetToken}`;

        await sendEmail({
            to: user.email,
            subject: "Reset your Scapegoat password",
            html: getPasswordResetEmailTemplate(user.fullname, resetLink),
        });

        return res.status(200).json({
            success: true,
            message: "Password reset link sent to your email.",
        });
    } catch (error) {
        return handleServerError(res, error);
    }
};

export const resetPassword = async (req, res) => {
    const { token, newPassword } = req.body;

    try {
        if (!token || !newPassword) {
            return res.status(400).json({ success: false, message: "Token and new password are required" });
        }

        let decoded;
        try {
            decoded = jwt.verify(token, config.JWT_SECRET);
        } catch (err) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset token" });
        }

        const user = await userModel.findById(decoded.id).select("+password");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        user.password = newPassword;
        await user.save();

        return res.status(200).json({
            success: true,
            message: "Password reset successfully. You can now log in with your new password.",
        });
    } catch (error) {
        return handleServerError(res, error);
    }
};

export const getAllUsers = async (req, res) => {
    try {
        const users = await userModel.find({ role: { $ne: "admin" } }).select("-password").sort({ createdAt: -1 });
        return res.status(200).json({ success: true, users });
    } catch (error) {
        return handleServerError(res, error);
    }
};

export const getUserById = async (req, res) => {
    try {
        const { id } = req.params;
        const user = await userModel.findById(id).select("-password").lean();
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        const wishlist = await wishlistModel.findOne({ user: id }).populate({
            path: "products",
            select: "title slug maxPrice sellingPrice images stockStatus category brand",
        }).lean();

        const cart = await cartModel.findOne({ user: id }).populate({
            path: "items.product",
            select: "title slug maxPrice sellingPrice images stockStatus",
        }).lean();

        const orders = await orderModel.find({ user: id }).populate({
            path: "orderItems.product",
            select: "title slug maxPrice sellingPrice images",
        }).sort({ createdAt: -1 }).lean();

        let products = [];
        if (user.role === "seller") {
            products = await productModel.find({ seller: id }).select("title slug maxPrice sellingPrice images status category brand").lean();
        }

        return res.status(200).json({
            success: true,
            user: {
                ...user,
                wishlist: wishlist || { products: [] },
                cart: cart || { items: [] },
                orders: orders || [],
                products: products || [],
            },
        });
    } catch (error) {
        return handleServerError(res, error);
    }
};

export const getSellerCustomers = async (req, res) => {
    try {
        const sellerId = req.user._id;

        // 1. Get permanent customers from sellerCustomer model
        const relations = await sellerCustomerModel.find({ seller: sellerId }).populate("customer", "-password").lean();
        const permanentCustomers = relations.map((r) => r.customer).filter(Boolean);

        // 2. Also find current buyers from active orders
        const orders = await orderModel.find({ "orderItems.seller": sellerId }).populate("user", "-password").lean();
        const orderCustomers = orders.map((o) => o.user).filter(Boolean);

        // Combine unique customers by ID (excluding seller self & admins)
        const customerMap = new Map();
        [...permanentCustomers, ...orderCustomers].forEach((c) => {
            if (c && c._id && c._id.toString() !== sellerId.toString() && c.role !== "admin") {
                customerMap.set(c._id.toString(), c);
            }
        });

        const customers = Array.from(customerMap.values());
        return res.status(200).json({ success: true, customers });
    } catch (error) {
        return handleServerError(res, error);
    }
};