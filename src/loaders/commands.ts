import path from "node:path";
import { Glob } from "bun";
import { ContextMenuCommandBuilder } from "discord.js";
import { commandRegistry } from "../lib/command-registry";
import { logger } from "../lib/logger";
import { userCommandRegistry } from "../lib/user-command-registry";
import { isCommandCategory, type Command } from "../types/command";
import type { UserCommand } from "../types/user-command";

const COMMANDS_DIR = path.resolve(import.meta.dir, "../commands");

const isUserCommand = (value: unknown): value is UserCommand => {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as {
    data?: unknown;
    execute?: unknown;
    category?: unknown;
  };
  if (!(obj.data instanceof ContextMenuCommandBuilder)) return false;
  if (typeof obj.execute !== "function") return false;
  return isCommandCategory(obj.category);
};

const isCommand = (value: unknown): value is Command => {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as {
    data?: unknown;
    execute?: unknown;
    category?: unknown;
  };
  if (typeof obj.execute !== "function") return false;
  if (typeof obj.data !== "object" || obj.data === null) return false;
  if (obj.data instanceof ContextMenuCommandBuilder) return false;
  if (!isCommandCategory(obj.category)) return false;
  const data = obj.data as { name?: unknown };
  return typeof data.name === "string";
};

export const loadCommands = async (): Promise<void> => {
  commandRegistry.clear();
  userCommandRegistry.clear();
  const glob = new Glob("**/*.ts");

  for await (const file of glob.scan(COMMANDS_DIR)) {
    if (file.endsWith(".test.ts")) continue;

    const absPath = path.join(COMMANDS_DIR, file);
    try {
      const mod = (await import(absPath)) as { default?: unknown };
      const exp = mod.default;
      if (isUserCommand(exp)) {
        userCommandRegistry.set(exp.data.name, exp);
        logger.debug(
          { command: exp.data.name, file, kind: "user" },
          "user command loaded",
        );
      } else if (isCommand(exp)) {
        commandRegistry.set(exp.data.name, exp);
        logger.debug(
          { command: exp.data.name, file, kind: "chat" },
          "chat command loaded",
        );
      } else {
        logger.warn({ file }, "invalid command export, skipping");
      }
    } catch (err) {
      logger.error({ err, file }, "failed to load command");
    }
  }

  logger.info(
    { chat: commandRegistry.size, user: userCommandRegistry.size },
    "commands loaded",
  );
};
