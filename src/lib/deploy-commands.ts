import { createHash } from "node:crypto";
import { type Client, REST, Routes } from "discord.js";
import { env } from "../env";
import { commandRegistry } from "./command-registry";
import { logger } from "./logger";

const CACHE_FILE = ".cache/commands.hash";

const computeHash = (data: unknown): string =>
  createHash("sha256").update(JSON.stringify(data)).digest("hex");

const readCache = async (): Promise<string | null> => {
  try {
    return (await Bun.file(CACHE_FILE).text()).trim();
  } catch {
    return null;
  }
};

const writeCache = async (hash: string): Promise<void> => {
  await Bun.write(CACHE_FILE, hash);
};

export const deployCommands = async (client: Client<true>): Promise<void> => {
  const body = Array.from(commandRegistry.values()).map((c) => c.data.toJSON());
  if (body.length === 0) {
    logger.warn("no commands to deploy");
    return;
  }

  const hash = computeHash(body);
  const cached = await readCache();
  if (cached === hash) {
    logger.debug({ count: body.length }, "commands unchanged, skipping deploy");
    return;
  }

  const rest = new REST().setToken(env.DISCORD_TOKEN);
  const route = Routes.applicationCommands(client.application.id);

  logger.info({ count: body.length }, "deploying commands");

  try {
    await rest.put(route, { body });
    await writeCache(hash);
    logger.info("commands deployed");
  } catch (err) {
    logger.error({ err }, "deployment failed");
  }
};
