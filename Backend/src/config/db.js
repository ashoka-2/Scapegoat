import mongoose from 'mongoose';
import { config } from './config.js';

const connectMongoDB = async () => {
    try{
        await mongoose.connect(config.MONGO_URI,{
            maxPoolSize:100,
            minPoolSize:10,
            serverSelectionTimeoutMS:5000,
            socketTimeoutMS:45000,
        });
        console.log("Connected to MongoDB");
        
    }
    catch(error){
        console.log("Error Connecting to Database :",error);
        throw error;
        
    }
};

export default connectMongoDB;