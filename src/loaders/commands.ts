import path from "node:path";
import { Glob } from "bun";
import { commandRegistry } from "../lib/command-registry";
import { logger } from "../lib/logger";
import type { Command } from "../types/command";

const COMMANDS_DIR = path.resolve(import.meta.dir, "../commands");

const isCommand = (value: unknown): value is Command => {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as { data?: unknown; execute?: unknown };
  if (typeof obj.execute !== "function") return false;
  if (typeof obj.data !== "object" || obj.data === null) return false;
  const data = obj.data as { name?: unknown };
  return typeof data.name === "string";
};

export const loadCommands = async (): Promise<void> => {
  commandRegistry.clear();
  const glob = new Glob("**/*.ts");

  for await (const file of glob.scan(COMMANDS_DIR)) {
    if (file.endsWith(".test.ts")) continue;

    const absPath = path.join(COMMANDS_DIR, file);
    try {
      const mod = (await import(absPath)) as { default?: unknown };
      const command = mod.default;
      if (!isCommand(command)) {
        logger.warn({ file }, "invalid command export, skipping");
        continue;
      }
      commandRegistry.set(command.data.name, command);
      logger.debug({ command: command.data.name, file }, "command loaded");
    } catch (err) {
      logger.error({ err, file }, "failed to load command");
    }
  }

  logger.info({ count: commandRegistry.size }, "commands loaded");
};
