// Imports
import redis from 'redis';

// Redis Client Setup
const redisClient = redis.createClient({
    url: process.env.REDIS_URL || 'redis://cipherdrop-redis:6379'
});
redisClient.on('error', (err) => {
    console.log('Redis Client Error', err);
})
redisClient.connect().catch(console.error);

export default redisClient;
