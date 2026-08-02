import mongoose from 'mongoose';
import { config } from './config.js';

const connectMongoDB = async () => {
    try{
        await mongoose.connect(config.MONGO_URI)
         .then(()=>{
            console.log("Connected to database");
            
        })
        
        
    }
    catch(error){
        console.log("Error Connecting to Database :",error);
        throw error;
        
    }
};

export default connectMongoDB;