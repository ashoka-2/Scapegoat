import {Router} from "express";
import { validateLoginUser, validateRegisterUser } from "../validators/auth.validator.js";

import {getMe, login, logout, register} from "../controllers/auth.controller.js"
import {verifyToken} from "../middlewares/auth.middleware.js"

const authRouter = Router();


authRouter.post("/register",validateRegisterUser,register)

authRouter.post("/login",validateLoginUser,login);

authRouter.get("/getMe",verifyToken,getMe)

authRouter.post("/logout",logout)

export default authRouter;