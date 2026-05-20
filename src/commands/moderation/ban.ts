import {
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { performBan } from "../../lib/mod-actions";
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

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const target = interaction.options.getUser("user", true);
    const reason = interaction.options.getString("reason");
    const deleteMessageSeconds =
      interaction.options.getInteger("delete_messages") ?? 0;
    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    const result = await performBan({
      interaction,
      target,
      member,
      reason,
      deleteMessageSeconds,
    });

    if (!result.ok) {
      await interaction.editReply({ content: result.error });
      return;
    }

    await interaction.editReply({ embeds: [result.embed] });
    await sendModLog(interaction.guild, result.embed);
  },
});
