import type { Request, Response } from "express";
import bcrypt from "bcryptjs";
import { getUserByName } from "../Utils/Database.js";

export async function userLoginHandler(req: Request, res: Response) {
    const { username, password } = req.body;
    const user = await getUserByName(username);
    if (!user || !(await bcrypt.compare(password, user.passwordhash))) {
        return res.status(401).json({ error: "Invalid username or password" });
    }

    return req.session.regenerate((error) => {
        if (error) return res.status(500).json({ error: "Could not start session" });
        req.session.isLoggedIn = true;
        req.session.username = user.username;
        req.session.admin = Boolean(user.isadmin);
        return req.session.save((saveError) => {
            if (saveError) return res.status(500).json({ error: "Could not save session" });
            return res.status(200).json({ message: "Login successful", userName: user.username });
        });
    });
}

export async function userLogoutHandler(req: Request, res: Response) {
    return req.session.destroy((error) => {
        if (error) return res.status(500).json({ error: "Could not end session" });
        const secureCookie = process.env.COOKIE_SECURE === "true" || (process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production");
        res.clearCookie("cipherdrop.sid", { httpOnly: true, sameSite: "lax", secure: secureCookie });
        return res.status(200).json({ message: "Logout successful" });
    });
}
