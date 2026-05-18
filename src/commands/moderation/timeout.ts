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
  formatDuration,
  notifyTarget,
  recordCase,
} from "../../lib/moderation";
import { defineCommand } from "../../types/command";

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

const DURATION_CHOICES = [
  { name: "60 seconds", value: 60_000 },
  { name: "5 minutes", value: 5 * MINUTE },
  { name: "10 minutes", value: 10 * MINUTE },
  { name: "1 hour", value: HOUR },
  { name: "6 hours", value: 6 * HOUR },
  { name: "1 day", value: DAY },
  { name: "1 week", value: 7 * DAY },
  { name: "28 days", value: 28 * DAY },
];

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("timeout")
    .setDescription("Timeout a user.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to timeout.")
        .setRequired(true),
    )
    .addIntegerOption((opt) =>
      opt
        .setName("duration")
        .setDescription("How long the timeout should last.")
        .setRequired(true)
        .addChoices(...DURATION_CHOICES),
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Why this user is being timed out.")
        .setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const target = interaction.options.getUser("user", true);
    const durationMs = interaction.options.getInteger("duration", true);
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

    try {
      await member.timeout(
        durationMs,
        formatAuditReason(interaction.user, reason),
      );
    } catch (err) {
      await interaction.reply({
        content: "Failed to timeout this user (Discord refused the action).",
        flags: MessageFlags.Ephemeral,
      });
      throw err;
    }

    // DM after the action: the user is still in the guild, so the DM is accurate
    // (no false notification if Discord refused the timeout).
    const dmDelivered = await notifyTarget(target, {
      guild: interaction.guild,
      type: "timeout",
      reason,
      durationMs,
    });

    const caseId = recordCase({
      guildId: interaction.guildId,
      userId: target.id,
      moderatorId: interaction.user.id,
      type: "timeout",
      reason,
      durationMs,
    });

    const embed = buildModerationEmbed({
      type: "timeout",
      target,
      reason,
      caseId,
      dmNote: dmDelivered ? "" : " · DM not delivered",
      titleExtra: ` (${formatDuration(durationMs)})`,
    });

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
});
