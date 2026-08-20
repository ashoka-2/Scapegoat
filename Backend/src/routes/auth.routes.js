import {Router} from "express";
import { validateLoginUser, validateRegisterUser, validateCompleteProfile } from "../validators/auth.validator.js";
import passport from "passport";
import {getMe, googleCallback, login, logout, register, verifyEmail, resendVerificationEmail, completeProfile, updateProfile, changePassword, forgotPassword, resetPassword, getAllUsers, getUserById, getSellerCustomers, becomeSeller} from "../controllers/auth.controller.js"
import {verifyToken, requireRole} from "../middlewares/auth.middleware.js"
import { registerLimiter, authLimiter } from "../middlewares/rateLimiter.middleware.js";
import { config } from "../config/config.js";

const router = Router();

router.get("/users", verifyToken, requireRole("seller", "admin"), getAllUsers);
router.get("/users/:id", verifyToken, requireRole("seller", "admin"), getUserById);
router.get("/customers", verifyToken, requireRole("seller", "admin"), getSellerCustomers);
router.put("/become-seller", verifyToken, becomeSeller);

/**
 * @route POST /api/auth/register
 * @description Register the user
 * @access Public
 */
router.post("/register", registerLimiter, validateRegisterUser, register)

/**
 * @route POST /api/auth/login
 * @description Login the user
 * @access Private
 */
router.post("/login", authLimiter, validateLoginUser, login);

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
 * @route PUT /api/auth/update-profile
 * @description Update user profile details & address
 * @access Private
 */
router.put("/update-profile", verifyToken, updateProfile);

/**
 * @route PUT /api/auth/change-password
 * @description Change user password
 * @access Private
 */
router.put("/change-password", verifyToken, changePassword);

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
        failureRedirect: `${config.FRONTEND_URL}/login`,
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
router.post("/resend-verification", authLimiter, resendVerificationEmail);

/**
 * @route POST /api/auth/complete-profile
 * @description Complete Google user profile
 * @access Private
 */
router.post("/complete-profile", verifyToken, validateCompleteProfile, completeProfile);

router.post("/forgot-password", authLimiter, forgotPassword);
router.post("/reset-password", authLimiter, resetPassword);

export default router;