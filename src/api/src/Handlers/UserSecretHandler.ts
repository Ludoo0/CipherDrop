import type {Request, Response} from "express";
import redisClient from "../Utils/Redis.js";

export async function userSecretHandler(req: Request, res: Response){
    const username = req.session.username;
    if (!username) {
        return res.status(400).json({ error: 'No user logged in' });
    }

    try {
        const secretIds = await redisClient.sMembers(`usersecrets:${username}`) as unknown as string[];
        if (!secretIds || secretIds.length === 0) {
            res.status(200).json({ secrets: [] });
            return;
        }
        const keys = secretIds.map(id => `secrets:${id}`);
        const secrets = await redisClient.mGet(keys) as unknown as (string | null)[];
        const parsedSecrets = secrets
            .filter((res): res is string => res !== null)
            .map(secret => JSON.parse(secret));
        res.status(200).json({ secrets: parsedSecrets });
    } catch (error) {
        console.error('Error retrieving user secrets:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}