import {
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  buildModerationEmbed,
  checkGuards,
  formatAuditReason,
  notifyTarget,
  recordCase,
} from "../../lib/moderation";
import { defineCommand } from "../../types/command";

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("kick")
    .setDescription("Kick a user from the server.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers)
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to kick.")
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Why this user is being kicked.")
        .setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason");
    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    if (!member) {
      await interaction.reply({
        content: "That user is not in this server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const guardError = checkGuards(interaction, target, member, {
      requireBotHierarchy: true,
    });
    if (guardError) {
      await interaction.reply({
        content: guardError,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    // DM before the kick: after kick, DM only works if the bot shares another guild with the user.
    const dmDelivered = await notifyTarget(target, {
      guild: interaction.guild,
      type: "kick",
      reason,
    });

    try {
      await member.kick(formatAuditReason(interaction.user, reason));
    } catch (err) {
      await interaction.reply({
        content: "Failed to kick this user (Discord refused the action).",
        flags: MessageFlags.Ephemeral,
      });
      throw err;
    }

    const caseId = recordCase({
      guildId: interaction.guildId,
      userId: target.id,
      moderatorId: interaction.user.id,
      type: "kick",
      reason,
    });

    const embed = buildModerationEmbed({
      type: "kick",
      target,
      reason,
      caseId,
      dmNote: dmDelivered ? "" : " · DM not delivered",
    });

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
});
