import session, { type SessionData } from "express-session";
import redisClient from "@/Utils/Redis";
import { Logger } from "@/Utils/Logger";

export class RedisSessionStore extends session.Store {
	async get(
		sid: string,
		callback: (error: unknown, value?: SessionData | null) => void,
	) {
		try {
			const value = await redisClient.get(`session:${sid}`);
			callback(null, value ? (JSON.parse(value) as SessionData) : null);
		} catch (error) {
			callback(error as Error);
		}
	}

	async set(
		sid: string,
		value: SessionData,
		callback?: (error?: Error | null) => void,
	) {
		try {
			const ttl = Math.max(
				1,
				Math.ceil((value.cookie.maxAge ?? 86_400_000) / 1000),
			);
			const transaction = redisClient
				.multi()
				.set(`session:${sid}`, JSON.stringify(value), { EX: ttl });
			if (value.username) {
				transaction
					.sAdd(`sessions:user:${value.username}`, sid)
					.expire(`sessions:user:${value.username}`, ttl);
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
			const username = value
				? (JSON.parse(value) as SessionData).username
				: undefined;
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
			const ttl = Math.max(
				1,
				Math.ceil((value.cookie.maxAge ?? 86_400_000) / 1000),
			);
			const transaction = redisClient.multi().expire(`session:${sid}`, ttl);
			if (value.username)
				transaction.expire(`sessions:user:${value.username}`, ttl);
			await transaction.exec();
			callback?.();
		} catch (error) {
			Logger.log(
				Logger.logLevels.ERROR,
				Logger.contexts.REDIS,
				`Could not refresh session expiry: ${String(error)}`,
			);
			callback?.();
		}
	}
}