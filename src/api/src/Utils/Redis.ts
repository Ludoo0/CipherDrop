import { createClient } from "redis";
import { env } from "@/Utils/env";
import { Logger } from "@/Utils/Logger";

const redisClient = createClient({
  url: env.REDIS_URL || "redis://redis:6379",
});

redisClient.on("error", (error) => {
  Logger.log(Logger.logLevels.ERROR, Logger.contexts.REDIS, error.message);
});

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
    Logger.log(
      Logger.logLevels.INFO,
      Logger.contexts.REDIS,
      "Connected to Redis",
    );
  }
}

export default redisClient;
