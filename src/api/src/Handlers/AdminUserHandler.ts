import type { Request, Response } from 'express';
import { getAllUsers } from '../Utils/Database.js';
import {Logger} from '../Utils/Logger.js';
import {pool} from "../Utils/Database.js";
import redisClient from "../Utils/Redis.js";


export async function allUsersHandler(req: Request, res: Response) {
    const users = await getAllUsers();

    Logger.log(Logger.logLevels.INFO, Logger.contexts.GENERAL, `Admin user '${req.session.username}' fetched all users.`);
    res.status(200).json({ users });
}

export async function deleteUserHandler(req: Request, res: Response) {
    const usernameToDelete = req.params.username;

    try {
        const result = await pool.query(
            'DELETE FROM users WHERE username = $1 RETURNING *',
            [usernameToDelete]
        );

        await redisClient.del("user:" + usernameToDelete);
        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        Logger.log(Logger.logLevels.INFO, Logger.contexts.GENERAL, `Admin user '${req.session.username}' deleted user '${usernameToDelete}'.`);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (error) {
        console.error('Error deleting user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}