import {
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { performKick } from "../../lib/mod-actions";
import { sendModLog } from "../../lib/mod-log";
import { CommandCategory, defineCommand } from "../../types/command";

export default defineCommand({
  category: CommandCategory.Moderation,
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

    const result = await performKick({ interaction, target, member, reason });

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
