import {Pool} from 'pg';
import {Logger} from './Logger.js';
import redisClient from "./Redis.js";

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

pool.connect()
    .then( () =>
        Logger.log(Logger.logLevels.INFO, Logger.contexts.DB, 'Database connection pool created')
    )
    .catch(err =>
        Logger.log(Logger.logLevels.ERROR, Logger.contexts.DB, `Database connection error: ${err.message}`)
    );



export async function getUserByName(userName: string) {
    const cacheKey = `user:${userName}`;

    try {
        const redisUser = await redisClient.get(cacheKey);

        if (redisUser) {
            Logger.log(Logger.logLevels.DEBUG, Logger.contexts.REDIS, `Cache Hit: ${userName}`);
            return JSON.parse(redisUser);
        }

        const result = await pool.query('SELECT * FROM users WHERE username = $1', [userName]);
        const user = result.rows[0];

        if (user) {
            await redisClient.set(cacheKey, JSON.stringify(user), {
                EX: 3600 //  1 hour expiration
            });
            Logger.log(Logger.logLevels.DEBUG, Logger.contexts.DB, `Cache Miss: ${userName} saved to Redis`);
        }
        return user;
    } catch (error) {
        Logger.log(Logger.logLevels.ERROR, Logger.contexts.REDIS, `Redis Error: ${error}`);
        const result = await pool.query('SELECT * FROM users WHERE username = $1', [userName]);
        return result.rows[0];
    }
}