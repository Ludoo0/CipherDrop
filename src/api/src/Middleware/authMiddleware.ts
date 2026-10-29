import type { NextFunction, Request, Response } from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.isLoggedIn && req.session.username) return next();
    return res.status(401).json({ error: "Unauthorized" });
}

export function adminMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.isLoggedIn && req.session.admin) return next();
    return res.status(403).json({ error: "Forbidden" });
}
