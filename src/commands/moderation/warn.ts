import {
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { performWarn } from "../../lib/mod-actions";
import { sendModLog } from "../../lib/mod-log";
import { CommandCategory, defineCommand } from "../../types/command";

export default defineCommand({
  category: CommandCategory.Moderation,
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

    const result = await performWarn({ interaction, target, member, reason });

    if (!result.ok) {
      await interaction.reply({
        content: result.error,
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.reply({
      embeds: [result.embed],
      flags: MessageFlags.Ephemeral,
    });
    await sendModLog(interaction.guild, result.embed);
  },
});
