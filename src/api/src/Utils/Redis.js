// Imports
import redis from 'redis';
import {Logger} from "./Logger.js";

// Redis Client Setup
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://cipherdrop-redis:6379'
});
redisClient.on('error', (err) => {
    Logger.log(Logger.logLevels.ERROR, Logger.contexts.REDIS, `Redis Client Error: ${err.message}`);
})
redisClient.connect()
    .then(() => {
        Logger.log(Logger.logLevels.INFO, Logger.contexts.REDIS, 'Connected to Redis server');
    })
    .catch(console.error);

export default redisClient;
