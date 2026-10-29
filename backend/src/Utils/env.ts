import { z } from "zod";

const schema = z.object({
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z.coerce.number().default(8000),
  BASE_URL: z.url().default("http://localhost:8001"),
  SESSION_SECRET: z.string().min(1),
  DB_HOST: z.string().min(1),
  DB_PORT: z.coerce.number().default(5432),
  DB_USER: z.string().min(1).default("cipherdrop"),
  DB_PASSWORD: z.string().min(1),
  DB_NAME: z.string().min(1).default("cipherdropdb"),
  REDIS_URL: z.string().min(1).default("redis://redis:6379"),
  COOKIE_SECURE: z.stringbool().default(false),
});

export const env = schema.parse(process.env);
