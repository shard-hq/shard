import path from "node:path";
import { Glob } from "bun";
import { buttonRegistry } from "../lib/button-registry";
import { logger } from "../lib/logger";
import type { ButtonHandler } from "../types/button";

const BUTTONS_DIR = path.resolve(import.meta.dir, "../components/buttons");

const isButtonHandler = (value: unknown): value is ButtonHandler => {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as { prefix?: unknown; execute?: unknown };
  return typeof obj.prefix === "string" && typeof obj.execute === "function";
};

export const loadButtons = async (): Promise<void> => {
  const glob = new Glob("**/*.ts");

  for await (const file of glob.scan(BUTTONS_DIR)) {
    if (file.endsWith(".test.ts") || file.endsWith(".d.ts")) continue;

    const absPath = path.join(BUTTONS_DIR, file);
    try {
      const mod = (await import(absPath)) as { default?: unknown };
      const handler = mod.default;
      if (!isButtonHandler(handler)) {
        logger.warn({ file }, "invalid button handler export, skipping");
        continue;
      }
      buttonRegistry.set(handler.prefix, handler);
      logger.debug(
        { prefix: handler.prefix, file },
        "button handler loaded",
      );
    } catch (err) {
      logger.error({ err, file }, "failed to load button handler");
    }
  }

  logger.info({ count: buttonRegistry.size }, "button handlers loaded");
};
