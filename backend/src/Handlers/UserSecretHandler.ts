import type { Request, Response } from "express";
import type { SecretData } from "@/types/types";
import { getPersistentSecretsByOwner } from "@/Utils/Database";
import redisClient from "@/Utils/Redis";

function toSummary(secret: SecretData) {
  return {
    id: secret.id,
    opens: secret.opens,
    burnsAfterXOpens: secret.burnsAfterXOpens,
    hasFile: Boolean(secret.file),
  };
}

async function getOwnedSecrets(username: string) {
  const ids = await redisClient.sMembers(`usersecrets:${username}`);
  const cachedValues = ids.length
    ? await redisClient.mGet(ids.map((id) => `secrets:${id}`))
    : [];
  const cachedSecrets = cachedValues.flatMap((value) => {
    if (!value) return [];
    try {
      const secret = JSON.parse(value) as SecretData;
      return secret.owner === username ? [secret] : [];
    } catch {
      return [];
    }
  });
  const staleIds = ids.filter((_, index) => !cachedValues[index]);
  if (staleIds.length)
    await redisClient.sRem(`usersecrets:${username}`, staleIds);
  const persistentSecrets = await getPersistentSecretsByOwner(username);
  const byId = new Map(
    [...cachedSecrets, ...persistentSecrets].map((secret) => [
      secret.id,
      secret,
    ]),
  );
  return [...byId.values()];
}

export async function userSecretHandler(req: Request, res: Response) {
  const username = req.session.username;
  if (!username) return res.status(401).json({ error: "Unauthorized" });
  return res.status(200).json({ secrets: await getOwnedSecrets(username) });
}

export async function userSecretSummaryHandler(req: Request, res: Response) {
  const username = req.session.username;
  if (!username) return res.status(401).json({ error: "Unauthorized" });
  const secrets = await getOwnedSecrets(username);
  return res.status(200).json({ secrets: secrets.map(toSummary) });
}
