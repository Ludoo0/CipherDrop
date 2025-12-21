import type {Request, Response} from "express";
import validator from "validator";

export async function UserRegisterHandler(req: Request, res: Response){
    const { email, username, passwordHash } = req.body;
    if (!validator.isEmail(email)) {
        return res.status(400).json({ error: 'Invalid email' });
    }


    try {
        // User logic here
    } catch (error) {
        console.error('Error registering user:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
}
