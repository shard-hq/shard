import path from "node:path";
import { Glob } from "bun";
import { logger } from "../lib/logger";
import { modalRegistry } from "../lib/modal-registry";
import type { ModalHandler } from "../types/modal";

const MODALS_DIR = path.resolve(import.meta.dir, "../components/modals");

const isModalHandler = (value: unknown): value is ModalHandler => {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as { prefix?: unknown; execute?: unknown };
  return typeof obj.prefix === "string" && typeof obj.execute === "function";
};

export const loadModals = async (): Promise<void> => {
  const glob = new Glob("**/*.ts");

  for await (const file of glob.scan(MODALS_DIR)) {
    if (file.endsWith(".test.ts") || file.endsWith(".d.ts")) continue;

    const absPath = path.join(MODALS_DIR, file);
    try {
      const mod = (await import(absPath)) as { default?: unknown };
      const handler = mod.default;
      if (!isModalHandler(handler)) {
        logger.warn({ file }, "invalid modal handler export, skipping");
        continue;
      }
      modalRegistry.set(handler.prefix, handler);
      logger.debug(
        { prefix: handler.prefix, file },
        "modal handler loaded",
      );
    } catch (err) {
      logger.error({ err, file }, "failed to load modal handler");
    }
  }

  logger.info({ count: modalRegistry.size }, "modal handlers loaded");
};
