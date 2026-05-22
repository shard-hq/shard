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
import { formatDuration, TYPE_META } from "../../lib/moderation";
import { CommandCategory, defineCommand } from "../../types/command";

const DELETE_COLOR = 0x99aab5;
const EDIT_COLOR = 0xf1c40f;

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

const handleView = async (
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

  await interaction.deferReply({ flags: MessageFlags.Ephemeral });

  const target = await interaction.client.users
    .fetch(existing.userId)
    .catch(() => null);

  const meta = TYPE_META[existing.type];
  const reason = existing.reason ?? "*No reason provided*";
  const createdAt = new Date(existing.createdAt);
  const userValue = target
    ? `${target.toString()} · \`${target.username}\``
    : `<@${existing.userId}>`;

  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(`${meta.emoji} Case #${existing.id} · ${meta.label}`)
    .addFields(
      { name: "User", value: userValue, inline: true },
      {
        name: "Moderator",
        value: `<@${existing.moderatorId}>`,
        inline: true,
      },
    );

  if (existing.durationMs !== null) {
    embed.addFields({
      name: "Duration",
      value: formatDuration(existing.durationMs),
      inline: true,
    });
  }

  embed
    .addFields(
      {
        name: "Date",
        value: `${time(createdAt, TimestampStyles.LongDate)} · ${time(createdAt, TimestampStyles.ShortTime)}\n${time(createdAt, TimestampStyles.RelativeTime)}`,
      },
      { name: "Reason", value: reason.slice(0, 1024) },
    )
    .setFooter({ text: `User ID · ${existing.userId}` });

  if (target) {
    embed.setThumbnail(target.displayAvatarURL({ size: 256 }));
  }

  await interaction.editReply({ embeds: [embed] });
};

const handleEdit = async (
  interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> => {
  const caseId = interaction.options.getInteger("id", true);
  const newReason = interaction.options.getString("reason", true).trim();

  if (newReason.length === 0) {
    await interaction.reply({
      content: "Reason cannot be empty.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

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

  const oldReason = existing.reason ?? "*No reason provided*";

  db.update(cases)
    .set({ reason: newReason })
    .where(and(eq(cases.id, caseId), eq(cases.guildId, interaction.guildId)))
    .run();

  await interaction.reply({
    content: `Case #${caseId} reason updated.`,
    flags: MessageFlags.Ephemeral,
  });

  const meta = TYPE_META[existing.type];
  const embed = new EmbedBuilder()
    .setColor(EDIT_COLOR)
    .setTitle(`✏️ Case #${caseId} edited`)
    .setDescription(
      [
        `**Type:** ${meta.emoji} ${meta.label}`,
        `**User:** <@${existing.userId}>`,
      ].join("\n"),
    )
    .addFields(
      { name: "Old reason", value: oldReason.slice(0, 1024) },
      { name: "New reason", value: newReason.slice(0, 1024) },
      {
        name: "Edited by",
        value: `<@${interaction.user.id}>`,
        inline: true,
      },
    );

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
        .setName("view")
        .setDescription("View the details of a moderation case.")
        .addIntegerOption((opt) =>
          opt
            .setName("id")
            .setDescription("The case number to view.")
            .setMinValue(1)
            .setRequired(true),
        ),
    )
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
    )
    .addSubcommand((sub) =>
      sub
        .setName("edit")
        .setDescription("Edit the reason of a moderation case.")
        .addIntegerOption((opt) =>
          opt
            .setName("id")
            .setDescription("The case number to edit.")
            .setMinValue(1)
            .setRequired(true),
        )
        .addStringOption((opt) =>
          opt
            .setName("reason")
            .setDescription("The new reason for this case.")
            .setMaxLength(512)
            .setRequired(true),
        ),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const sub = interaction.options.getSubcommand(true);
    if (sub === "view") return handleView(interaction);
    if (sub === "delete") return handleDelete(interaction);
    if (sub === "edit") return handleEdit(interaction);
  },
});
