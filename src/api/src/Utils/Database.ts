import { Pool } from "pg";
import { Logger } from "./Logger.js";
import type { SecretData } from "../types/types.js";

const requiredDatabaseConfig = ["DB_HOST", "DB_USER", "DB_PASSWORD", "DB_NAME"] as const;
for (const key of requiredDatabaseConfig) {
    if (!process.env[key]) throw new Error(`Missing required environment variable: ${key}`);
}

export const pool = new Pool({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT) || 5432,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    max: 10,
    idleTimeoutMillis: 30_000,
    connectionTimeoutMillis: 5_000,
});

pool.on("error", (error) => {
    Logger.log(Logger.logLevels.ERROR, Logger.contexts.DB, `Unexpected pool error: ${error.message}`);
});

export async function setup() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            username VARCHAR(50) PRIMARY KEY,
            email VARCHAR(100) UNIQUE NOT NULL,
            passwordhash VARCHAR(255) NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            isadmin BOOLEAN DEFAULT FALSE
        );
        CREATE TABLE IF NOT EXISTS secrets (
            id VARCHAR(36) PRIMARY KEY,
            owner VARCHAR(50) REFERENCES users(username) ON DELETE CASCADE,
            secret_data TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `);

    // Upgrade the original SERIAL id column without discarding existing rows.
    await pool.query(`
        ALTER TABLE secrets ALTER COLUMN id DROP DEFAULT;
        ALTER TABLE secrets ALTER COLUMN id TYPE VARCHAR(36) USING BTRIM(id::text);
        CREATE INDEX IF NOT EXISTS secrets_owner_idx ON secrets(owner);
    `);
    Logger.log(Logger.logLevels.INFO, Logger.contexts.DB, "Database schema ready");
}

function parseSecret(value: unknown): SecretData | undefined {
    if (!value) return undefined;
    const parsed = typeof value === "string" ? JSON.parse(value) : value;
    if (!parsed || typeof parsed !== "object") return undefined;
    return parsed as SecretData;
}

export async function getPersistentSecret(id: string) {
    const result = await pool.query(
        "SELECT secret_data FROM secrets WHERE id = $1",
        [id],
    );
    return parseSecret(result.rows[0]?.secret_data);
}

export async function getUserByName(username: string) {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username]);
    return result.rows[0];
}

export async function getAllUsers() {
    const result = await pool.query(
        "SELECT username, email, created_at, isadmin FROM users ORDER BY created_at DESC",
    );
    return result.rows;
}

export async function getPersistentSecretsByOwner(username: string) {
    const result = await pool.query(
        "SELECT secret_data FROM secrets WHERE owner = $1 ORDER BY created_at DESC",
        [username],
    );
    return result.rows.map((row) => parseSecret(row.secret_data)).filter((value): value is SecretData => Boolean(value));
}
