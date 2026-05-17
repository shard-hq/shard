import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TimestampStyles,
  time,
} from "discord.js";
import { and, count, desc, eq } from "drizzle-orm";
import { db } from "../../db";
import { cases, type Case, type CaseType } from "../../db/schema";
import { defineCommand } from "../../types/command";

const PAGE_SIZE = 5;
const DEFAULT_COLOR = 0x5865f2;
export const CASES_BUTTON_PREFIX = "cases";

const TYPE_META: Record<
  CaseType,
  { emoji: string; label: string; color: number }
> = {
  warn: { emoji: "⚠️", label: "Warn", color: 0xfee75c },
  kick: { emoji: "👢", label: "Kick", color: 0xfaa61a },
  ban: { emoji: "🔨", label: "Ban", color: 0xed4245 },
};

const SEVERITY_ORDER: readonly CaseType[] = ["ban", "kick", "warn"] as const;

export interface CasesTarget {
  id: string;
  username: string;
  avatarUrl?: string | null;
}

interface RenderedPage {
  embeds: EmbedBuilder[];
  components: ActionRowBuilder<ButtonBuilder>[];
}

const dominantColor = (types: Set<CaseType>): number => {
  for (const t of SEVERITY_ORDER) {
    if (types.has(t)) return TYPE_META[t].color;
  }
  return DEFAULT_COLOR;
};

const formatCaseField = (row: Case): { name: string; value: string } => {
  const meta = TYPE_META[row.type];
  const reason = row.reason ?? "*No reason provided*";
  const when = time(new Date(row.createdAt), TimestampStyles.RelativeTime);
  return {
    name: `${meta.emoji} Case #${row.id} · ${meta.label}`,
    value: `${reason}\n-# By <@${row.moderatorId}> · ${when}`,
  };
};

export const buildCasesPage = (
  guildId: string,
  target: CasesTarget,
  requestedPage: number,
): RenderedPage => {
  const totalRow = db
    .select({ value: count() })
    .from(cases)
    .where(and(eq(cases.guildId, guildId), eq(cases.userId, target.id)))
    .get();
  const total = totalRow?.value ?? 0;

  const embed = new EmbedBuilder().setTitle(`Cases — ${target.username}`);
  if (target.avatarUrl) embed.setThumbnail(target.avatarUrl);

  if (total === 0) {
    embed
      .setColor(DEFAULT_COLOR)
      .setDescription("No cases on record.")
      .setFooter({ text: `ID · ${target.id}` });
    return { embeds: [embed], components: [] };
  }

  const distinctTypes = db
    .selectDistinct({ type: cases.type })
    .from(cases)
    .where(and(eq(cases.guildId, guildId), eq(cases.userId, target.id)))
    .all();
  const typeSet = new Set(distinctTypes.map((r) => r.type));

  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const page = Math.min(Math.max(0, requestedPage), totalPages - 1);

  const rows = db
    .select()
    .from(cases)
    .where(and(eq(cases.guildId, guildId), eq(cases.userId, target.id)))
    .orderBy(desc(cases.createdAt))
    .limit(PAGE_SIZE)
    .offset(page * PAGE_SIZE)
    .all();

  embed
    .setColor(dominantColor(typeSet))
    .setDescription(
      total === 1 ? "1 case on record." : `${total} cases on record.`,
    )
    .addFields(rows.map(formatCaseField))
    .setFooter({
      text: `ID · ${target.id} · Page ${page + 1}/${totalPages}`,
    });

  if (totalPages === 1) return { embeds: [embed], components: [] };

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`${CASES_BUTTON_PREFIX}:${target.id}:${page - 1}`)
      .setEmoji("⬅️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page === 0),
    new ButtonBuilder()
      .setCustomId(`${CASES_BUTTON_PREFIX}:${target.id}:${page + 1}`)
      .setEmoji("➡️")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(page >= totalPages - 1),
  );

  return { embeds: [embed], components: [row] };
};

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("cases")
    .setDescription("List moderation cases for a user.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers)
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to look up.")
        .setRequired(true),
    ),
  async execute(interaction) {
    if (!interaction.inGuild()) return;

    const user = interaction.options.getUser("user", true);
    const rendered = buildCasesPage(
      interaction.guildId,
      {
        id: user.id,
        username: user.globalName ?? user.username,
        avatarUrl: user.displayAvatarURL({ size: 256 }),
      },
      0,
    );

    await interaction.reply({
      ...rendered,
      flags: MessageFlags.Ephemeral,
    });
  },
});
