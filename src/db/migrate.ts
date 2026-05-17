import path from "node:path";
import { migrate } from "drizzle-orm/bun-sqlite/migrator";
import { logger } from "../lib/logger";
import { db } from "./index";

const MIGRATIONS_FOLDER = path.resolve(import.meta.dir, "migrations");

export const runMigrations = (): void => {
  try {
    migrate(db, { migrationsFolder: MIGRATIONS_FOLDER });
    logger.info("migrations applied");
  } catch (err) {
    logger.fatal({ err }, "migration failed");
    process.exit(1);
  }
};
