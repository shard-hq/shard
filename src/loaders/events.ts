import path from "node:path";
import { Glob } from "bun";
import type { Client, ClientEvents } from "discord.js";
import { logger } from "../lib/logger";
import type { Event } from "../types/event";

const EVENTS_DIR = path.resolve(import.meta.dir, "../events");

const isEvent = (value: unknown): value is Event => {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as { name?: unknown; execute?: unknown };
  return typeof obj.name === "string" && typeof obj.execute === "function";
};

const attachEvent = <K extends keyof ClientEvents>(
  client: Client,
  event: Event<K>,
): void => {
  const handler = (...args: ClientEvents[K]): void => {
    void event.execute(...args);
  };
  if (event.once) client.once(event.name, handler);
  else client.on(event.name, handler);
};

export const loadEvents = async (client: Client): Promise<void> => {
  const glob = new Glob("**/*.ts");
  let count = 0;

  for await (const file of glob.scan(EVENTS_DIR)) {
    if (file.endsWith(".test.ts") || file.endsWith(".d.ts")) continue;

    const absPath = path.join(EVENTS_DIR, file);
    try {
      const mod = (await import(absPath)) as { default?: unknown };
      const event = mod.default;
      if (!isEvent(event)) {
        logger.warn({ file }, "invalid event export, skipping");
        continue;
      }
      attachEvent(client, event);
      count++;
      logger.debug(
        { event: event.name, once: Boolean(event.once), file },
        "event attached",
      );
    } catch (err) {
      logger.error({ err, file }, "failed to load event");
    }
  }

  logger.info({ count }, "events loaded");
};
