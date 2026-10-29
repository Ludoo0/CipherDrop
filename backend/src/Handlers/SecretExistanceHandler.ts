import type { Request, Response } from "express";
import { inspectSecret } from "@/Utils/Secrets";

export async function SecretExistanceHandler(req: Request, res: Response) {
  const id = req.params.id;
  if (typeof id !== "string" || !/^[a-zA-Z0-9-]{1,36}$/.test(id))
    return res.status(400).json({ error: "Invalid secret ID" });
  return res.status(200).json(await inspectSecret(id));
}
