import {Redis} from "ioredis";

import { config } from "./config.js";

const redisClient = new Redis({
    host:config.REDIS_HOST,
    port:config.REDIS_PORT,
    password:config.REDIS_PASSWORD
});

redisClient.on("connect",()=>{
    console.log("Connected to Redis");
    
});

redisClient.on("error",(error)=>{
    console.log("Redis Error - ",error);    
});

export default redisClient;