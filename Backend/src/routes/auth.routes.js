import {Router} from "express";
import { validateLoginUser, validateRegisterUser } from "../validators/auth.validator.js";
import passport from "passport";
import {getMe, googleCallback, login, logout, register} from "../controllers/auth.controller.js"
import {verifyToken} from "../middlewares/auth.middleware.js"
import { config } from "../config/config.js";

const authRouter = Router();

/**
 * @route POST /api/auth/register
 * @description Register the user
 * @access Public
 */
authRouter.post("/register",validateRegisterUser,register)

/**
 * @route POST /api/auth/login
 * @description Login the user
 * @access Private
 */
authRouter.post("/login",validateLoginUser,login);

/**
 * @route GET /api/auth/getMe
 * @description Get the authenticated user's profile
 * @access Private
 */
authRouter.get("/getMe",verifyToken,getMe);

/**
 * @route POST /api/auth/logout
 * @description Logout the user
 * @access Private
 */
authRouter.post("/logout",verifyToken,logout);

/**
 * @route GET /api/auth/google
 * @description Redirect to Google for authentication
 * @access Public
 */
authRouter.get("/google", passport.authenticate("google", { scope: ["profile", "email"] }));

/**
 * @route GET /api/auth/google/callback
 * @description Handle Google OAuth callback
 * @access Public
 */
authRouter.get(
    "/google/callback",
    passport.authenticate("google", {
        session: false,
        failureRedirect: config.NODE_ENV == "development" ? "http://localhost:5173/login" : "/login",
    }),
    googleCallback
);



export default authRouter;