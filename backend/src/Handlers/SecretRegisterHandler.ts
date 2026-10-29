import { randomUUID } from "node:crypto";
import type { Request, Response } from "express";
import qrcode from "qrcode";
import type { SecretData } from "@/types/types";
import { pool } from "@/Utils/Database";
import { env } from "@/Utils/env";
import { Logger } from "@/Utils/Logger";
import redisClient from "@/Utils/Redis";

export async function SecretRegisterHandler(req: Request, res: Response) {
  const body = req.body;
  const id = randomUUID();
  const persistent = Boolean(req.session.username && body.ttl === undefined);
  const expiration = persistent ? null : (body.ttl ?? 3600);
  const secret: SecretData = {
    id,
    message: body.message,
    controlmessage: body.controlmessage,
    burnsAfterXOpens: body.burnsAfterXOpens ?? 1,
    opens: 0,
    owner: req.session.username ?? null,
    file: body.file ?? null,
  };

  if (persistent) {
    await pool.query(
      "INSERT INTO secrets (id, owner, secret_data, created_at) VALUES ($1, $2, $3, NOW())",
      [id, secret.owner, JSON.stringify(secret)],
    );
  } else {
    const commands = redisClient
      .multi()
      .set(`secrets:${id}`, JSON.stringify(secret), { EX: body.ttl ?? 3600 });
    if (secret.owner) commands.sAdd(`usersecrets:${secret.owner}`, id);
    await commands.exec();
  }

  const baseUrl = env.BASE_URL.replace(/\/$/, "");
  const qrCodeDataURL = await qrcode.toDataURL(
    `${baseUrl}/read?messageId=${id}`,
  );
  Logger.log(
    Logger.logLevels.INFO,
    Logger.contexts.ROUTES,
    `Registered a secret (${persistent ? "persistent" : `${expiration}s TTL`})`,
  );
  return res.status(200).json({ id, expiration, qrCodeDataURL });
}
