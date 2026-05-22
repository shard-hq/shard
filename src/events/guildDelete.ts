import { Events } from "discord.js";
import { eq } from "drizzle-orm";
import { db } from "../db";
import { cases, guildAutoroles, guildSettings } from "../db/schema";
import { logger } from "../lib/logger";
import { defineEvent } from "../types/event";

export default defineEvent({
  name: Events.GuildDelete,
  execute(guild) {
    if (!guild.available) return;

    try {
      db.delete(guildSettings)
        .where(eq(guildSettings.guildId, guild.id))
        .run();
      db.delete(guildAutoroles)
        .where(eq(guildAutoroles.guildId, guild.id))
        .run();
      db.delete(cases).where(eq(cases.guildId, guild.id)).run();

      logger.info(
        { guild: guild.id, name: guild.name },
        "guild data purged",
      );
    } catch (err) {
      logger.error({ err, guild: guild.id }, "failed to purge guild data");
    }
  },
});
