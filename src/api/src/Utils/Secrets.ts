import type { PoolClient } from "pg";
import type { SecretData } from "@/types/types";
import { getPersistentSecret, pool } from "@/Utils/Database";
import redisClient from "@/Utils/Redis";

const consumeCachedSecretScript = `
local raw = redis.call('GET', KEYS[1])
if not raw then return 'MISSING' end
local data = cjson.decode(raw)
if redis.call('TTL', KEYS[1]) == -1 and data.owner then return 'MISSING' end
if data.controlmessage ~= ARGV[1] then return 'INVALID' end
data.opens = (data.opens or 0) + 1
if data.opens >= data.burnsAfterXOpens then
  redis.call('DEL', KEYS[1])
  if data.owner then redis.call('SREM', 'usersecrets:' .. data.owner, data.id) end
else
  local ttl = redis.call('TTL', KEYS[1])
  if ttl > 0 then
    redis.call('SET', KEYS[1], cjson.encode(data), 'EX', ttl)
  else
    redis.call('SET', KEYS[1], cjson.encode(data))
  end
end
return cjson.encode(data)
`;

export type SecretAccess =
  | { status: "missing" }
  | { status: "invalid" }
  | { status: "ok"; secret: SecretData };

function parseStoredSecret(value: unknown): SecretData | undefined {
  if (!value) return undefined;
  const data = typeof value === "string" ? JSON.parse(value) : value;
  if (!data || typeof data !== "object") return undefined;
  return data as SecretData;
}

async function accessPersistentSecret(
  id: string,
  controlmessage: string,
): Promise<SecretAccess | undefined> {
  const client: PoolClient = await pool.connect();
  try {
    await client.query("BEGIN");
    const row = await client.query(
      "SELECT secret_data FROM secrets WHERE id = $1 FOR UPDATE",
      [id],
    );
    const secret = parseStoredSecret(row.rows[0]?.secret_data);
    if (!secret) {
      await client.query("ROLLBACK");
      return undefined;
    }
    if (secret.controlmessage !== controlmessage) {
      await client.query("ROLLBACK");
      return { status: "invalid" };
    }

    secret.opens += 1;
    if (secret.opens >= secret.burnsAfterXOpens) {
      await client.query("DELETE FROM secrets WHERE id = $1", [id]);
    } else {
      await client.query("UPDATE secrets SET secret_data = $2 WHERE id = $1", [
        id,
        JSON.stringify(secret),
      ]);
    }
    await client.query("COMMIT");
    if (secret.opens >= secret.burnsAfterXOpens) {
      await redisClient
        .del([`secrets:${id}`, `secret:${id}`])
        .catch(() => undefined);
    }
    return { status: "ok", secret };
  } catch (error) {
    await client.query("ROLLBACK").catch(() => undefined);
    throw error;
  } finally {
    client.release();
  }
}

export async function accessSecret(
  id: string,
  controlmessage: string,
): Promise<SecretAccess> {
  let ttl = -2;
  try {
    ttl = await redisClient.ttl(`secrets:${id}`);
  } catch {
    const persistentResult = await accessPersistentSecret(id, controlmessage);
    if (persistentResult) return persistentResult;
    throw new Error("Secret storage is temporarily unavailable");
  }

  if (ttl <= 0) {
    const persistentResult = await accessPersistentSecret(id, controlmessage);
    if (persistentResult) return persistentResult;
  }

  const result = await redisClient.eval(consumeCachedSecretScript, {
    keys: [`secrets:${id}`],
    arguments: [controlmessage],
  });
  if (result === "MISSING") return { status: "missing" };
  if (result === "INVALID") return { status: "invalid" };
  const secret = parseStoredSecret(result);
  return secret ? { status: "ok", secret } : { status: "missing" };
}

export async function getSecret(id: string) {
  let cachedSecret: SecretData | undefined;
  let ttl = -2;
  try {
    const value = await redisClient.get(`secrets:${id}`);
    cachedSecret = parseStoredSecret(value);
    if (value) ttl = await redisClient.ttl(`secrets:${id}`);
  } catch {
    // Permanent secrets remain readable from Postgres when Redis is unavailable.
  }

  if (ttl > 0 && cachedSecret) return cachedSecret;
  // Persistent data is authoritative; stale legacy Redis keys cannot revive a burned secret.
  const persistentSecret = await getPersistentSecret(id);
  if (persistentSecret) return persistentSecret;
  if (ttl === -1 && cachedSecret?.owner) return undefined;
  return cachedSecret;
}

export async function inspectSecret(id: string) {
  const secret = await getSecret(id);
  if (!secret) return { exists: false as const };
  const salt = secret.message.match(/^cd2:([^:]+):/)?.[1];
  return {
    exists: true as const,
    version: salt ? 2 : 1,
    ...(salt ? { salt } : {}),
  };
}
