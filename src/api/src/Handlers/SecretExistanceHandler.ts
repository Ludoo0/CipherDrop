import redisClient from "../Utils/Redis.js";
import type { Request, Response } from "express";

export async function SecretExistanceHandler(req: Request, res: Response){
    const id = req.params.id;
    const exists = await redisClient.exists("secrets:" + id);
    res.status(200).json({ exists: exists === 1 });
}