import {
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { logger } from "../../lib/logger";
import { sendModLog } from "../../lib/mod-log";
import { CommandCategory, defineCommand } from "../../types/command";

const MAX_PURGE = 100;
const FETCH_BATCH = 100;
const PURGE_COLOR = 0x95a5a6;

export default defineCommand({
  category: CommandCategory.Moderation,
  data: new SlashCommandBuilder()
    .setName("purge")
    .setDescription("Bulk delete recent messages in this channel.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages)
    .addIntegerOption((opt) =>
      opt
        .setName("count")
        .setDescription("How many messages to delete (1–100).")
        .setMinValue(1)
        .setMaxValue(MAX_PURGE)
        .setRequired(true),
    )
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("Only delete messages from this user.")
        .setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const channel = interaction.channel;
    if (!channel) {
      await interaction.editReply({
        content: "This command can't run in this channel.",
      });
      return;
    }

    const me = interaction.guild.members.me;
    const botPerms = me ? channel.permissionsFor(me) : null;
    if (!botPerms?.has(PermissionFlagsBits.ManageMessages)) {
      await interaction.editReply({
        content: "I need **Manage Messages** in this channel.",
      });
      return;
    }

    const count = interaction.options.getInteger("count", true);
    const user = interaction.options.getUser("user");

    const fetched = await channel.messages.fetch({ limit: FETCH_BATCH });
    const candidates = user
      ? fetched.filter((m) => m.author.id === user.id)
      : fetched;
    const toDelete = candidates.first(count);

    if (toDelete.length === 0) {
      await interaction.editReply(
        user
          ? `No recent messages from ${user.toString()} found.`
          : "No messages to delete.",
      );
      return;
    }

    let deleted: number;
    try {
      const result = await channel.bulkDelete(toDelete, true);
      deleted = result.size;
    } catch (err) {
      logger.error(
        { err, channelId: channel.id, guildId: interaction.guildId },
        "purge failed",
      );
      await interaction.editReply(
        "Failed to delete messages (some may be older than 14 days).",
      );
      return;
    }

    if (deleted === 0) {
      await interaction.editReply(
        "Nothing deleted — all candidate messages are older than 14 days.",
      );
      return;
    }

    const pluralS = deleted === 1 ? "" : "s";
    const filterNote = user ? ` from ${user.toString()}` : "";
    await interaction.editReply(
      `Deleted ${deleted} message${pluralS}${filterNote}.`,
    );

    const embed = new EmbedBuilder()
      .setColor(PURGE_COLOR)
      .setTitle(`🧹 Purged ${deleted} message${pluralS}`)
      .addFields(
        { name: "Channel", value: channel.toString(), inline: true },
        {
          name: "Moderator",
          value: `<@${interaction.user.id}>`,
          inline: true,
        },
      );
    if (user) {
      embed.addFields({
        name: "Filter",
        value: `From <@${user.id}>`,
        inline: true,
      });
    }
    await sendModLog(interaction.guild, embed);
  },
});
