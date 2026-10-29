import { pool } from "@/Utils/Database";
import redisClient from "@/Utils/Redis";

export async function removeUserAndSecrets(username: string) {
  const user = await pool.query("SELECT 1 FROM users WHERE username = $1", [
    username,
  ]);
  if ((user.rowCount ?? 0) === 0) return 0;

  const [secretIds, sessionIds] = await Promise.all([
    redisClient.sMembers(`usersecrets:${username}`),
    redisClient.sMembers(`sessions:user:${username}`),
  ]);

  await redisClient.del([
    `user:${username}`,
    `usersecrets:${username}`,
    `sessions:user:${username}`,
    ...secretIds.map((id) => `secrets:${id}`),
    ...sessionIds.map((id) => `session:${id}`),
  ]);

  const result = await pool.query("DELETE FROM users WHERE username = $1", [
    username,
  ]);
  return result.rowCount ?? 0;
}
