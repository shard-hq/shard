import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { constants, Database } from "bun:sqlite";
import { drizzle } from "drizzle-orm/bun-sqlite";
import { logger } from "../lib/logger";

const defaultDbPath = (): string => {
  if (Bun.env.NODE_ENV === "test") {
    return path.join(tmpdir(), `shard-test-${process.pid}.db`);
  }
  return path.resolve(process.cwd(), "data/shard.db");
};

const DB_PATH = Bun.env.DB_PATH ?? defaultDbPath();

mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH, { create: true, strict: true });

sqlite.run("PRAGMA journal_mode = WAL");
sqlite.run("PRAGMA synchronous = NORMAL");
sqlite.run("PRAGMA foreign_keys = ON");
sqlite.run("PRAGMA busy_timeout = 5000");
sqlite.run("PRAGMA temp_store = MEMORY");

logger.info({ path: DB_PATH }, "database connected");

export const db = drizzle({ client: sqlite });

export const closeDb = (): void => {
  sqlite.fileControl(constants.SQLITE_FCNTL_PERSIST_WAL, 0);
  sqlite.run("PRAGMA wal_checkpoint(TRUNCATE)");
  sqlite.close(false);
};
