import { Events } from "discord.js";
import { env } from "../env";
import { syncBadgeEmojis } from "../lib/badge-emojis";
import { deployCommands } from "../lib/deploy-commands";
import { ensureGuildSettings } from "../lib/guild-settings";
import { logger } from "../lib/logger";
import { defineEvent } from "../types/event";

export default defineEvent({
  name: Events.ClientReady,
  once: true,
  async execute(client) {
    client.user.setPresence({ status: "online" });
    logger.info(
      {
        user: client.user.tag,
        guilds: client.guilds.cache.size,
      },
      "client ready",
    );

    for (const guildId of client.guilds.cache.keys()) {
      ensureGuildSettings(guildId);
    }

    await deployCommands(client);
    if (env.SYNC_EMOJIS) await syncBadgeEmojis(client);
    else logger.info("emoji sync skipped (SYNC_EMOJIS=false)");
  },
});
