import {
  EmbedBuilder,
  type ChatInputCommandInteraction,
  type Guild,
  type GuildMember,
  type User,
} from "discord.js";
import { db } from "../db";
import { cases, type CaseType } from "../db/schema";

export interface CaseTypeMeta {
  emoji: string;
  label: string;
  verb: string;
  color: number;
}

export const TYPE_META: Record<CaseType, CaseTypeMeta> = {
  warn: { emoji: "⚠️", label: "Warn", verb: "Warned", color: 0xfee75c },
  timeout: { emoji: "🔇", label: "Timeout", verb: "Timed out", color: 0xfaa61a },
  kick: { emoji: "👢", label: "Kick", verb: "Kicked", color: 0xe67e22 },
  ban: { emoji: "🔨", label: "Ban", verb: "Banned", color: 0xed4245 },
  unban: { emoji: "🔓", label: "Unban", verb: "Unbanned", color: 0x57f287 },
  untimeout: {
    emoji: "🔊",
    label: "Untimeout",
    verb: "Removed timeout from",
    color: 0x57f287,
  },
};

const DM_OPENING: Record<CaseType, (guildName: string) => string> = {
  warn: (g) => `You have been **warned** in **${g}**.`,
  timeout: (g) => `You have been **timed out** in **${g}**.`,
  kick: (g) => `You have been **kicked** from **${g}**.`,
  ban: (g) => `You have been **banned** from **${g}**.`,
  unban: (g) => `Your ban has been **lifted** in **${g}**.`,
  untimeout: (g) => `Your timeout has been **removed** in **${g}**.`,
};

export const formatDuration = (ms: number): string => {
  const s = Math.floor(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  return `${d}d`;
};

export const formatAuditReason = (
  moderator: User,
  reason: string | null,
): string => (reason ? `${moderator.username} — ${reason}` : moderator.username);

interface CheckGuardsOptions {
  requireBotHierarchy: boolean;
}

export const checkGuards = (
  interaction: ChatInputCommandInteraction<"cached">,
  target: User,
  member: GuildMember | null,
  options: CheckGuardsOptions,
): string | null => {
  if (target.id === interaction.user.id) {
    return "You can't moderate yourself.";
  }
  if (target.id === interaction.client.user.id) {
    return "I can't moderate myself.";
  }
  if (target.id === interaction.guild.ownerId) {
    return "I can't moderate the server owner.";
  }

  if (!member) return null;

  const isInvokerOwner = interaction.user.id === interaction.guild.ownerId;
  if (!isInvokerOwner) {
    const invoker = interaction.member;
    if (member.roles.highest.position >= invoker.roles.highest.position) {
      return "You can't moderate someone with an equal or higher role than you.";
    }
  }

  if (options.requireBotHierarchy) {
    const me = interaction.guild.members.me;
    if (!me) return "I can't determine my own role in this server.";
    if (member.roles.highest.position >= me.roles.highest.position) {
      return "I can't moderate someone with an equal or higher role than me.";
    }
  }

  return null;
};

export interface NotifyPayload {
  guild: Guild;
  type: CaseType;
  reason: string | null;
  durationMs?: number;
}

export const notifyTarget = async (
  user: User,
  payload: NotifyPayload,
): Promise<boolean> => {
  const lines = [
    DM_OPENING[payload.type](payload.guild.name),
    payload.reason
      ? `**Reason:** ${payload.reason}`
      : "*No reason provided.*",
  ];
  if (payload.durationMs) {
    const endsAt = Math.floor((Date.now() + payload.durationMs) / 1000);
    lines.push(
      `**Duration:** ${formatDuration(payload.durationMs)} (until <t:${endsAt}:R>)`,
    );
  }
  try {
    await user.send(lines.join("\n"));
    return true;
  } catch {
    return false;
  }
};

export interface ModerationEmbedInput {
  type: CaseType;
  target: User;
  moderator?: User;
  reason: string | null;
  caseId: number;
  dmNote?: string;
  titleExtra?: string;
}

export const buildModerationEmbed = (input: ModerationEmbedInput): EmbedBuilder => {
  const meta = TYPE_META[input.type];
  const embed = new EmbedBuilder()
    .setColor(meta.color)
    .setTitle(
      `${meta.emoji} ${meta.verb} ${input.target.username}${input.titleExtra ?? ""}`,
    )
    .setDescription(
      input.reason ? `**Reason:** ${input.reason}` : "*No reason provided.*",
    );
  if (input.moderator) {
    embed.addFields({
      name: "Moderator",
      value: `<@${input.moderator.id}>`,
      inline: true,
    });
  }
  embed.setFooter({ text: `Case #${input.caseId}${input.dmNote ?? ""}` });
  return embed;
};

export interface RecordCaseInput {
  guildId: string;
  userId: string;
  moderatorId: string;
  type: CaseType;
  reason: string | null;
  durationMs?: number;
}

export const recordCase = (input: RecordCaseInput): number => {
  const inserted = db
    .insert(cases)
    .values({
      guildId: input.guildId,
      userId: input.userId,
      moderatorId: input.moderatorId,
      type: input.type,
      reason: input.reason,
      durationMs: input.durationMs ?? null,
      createdAt: Date.now(),
    })
    .returning({ id: cases.id })
    .get();
  if (!inserted) throw new Error("Failed to insert case row");
  return inserted.id;
};
