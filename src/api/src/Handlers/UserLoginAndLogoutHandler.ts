import {getUserByName} from "../Utils/Database.js";
import type {Request, Response} from "express";

export async function userLoginHandler(req: Request, res: Response) {
    const { username, passwordHash } = req.body;

    try {
        const user = await getUserByName(username);
        if (!user || user.password_hash !== passwordHash) {
            return res.status(401).json({error: 'Invalid username or password'});
        }

        req.session.isLoggedIn = true;
        req.session.username = username;
        return req.session.save((err) => {
            if (err) return res.status(500).send("Fehler beim Speichern");
            res.status(200).json({message: 'Login successful', userName: username});
        });
    } catch (error) {
        console.error('Error during user login:', error);
        return res.status(500).json({error: 'Internal server error'});
    }
}

export async function userLogoutHandler(req: Request, res: Response) {
    req.session.destroy((err) => {
        if (err) {
            console.error('Error during user logout:', err);
            return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json({ message: 'Logout successful' });
    });
}
