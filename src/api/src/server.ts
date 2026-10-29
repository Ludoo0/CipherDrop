import "dotenv/config";

import express, { type NextFunction, type Request, type Response } from "express";
import rateLimit from "express-rate-limit";
import helmet from "helmet";
import session, { type SessionData } from "express-session";
import { Logger } from "./Utils/Logger.js";
import { setup, pool } from "./Utils/Database.js";
import redisClient, { connectRedis } from "./Utils/Redis.js";

const sessionSecret = process.env.SESSION_SECRET;
const secureCookie = process.env.COOKIE_SECURE === "true" || (
    process.env.COOKIE_SECURE !== "false" && process.env.NODE_ENV === "production"
);
if (!sessionSecret || sessionSecret.length < 32) {
    throw new Error("SESSION_SECRET must be configured with at least 32 characters");
}

await setup();
await connectRedis();

class RedisSessionStore extends session.Store {
    async get(sid: string, callback: (error: unknown, value?: SessionData | null) => void) {
        try {
            const value = await redisClient.get(`session:${sid}`);
            callback(null, value ? JSON.parse(value) as SessionData : null);
        } catch (error) {
            callback(error as Error);
        }
    }

    async set(sid: string, value: SessionData, callback?: (error?: Error | null) => void) {
        try {
            const ttl = Math.max(1, Math.ceil((value.cookie.maxAge ?? 86_400_000) / 1000));
            const transaction = redisClient.multi().set(`session:${sid}`, JSON.stringify(value), { EX: ttl });
            if (value.username) {
                transaction.sAdd(`sessions:user:${value.username}`, sid).expire(`sessions:user:${value.username}`, ttl);
            }
            await transaction.exec();
            callback?.(null);
        } catch (error) {
            callback?.(error as Error);
        }
    }

    async destroy(sid: string, callback?: (error?: Error | null) => void) {
        try {
            const value = await redisClient.get(`session:${sid}`);
            const username = value ? (JSON.parse(value) as SessionData).username : undefined;
            const transaction = redisClient.multi().del(`session:${sid}`);
            if (username) transaction.sRem(`sessions:user:${username}`, sid);
            await transaction.exec();
            callback?.(null);
        } catch (error) {
            callback?.(error as Error);
        }
    }

    async touch(sid: string, value: SessionData, callback?: () => void) {
        try {
            const ttl = Math.max(1, Math.ceil((value.cookie.maxAge ?? 86_400_000) / 1000));
            const transaction = redisClient.multi().expire(`session:${sid}`, ttl);
            if (value.username) transaction.expire(`sessions:user:${value.username}`, ttl);
            await transaction.exec();
            callback?.();
        } catch (error) {
            Logger.log(Logger.logLevels.ERROR, Logger.contexts.REDIS, `Could not refresh session expiry: ${String(error)}`);
            callback?.();
        }
    }
}

const app = express();
const port = Number(process.env.PORT) || 8000;
app.disable("x-powered-by");
app.set("trust proxy", 1);
app.use(helmet());
app.use((_req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    next();
});
app.use(express.json({ limit: "25mb" }));
app.use(express.urlencoded({ limit: "25mb", extended: false }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, limit: 300, standardHeaders: "draft-8", legacyHeaders: false }));

app.use(session({
    name: "cipherdrop.sid",
    store: new RedisSessionStore(),
    secret: sessionSecret,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: secureCookie,
        httpOnly: true,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000,
    },
}));

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 10, standardHeaders: "draft-8", legacyHeaders: false });
app.use("/users/login", authLimiter);
app.use("/users/register", authLimiter);
app.use("/secrets", rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: "draft-8", legacyHeaders: false }));

app.use("/secrets", (await import("./Routes/SecretsRouter.js")).default);
app.use("/users", (await import("./Routes/UsersRouter.js")).default);
app.use("/admin", (await import("./Routes/AdminRouter.js")).default);
app.get("/health", (_req, res) => res.status(200).json({ status: "OK" }));

app.use((error: unknown, _req: Request, res: Response, _next: NextFunction) => {
    void _next;
    Logger.log(Logger.logLevels.ERROR, Logger.contexts.GENERAL, error instanceof Error ? error.message : "Unexpected request error");
    if (res.headersSent) return;
    if (typeof error === "object" && error !== null && "type" in error) {
        if (error.type === "entity.too.large") return res.status(413).json({ error: "Request body is too large" });
        if (error.type === "entity.parse.failed") return res.status(400).json({ error: "Invalid JSON request body" });
    }
    return res.status(500).json({ error: "Internal server error" });
});

const server = app.listen(port, () => {
    Logger.log(Logger.logLevels.INFO, Logger.contexts.GENERAL, `Server started on port ${port}`);
});

async function shutdown(signal: string) {
    Logger.log(Logger.logLevels.INFO, Logger.contexts.GENERAL, `Received ${signal}; closing connections`);
    server.close(async () => {
        await Promise.allSettled([redisClient.quit(), pool.end()]);
        process.exit(0);
    });
}

process.once("SIGTERM", () => void shutdown("SIGTERM"));
process.once("SIGINT", () => void shutdown("SIGINT"));
