import {
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
} from "discord.js";
import { performTimeout } from "../../lib/mod-actions";
import { sendModLog } from "../../lib/mod-log";
import { CommandCategory, defineCommand } from "../../types/command";

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
  category: CommandCategory.Moderation,
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

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const target = interaction.options.getUser("user", true);
    const durationMs = interaction.options.getInteger("duration", true);
    const reason = interaction.options.getString("reason");
    const member = await interaction.guild.members
      .fetch(target.id)
      .catch(() => null);

    const result = await performTimeout({
      interaction,
      target,
      member,
      reason,
      durationMs,
    });

    if (!result.ok) {
      await interaction.editReply({ content: result.error });
      return;
    }

    await interaction.editReply({ embeds: [result.embed] });
    await sendModLog(interaction.guild, result.embed);
  },
});
