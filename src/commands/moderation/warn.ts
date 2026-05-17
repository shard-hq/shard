import {
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import {
  checkGuards,
  notifyTarget,
  recordCase,
  TYPE_META,
} from "../../lib/moderation";
import { defineCommand } from "../../types/command";

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("warn")
    .setDescription("Warn a user.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to warn.")
        .setRequired(true),
    )
    .addStringOption((opt) =>
      opt
        .setName("reason")
        .setDescription("Why this warning is being issued.")
        .setRequired(false),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason");
    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    const guardError = checkGuards(interaction, target, member, {
      requireBotHierarchy: false,
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
      type: "warn",
      reason,
    });

    const caseId = recordCase({
      guildId: interaction.guildId,
      userId: target.id,
      moderatorId: interaction.user.id,
      type: "warn",
      reason,
    });

    const meta = TYPE_META.warn;
    const embed = new EmbedBuilder()
      .setColor(meta.color)
      .setTitle(`${meta.emoji} ${meta.verb} ${target.username}`)
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
