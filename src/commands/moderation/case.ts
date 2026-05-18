import {
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TimestampStyles,
  time,
  type ChatInputCommandInteraction,
} from "discord.js";
import { and, eq } from "drizzle-orm";
import { db } from "../../db";
import { cases } from "../../db/schema";
import { sendModLog } from "../../lib/mod-log";
import { TYPE_META } from "../../lib/moderation";
import { CommandCategory, defineCommand } from "../../types/command";

const DELETE_COLOR = 0x99aab5;

const handleDelete = async (
  interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> => {
  const caseId = interaction.options.getInteger("id", true);

  const existing = db
    .select()
    .from(cases)
    .where(and(eq(cases.id, caseId), eq(cases.guildId, interaction.guildId)))
    .get();

  if (!existing) {
    await interaction.reply({
      content: `Case #${caseId} not found in this server.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  db.delete(cases)
    .where(and(eq(cases.id, caseId), eq(cases.guildId, interaction.guildId)))
    .run();

  await interaction.reply({
    content: `Case #${caseId} deleted.`,
    flags: MessageFlags.Ephemeral,
  });

  const meta = TYPE_META[existing.type];
  const reason = existing.reason ?? "*No reason provided*";
  const createdAt = time(
    new Date(existing.createdAt),
    TimestampStyles.RelativeTime,
  );
  const embed = new EmbedBuilder()
    .setColor(DELETE_COLOR)
    .setTitle(`🗑️ Case #${caseId} deleted`)
    .setDescription(
      [
        `**Type:** ${meta.emoji} ${meta.label}`,
        `**User:** <@${existing.userId}>`,
        `**Reason:** ${reason}`,
        `**Original moderator:** <@${existing.moderatorId}> · ${createdAt}`,
      ].join("\n"),
    )
    .addFields({
      name: "Deleted by",
      value: `<@${interaction.user.id}>`,
      inline: true,
    });

  await sendModLog(interaction.guild, embed);
};

export default defineCommand({
  category: CommandCategory.Moderation,
  data: new SlashCommandBuilder()
    .setName("case")
    .setDescription("Manage individual moderation cases.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommand((sub) =>
      sub
        .setName("delete")
        .setDescription("Delete a moderation case.")
        .addIntegerOption((opt) =>
          opt
            .setName("id")
            .setDescription("The case number to delete.")
            .setMinValue(1)
            .setRequired(true),
        ),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const sub = interaction.options.getSubcommand(true);
    if (sub === "delete") return handleDelete(interaction);
  },
});
