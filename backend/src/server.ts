import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import rateLimit from "express-rate-limit";
import session from "express-session";
import helmet from "helmet";
import AdminRouter from "@/Routes/AdminRouter";
import SecretsRouter from "@/Routes/SecretsRouter";
import UsersRouter from "@/Routes/UsersRouter";
import { pool, setup } from "@/Utils/Database";
import { env } from "@/Utils/env";
import { Logger } from "@/Utils/Logger";
import redisClient, { connectRedis } from "@/Utils/Redis";
import { RedisSessionStore } from "@/Utils/RedisSessionStore";

await setup();
await connectRedis();

const app = express();
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use((_req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: false }));
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.use(
  session({
    name: "cipherdrop.sid",
    store: new RedisSessionStore(),
    secret: env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: env.COOKIE_SECURE,
      httpOnly: true,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: "draft-8",
  legacyHeaders: false,
});
app.use("/users/login", authLimiter);
app.use("/users/register", authLimiter);
app.use(
  "/secrets",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 60,
    standardHeaders: "draft-8",
    legacyHeaders: false,
  }),
);

app.use("/secrets", SecretsRouter);
app.use("/users", UsersRouter);
app.use("/admin", AdminRouter);
app.get("/health", (_req, res) => res.status(200).json({ status: "OK" }));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  void _next;
  Logger.log(
    Logger.logLevels.ERROR,
    Logger.contexts.GENERAL,
    error instanceof Error ? error.message : "Unexpected request error",
  );
  if (res.headersSent) return;
  if (typeof error === "object" && error !== null && "type" in error) {
    if (error.type === "entity.too.large")
      return res.status(413).json({ error: "Request body is too large" });
    if (error.type === "entity.parse.failed")
      return res.status(400).json({ error: "Invalid JSON request body" });
  }
  return res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(env.PORT, () => {
  Logger.log(
    Logger.logLevels.INFO,
    Logger.contexts.GENERAL,
    `Server started on port ${env.PORT}`,
  );
});

async function shutdown(signal: string) {
  Logger.log(
    Logger.logLevels.INFO,
    Logger.contexts.GENERAL,
    `Received ${signal}; closing connections`,
  );
  server.close(async () => {
    await Promise.allSettled([redisClient.quit(), pool.end()]);
    process.exit(0);
  });
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
