import { Events } from "discord.js";
import { deployCommands } from "../lib/deploy-commands";
import { logger } from "../lib/logger";
import { defineEvent } from "../types/event";

export default defineEvent({
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    client.user.setPresence({ status: "dnd" });
    logger.info(
      { user: client.user.tag, guilds: client.guilds.cache.size },
      "client ready",
    );
    await deployCommands(client);
  },
});
