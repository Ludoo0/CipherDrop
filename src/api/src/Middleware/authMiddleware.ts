import type {NextFunction, Request, Response} from "express";

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
    if (req.session.isLoggedIn) {
        return next();
    } else {
        return res.status(401).json({ error: 'Unauthorized' });
    }
}