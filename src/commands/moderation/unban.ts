import {
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { logger } from "../../lib/logger";
import {
  buildModerationEmbed,
  formatAuditReason,
  recordCase,
} from "../../lib/moderation";
import { CommandCategory, defineCommand } from "../../types/command";

export default defineCommand({
  category: CommandCategory.Moderation,
  data: new SlashCommandBuilder()
    .setName("unban")
    .setDescription("Unban a user from the server.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to unban.")
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Why this user is being unbanned.")
        .setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason");

    try {
      await interaction.guild.bans.remove(
        target.id,
        formatAuditReason(interaction.user, reason),
      );
    } catch (err) {
      logger.warn(
        { err, target: target.id, guild: interaction.guildId },
        "unban refused by Discord",
      );
      await interaction.reply({
        content: "That user is not banned, or I can't unban them.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const caseId = recordCase({
      guildId: interaction.guildId,
      userId: target.id,
      moderatorId: interaction.user.id,
      type: "unban",
      reason,
    });

    const embed = buildModerationEmbed({
      type: "unban",
      target,
      reason,
      caseId,
    });

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
});
