import { type EmbedBuilder, type Guild } from "discord.js";
import { getGuildSettings } from "./guild-settings";
import { logger } from "./logger";

export const sendModLog = async (
  guild: Guild,
  embed: EmbedBuilder,
): Promise<void> => {
  const settings = getGuildSettings(guild.id);
  if (!settings?.modLogChannelId) return;

  const channelId = settings.modLogChannelId;
  const channel =
    guild.channels.cache.get(channelId) ??
    (await guild.channels.fetch(channelId).catch(() => null));

  if (!channel?.isSendable()) {
    logger.warn(
      { guildId: guild.id, channelId },
      "mod log channel missing or not sendable",
    );
    return;
  }

  try {
    await channel.send({ embeds: [embed] });
  } catch (err) {
    logger.warn(
      { err, guildId: guild.id, channelId },
      "mod log send failed",
    );
  }
};
