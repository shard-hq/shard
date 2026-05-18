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
import { sendModLog } from "../../lib/mod-log";
import { CommandCategory, defineCommand } from "../../types/command";

const DELETE_CHOICES = [
  { name: "Don't delete", value: 0 },
  { name: "Last hour", value: 60 * 60 },
  { name: "Last 6 hours", value: 6 * 60 * 60 },
  { name: "Last 24 hours", value: 24 * 60 * 60 },
  { name: "Last 3 days", value: 3 * 24 * 60 * 60 },
  { name: "Last 7 days", value: 7 * 24 * 60 * 60 },
];

export default defineCommand({
  category: CommandCategory.Moderation,
  data: new SlashCommandBuilder()
    .setName("ban")
    .setDescription("Ban a user from the server.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers)
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to ban.")
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Why this user is being banned.")
        .setRequired(false),
    )
    .addIntegerOption((opt) =>
      opt
        .setName("delete_messages")
        .setDescription("Delete the user's recent messages.")
        .setRequired(false)
        .addChoices(...DELETE_CHOICES),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason");
    const deleteMessageSeconds =
      interaction.options.getInteger("delete_messages") ?? 0;
    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

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

    // DM before the ban: once banned, the user can't be DM'd reliably.
    const dmDelivered = member
      ? await notifyTarget(target, {
          guild: interaction.guild,
          type: "ban",
          reason,
        })
      : false;

    try {
      await interaction.guild.members.ban(target.id, {
        reason: formatAuditReason(interaction.user, reason),
        deleteMessageSeconds,
      });
    } catch (err) {
      await interaction.reply({
        content: "Failed to ban this user (Discord refused the action).",
        flags: MessageFlags.Ephemeral,
      });
      throw err;
    }

    const caseId = recordCase({
      guildId: interaction.guildId,
      userId: target.id,
      moderatorId: interaction.user.id,
      type: "ban",
      reason,
    });

    const dmNote = !member
      ? " · User not in server"
      : dmDelivered
        ? ""
        : " · DM not delivered";
    const embed = buildModerationEmbed({
      type: "ban",
      target,
      moderator: interaction.user,
      reason,
      caseId,
      dmNote,
    });

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
    await sendModLog(interaction.guild, embed);
  },
});
