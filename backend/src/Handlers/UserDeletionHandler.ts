import type { Request, Response } from "express";
import { env } from "@/Utils/env";
import { removeUserAndSecrets } from "@/Utils/Users";

export async function userDeletionHandler(req: Request, res: Response) {
  const username = req.session.username;
  if (!username) {
    return res.status(400).json({ error: "No user logged in" });
  }

  try {
    if ((await removeUserAndSecrets(username)) === 0)
      return res.status(404).json({ error: "User not found" });

    req.session.destroy((err) => {
      if (err) return res.status(500).json({ error: "Could not end session" });
      res.clearCookie("cipherdrop.sid", {
        httpOnly: true,
        sameSite: "lax",
        secure: env.COOKIE_SECURE,
      });
      return res.status(200).json({ message: "User deleted successfully" });
    });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}
