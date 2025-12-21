import {getUserByName, pool} from "../Utils/Database.js";
import type {Request, Response} from "express";
import redisClient from "../Utils/Redis.js";

export async function userDeletionHandler(req: Request, res: Response){
    const username = req.session.username;
    if (!username) {
        return res.status(400).json({ error: 'No user logged in' });
    }

    try {
        const user = await getUserByName(username);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        await pool.query(
            'DELETE FROM users WHERE username = $1',
            [username]
        );

        await redisClient.del("user:" + username);

        req.session.destroy((err) => {
            if (err) {
                console.error('Error destroying session during user deletion:', err);
            }
            return res.status(200).json({ message: 'User deleted successfully' });
        });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}