import type {Request, Response} from "express";
import validator from "validator";
import {getUserByUsername, pool} from "../Utils/Database.js";
import redisClient from "../Utils/Redis.js";

export async function UserRegisterHandler(req: Request, res: Response){
    const { email, username, passwordHash } = req.body;
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email' });
    }
    if (!email || !username || !passwordHash) {
        return res.status(400).json({ error: 'Email, username, and passwordHash are required' });
    }

    try {
        const existingUser = await getUserByUsername(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        const newUserId = Math.random().toString(36).substr(2, 9);
        const newUser = {
            id: newUserId,
            email: email,
            username: username,
            passwordHash: passwordHash,
            createdAt: new Date()
        };
        await pool.query(
            'INSERT INTO users (id, email, username, password_hash, created_at) VALUES ($1, $2, $3, $4, $5)',
            [newUser.id, newUser.email, newUser.username, newUser.passwordHash, newUser.createdAt]
        );
        await redisClient.set("user:" + newUserId, JSON.stringify(newUser), {
            EX: 3600 // 1 hour expiration
        });
        res.status(201).json({ message: 'User registered successfully', userId: newUserId });
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
