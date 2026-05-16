import { env } from "./env";
import { logger } from "./lib/logger";
import { client } from "./client";
import { loadCommands } from "./loaders/commands";
import { loadEvents } from "./loaders/events";

await loadCommands();
await loadEvents(client);

const shutdown = async (signal: string): Promise<void> => {
  logger.info({ signal }, "shutting down");
  try {
    await client.destroy();
    process.exit(0);
  } catch (err) {
    logger.error({ err }, "error during shutdown");
    process.exit(1);
  }
};

const PROCESS_EVENTS = [
  "SIGINT",
  "SIGTERM",
  "unhandledRejection",
  "uncaughtException",
] as const;
for (const event of PROCESS_EVENTS) process.removeAllListeners(event);

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
