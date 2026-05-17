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
  notifyTarget,
  recordCase,
  TYPE_META,
} from "../../lib/moderation";
import { defineCommand } from "../../types/command";

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("untimeout")
    .setDescription("Remove a timeout from a user.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to clear timeout for.")
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Why this timeout is being removed.")
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

    const until = member.communicationDisabledUntilTimestamp;
    if (!until || until <= Date.now()) {
      await interaction.reply({
        content: "That user is not currently timed out.",
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
      type: "untimeout",
      reason,
    });

    try {
      await member.timeout(null, formatAuditReason(interaction.user, reason));
    } catch (err) {
      await interaction.reply({
        content: "Failed to remove timeout (Discord refused the action).",
        flags: MessageFlags.Ephemeral,
      });
      throw err;
    }

    const caseId = recordCase({
      guildId: interaction.guildId,
      userId: target.id,
      moderatorId: interaction.user.id,
      type: "untimeout",
      reason,
    });

    const meta = TYPE_META.untimeout;
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${meta.emoji} Removed timeout from ${target.username}`)
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
