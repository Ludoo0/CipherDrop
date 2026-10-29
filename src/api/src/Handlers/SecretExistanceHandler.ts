import type { Request, Response } from "express";
import { inspectSecret } from "../Utils/Secrets.js";

export async function SecretExistanceHandler(req: Request, res: Response) {
    if (!/^[a-zA-Z0-9-]{1,36}$/.test(req.params.id)) return res.status(400).json({ error: "Invalid secret ID" });
    return res.status(200).json(await inspectSecret(req.params.id));
}
