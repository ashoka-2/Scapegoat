import {Router} from "express";
import { validateLoginUser, validateRegisterUser, validateCompleteProfile } from "../validators/auth.validator.js";
import passport from "passport";
import {getMe, googleCallback, login, logout, register, verifyEmail, resendVerificationEmail, completeProfile} from "../controllers/auth.controller.js"
import {verifyToken} from "../middlewares/auth.middleware.js"
import { config } from "../config/config.js";

const router = Router();

/**
 * @route POST /api/auth/register
 * @description Register the user
 * @access Public
 */
router.post("/register",validateRegisterUser,register)

/**
 * @route POST /api/auth/login
 * @description Login the user
 * @access Private
 */
router.post("/login",validateLoginUser,login);

/**
 * @route GET /api/auth/getMe
 * @description Get the authenticated user's profile
 * @access Private
 */
router.get("/getMe",verifyToken,getMe);

/**
 * @route POST /api/auth/logout
 * @description Logout the user
 * @access Private
 */
router.post("/logout",verifyToken,logout);

/**
 * @route GET /api/auth/google
 * @description Redirect to Google for authentication
 * @access Public
 */
router.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

/**
 * @route GET /api/auth/google/callback
 * @description Handle Google OAuth callback
 * @access Public
 */
router.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: config.NODE_ENV == "development" ? "http://localhost:5173/login" : "/login",
    }),
    googleCallback
);



/**
 * @route GET /api/auth/verify-email
 * @description Verify user's email via token
 * @access Public
 */
router.get("/verify-email", verifyEmail);

/**
 * @route POST /api/auth/resend-verification
 * @description Resend verification email
 * @access Public
 */
router.post("/resend-verification", resendVerificationEmail);

/**
 * @route POST /api/auth/complete-profile
 * @description Complete Google user profile
 * @access Private
 */
router.post("/complete-profile", verifyToken, validateCompleteProfile, completeProfile);

export default router;