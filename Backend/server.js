import app from "./src/app.js";
import dotenv from "dotenv";
import {createServer} from "http";
import connectDB from "./src/config/db.js";

import { setupSocket } from "./src/services/socket.service.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () =>{
    try{
        await connectDB();

        const httpServer = createServer(app);
        setupSocket(httpServer);

        httpServer.listen(PORT,()=>{
            console.log(`Server listening on port ${PORT} (Socket.io enabled)`);
            
        })
    }
    catch(error){
        console.log("Failed to start server :",error.message);
        process.exit(1);
        
    }
};

startServer();