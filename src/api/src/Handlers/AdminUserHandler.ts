import type { Request, Response } from "express";
import { getAllUsers } from "@/Utils/Database";
import { Logger } from "@/Utils/Logger";
import { removeUserAndSecrets } from "@/Utils/Users";

export async function allUsersHandler(req: Request, res: Response) {
  const users = await getAllUsers();

  Logger.log(
    Logger.logLevels.INFO,
    Logger.contexts.GENERAL,
    `Admin user '${req.session.username}' fetched all users.`,
  );
  res.status(200).json({ users });
}

export async function deleteUserHandler(req: Request, res: Response) {
  const usernameToDelete = req.params.username;
  if (typeof usernameToDelete !== "string") {
    return res.status(400).json({ error: "Invalid username" });
  }

  try {
    if ((await removeUserAndSecrets(usernameToDelete)) === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    Logger.log(
      Logger.logLevels.INFO,
      Logger.contexts.GENERAL,
      `Admin user '${req.session.username}' deleted user '${usernameToDelete}'.`,
    );
    res.status(200).json({ message: "User deleted successfully" });
  } catch {
    res.status(500).json({ error: "Internal server error" });
  }
}
