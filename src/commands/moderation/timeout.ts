import {
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  checkGuards,
  formatAuditReason,
  formatDuration,
  notifyTarget,
  recordCase,
  TYPE_META,
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
    .setDescription("Timeout a user (Discord native timeout).")
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

    const dmDelivered = await notifyTarget(target, {
      guild: interaction.guild,
      type: "timeout",
      reason,
      durationMs,
    });

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

    const caseId = recordCase({
      guildId: interaction.guildId,
      userId: target.id,
      moderatorId: interaction.user.id,
      type: "timeout",
      reason,
      durationMs,
    });

    const meta = TYPE_META.timeout;
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(
        `${meta.emoji} ${meta.verb} ${target.username} (${formatDuration(durationMs)})`,
      )
      .setDescription(
        reason ? `**Reason:** ${reason}` : "*No reason provided.*",
      )
      .setFooter({
        text: `Case #${caseId}${dmDelivered ? "" : " · DM not delivered"}`,
      });

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
});
