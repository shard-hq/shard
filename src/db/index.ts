import { mkdirSync } from "node:fs";
import path from "node:path";
import { Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { logger } from "../lib/logger";

const DB_PATH = path.resolve(process.cwd(), "data/shard.db");

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH, { create: true, strict: true });

sqlite.run("PRAGMA journal_mode = WAL");
sqlite.run("PRAGMA synchronous = NORMAL");
sqlite.run("PRAGMA foreign_keys = ON");
sqlite.run("PRAGMA busy_timeout = 5000");
sqlite.run("PRAGMA temp_store = MEMORY");

logger.info({ path: DB_PATH }, "database connected");

export const db = drizzle({ client: sqlite });

export const closeDb = (): void => sqlite.close(false);
