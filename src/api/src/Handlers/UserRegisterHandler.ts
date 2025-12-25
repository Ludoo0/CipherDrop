import type {Request, Response} from "express";
import validator from "validator";
import {getUserByName, pool} from "../Utils/Database.js";
import redisClient from "../Utils/Redis.js";
import bcrypt from "bcryptjs";

export async function userRegisterHandler(req: Request, res: Response){
    const { email, username, password } = req.body;
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email' });
    }
    if (!email || !username || !password) {
        return res.status(400).json({ error: 'Email, username, and password are required' });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    try {
        const existingUser = await getUserByName(username);
        if (existingUser) {
            return res.status(409).json({ error: 'Username already exists' });
        }
        const newUser = {
            username: username,
            email: email,
            passwordHash: passwordHash,
            createdAt: new Date()
        };
        const existingEmailResult = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        if (existingEmailResult.rows.length > 0) {
            return res.status(409).json({ error: 'Email already in use' });
        }
        await pool.query(
            'INSERT INTO users (username, email, passwordHash, created_at) VALUES ($1, $2, $3, $4)',
            [newUser.username, newUser.email, newUser.passwordHash, newUser.createdAt]
        );
        await redisClient.set("user:" + username, JSON.stringify(newUser), {
            EX: 3600 // 1 hour expiration
        });
        res.status(201).json({ message: 'User registered successfully', userName: username });
        // Automatically log in the user after registration
        req.session.isLoggedIn = true;
        req.session.username = username;
        return req.session.save((err) => {
            if (err) return res.status(500).send("Fehler beim Speichern");
        });

    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
