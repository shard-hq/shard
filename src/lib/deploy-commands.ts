import { type Client, REST, Routes } from "discord.js";
import { env } from "../env";
import { commandRegistry } from "./command-registry";
import { logger } from "./logger";

export const deployCommands = async (client: Client<true>): Promise<void> => {
  const body = Array.from(commandRegistry.values()).map((c) => c.data.toJSON());
  if (body.length === 0) {
    logger.warn("no commands to deploy");
    return;
  }

  const rest = new REST().setToken(env.DISCORD_TOKEN);
  const route = Routes.applicationCommands(client.application.id);

  logger.info({ count: body.length }, "deploying commands");

  try {
    await rest.put(route, { body });
    logger.info("commands deployed");
  } catch (err) {
    logger.error({ err }, "deployment failed");
  }
};
