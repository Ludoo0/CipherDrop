import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { pool } from "../Utils/Database.js";

export async function userRegisterHandler(req: Request, res: Response) {
    const { email, username, password } = req.body;
    const normalizedEmail = email.trim().toLowerCase();
    const passwordHash = await bcrypt.hash(password, 12);

    try {
        await pool.query(
            "INSERT INTO users (username, email, passwordhash, created_at) VALUES ($1, $2, $3, NOW())",
            [username, normalizedEmail, passwordHash],
        );
    } catch (error) {
        if (typeof error === "object" && error !== null && "code" in error && error.code === "23505") {
            return res.status(409).json({ error: "Username or email already in use" });
        }
        throw error;
    }

    return req.session.regenerate((error) => {
        if (error) return res.status(500).json({ error: "Account created, but session could not be started" });
        req.session.isLoggedIn = true;
        req.session.username = username;
        req.session.admin = false;
        return req.session.save((saveError) => {
            if (saveError) return res.status(500).json({ error: "Account created, but session could not be saved" });
            return res.status(201).json({ message: "User registered successfully", userName: username });
        });
    });
}
