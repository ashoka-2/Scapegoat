import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import cors from "cors";

import {config} from "./config/config.js";

const app = express();

app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({extended:true}));
app.use(cookieParser());

app.use(cors({
    origin:config.FRONTEND_URL,
    methods:["GET","POST","PUT","DELETE","PATCH"],
    credentials:true,
}));



app.get("/", (_req, res) => {
    res.status(200).json({ message: "Server is running" });
});

export default app;