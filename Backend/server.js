import app from "./src/app.js";
import dotenv from "dotenv";
import {createServer} from "http";
import connectDB from "./src/config/db.js";

import { setupSocket } from "./src/services/socket.service.js";
import { startProductScheduler } from "./src/services/productScheduler.service.js";
import { ensurePineconeIndexes } from "./src/services/pinecone.service.js";
import { ensureVectorSearchIndexes } from "./src/services/mongoVectorSearch.service.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

const startServer = async () =>{
    try{
        await connectDB();

        const httpServer = createServer(app);
        setupSocket(httpServer);

        httpServer.listen(PORT,()=>{
            console.log(`Server listening on port ${PORT} (Socket.io enabled)`);
            // Auto-publish scheduled products when their time arrives
            startProductScheduler();
            // Ensure the Pinecone indexes exist (no-op without PINECONE_API_KEY)
            ensurePineconeIndexes();
            // Best-effort Atlas Vector Search fallback indexes (logs definitions
            // if the connection lacks Atlas admin privileges)
            ensureVectorSearchIndexes();
        })
    }
    catch(error){
        console.log("Failed to start server :",error.message);
        process.exit(1);
        
    }
};

startServer();