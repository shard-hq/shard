import { env } from "./env";
import { logger } from "./lib/logger";
import { client } from "./client";
import { closeDb } from "./db";
import { runMigrations } from "./db/migrate";
import { loadButtons } from "./loaders/buttons";
import { loadCommands } from "./loaders/commands";
import { loadEvents } from "./loaders/events";
import { loadModals } from "./loaders/modals";

runMigrations();

await loadCommands();
await loadButtons();
await loadModals();
await loadEvents(client);

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, "shutting down");
  try {
    await client.destroy();
    closeDb();
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "error during shutdown");
    process.exit(1);
  }
};

process.on("SIGINT", () => void shutdown("SIGINT"));
process.on("SIGTERM", () => void shutdown("SIGTERM"));
process.on("unhandledRejection", (reason: unknown) => {
  logger.error({ reason }, "unhandled rejection");
});
process.on("uncaughtException", (err: unknown) => {
  logger.fatal({ err }, "uncaught exception");
  process.exit(1);
});

await client.login(env.DISCORD_TOKEN);
