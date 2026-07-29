import { Server } from "socket.io";
import { Server as httpServer } from "http";
import { config } from "../config/config.js";

let io;

export const setupSocket = (httpServer) =>{
    io = new Server(httpServer,{
        cors:{
            origin:config.FRONTEND_URL,
            methods:["GET", "POST", "PUT", "DELETE", "PATCH"],
            credentials: true
        }
    });
    io.on("connection",(socket)=>{
        console.log(`Socket client connected: ${socket.id}`);

        socket.on("disconnect",()=>{
            console.log(`Socket client disconnected: ${socket.id}`);
            
        });
        
    });

    return io;
}