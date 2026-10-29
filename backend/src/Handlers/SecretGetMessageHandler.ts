import type { Request, Response } from "express";
import { Logger } from "@/Utils/Logger";
import { accessSecret } from "@/Utils/Secrets";

export async function SecretGetMessageHandler(req: Request, res: Response) {
  const id = req.params.id;
  if (typeof id !== "string" || !/^[a-zA-Z0-9-]{1,36}$/.test(id))
    return res.status(400).json({ error: "Invalid secret ID" });
  const controlmessage =
    req.method === "POST" ? req.body?.controlmessage : req.query.controlmessage;
  if (
    typeof controlmessage !== "string" ||
    controlmessage.length === 0 ||
    controlmessage.length > 256
  ) {
    return res.status(400).json({ error: "controlmessage is required" });
  }

  const result = await accessSecret(id, controlmessage);
  if (result.status === "missing") {
    return res.status(404).json({ error: "Secret not found or has expired" });
  }
  if (result.status === "invalid") {
    Logger.log(
      Logger.logLevels.WARN,
      Logger.contexts.ROUTES,
      "Rejected a secret access with an invalid control value",
    );
    return res.status(403).json({ error: "Invalid controlmessage" });
  }

  const { secret } = result;
  return res.status(200).json({
    message: secret.message,
    opens: secret.opens,
    burnsAfterXOpens: secret.burnsAfterXOpens,
    file: secret.file,
    ...(req.method === "GET" ? { controlmessage: secret.controlmessage } : {}),
  });
}
