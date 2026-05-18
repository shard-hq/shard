import {
  type EmbedBuilder,
  type GuildMember,
  type User,
} from "discord.js";
import {
  buildModerationEmbed,
  checkGuards,
  formatAuditReason,
  formatDuration,
  notifyTarget,
  recordCase,
  type GuildModerationInteraction,
} from "./moderation";

export interface PerformInput {
  interaction: GuildModerationInteraction;
  target: User;
  member: GuildMember | null;
  reason: string | null;
}

export interface PerformOk {
  ok: true;
  caseId: number;
  embed: EmbedBuilder;
}

export interface PerformErr {
  ok: false;
  error: string;
}

export type PerformResult = PerformOk | PerformErr;

interface BuildSuccessInput {
  type: "warn" | "kick" | "ban" | "timeout" | "untimeout" | "unban";
  target: User;
  moderator: User;
  reason: string | null;
  caseId: number;
  dmDelivered: boolean | null;
  memberInServer: boolean;
  titleExtra?: string;
}

const buildSuccess = (input: BuildSuccessInput): PerformOk => {
  let dmNote = "";
  if (input.dmDelivered === null && !input.memberInServer) {
    dmNote = " · User not in server";
  } else if (input.dmDelivered === false) {
    dmNote = " · DM not delivered";
  }
  const embed = buildModerationEmbed({
    type: input.type,
    target: input.target,
    moderator: input.moderator,
    reason: input.reason,
    caseId: input.caseId,
    dmNote,
    titleExtra: input.titleExtra,
  });
  return { ok: true, caseId: input.caseId, embed };
};

export const performWarn = async (
  input: PerformInput,
): Promise<PerformResult> => {
  const { interaction, target, member, reason } = input;
  const guardError = checkGuards(interaction, target, member, {
    requireBotHierarchy: false,
  });
  if (guardError) return { ok: false, error: guardError };

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

  return buildSuccess({
    type: "warn",
    target,
    moderator: interaction.user,
    reason,
    caseId,
    dmDelivered,
    memberInServer: member !== null,
  });
};

export const performKick = async (
  input: PerformInput,
): Promise<PerformResult> => {
  const { interaction, target, member, reason } = input;
  if (!member) {
    return { ok: false, error: "That user is not in this server." };
  }
  const guardError = checkGuards(interaction, target, member, {
    requireBotHierarchy: true,
  });
  if (guardError) return { ok: false, error: guardError };

  // DM before the kick: after kick, DM only works if the bot shares another guild with the user.
  const dmDelivered = await notifyTarget(target, {
    guild: interaction.guild,
    type: "kick",
    reason,
  });

  try {
    await member.kick(formatAuditReason(interaction.user, reason));
  } catch {
    return {
      ok: false,
      error: "Failed to kick this user (Discord refused the action).",
    };
  }

  const caseId = recordCase({
    guildId: interaction.guildId,
    userId: target.id,
    moderatorId: interaction.user.id,
    type: "kick",
    reason,
  });

  return buildSuccess({
    type: "kick",
    target,
    moderator: interaction.user,
    reason,
    caseId,
    dmDelivered,
    memberInServer: true,
  });
};

export interface PerformBanInput extends PerformInput {
  deleteMessageSeconds: number;
}

export const performBan = async (
  input: PerformBanInput,
): Promise<PerformResult> => {
  const { interaction, target, member, reason, deleteMessageSeconds } = input;
  const guardError = checkGuards(interaction, target, member, {
    requireBotHierarchy: true,
  });
  if (guardError) return { ok: false, error: guardError };

  // DM before the ban: once banned, the user can't be DM'd reliably.
  const dmDelivered = member
    ? await notifyTarget(target, {
        guild: interaction.guild,
        type: "ban",
        reason,
      })
    : null;

  try {
    await interaction.guild.members.ban(target.id, {
      reason: formatAuditReason(interaction.user, reason),
      deleteMessageSeconds,
    });
  } catch {
    return {
      ok: false,
      error: "Failed to ban this user (Discord refused the action).",
    };
  }

  const caseId = recordCase({
    guildId: interaction.guildId,
    userId: target.id,
    moderatorId: interaction.user.id,
    type: "ban",
    reason,
  });

  return buildSuccess({
    type: "ban",
    target,
    moderator: interaction.user,
    reason,
    caseId,
    dmDelivered,
    memberInServer: member !== null,
  });
};

export interface PerformTimeoutInput extends PerformInput {
  durationMs: number;
}

export const performTimeout = async (
  input: PerformTimeoutInput,
): Promise<PerformResult> => {
  const { interaction, target, member, reason, durationMs } = input;
  if (!member) {
    return { ok: false, error: "That user is not in this server." };
  }
  const guardError = checkGuards(interaction, target, member, {
    requireBotHierarchy: true,
  });
  if (guardError) return { ok: false, error: guardError };

  try {
    await member.timeout(durationMs, formatAuditReason(interaction.user, reason));
  } catch {
    return {
      ok: false,
      error: "Failed to timeout this user (Discord refused the action).",
    };
  }

  // DM after the action: the user is still in the guild, so the DM is accurate.
  const dmDelivered = await notifyTarget(target, {
    guild: interaction.guild,
    type: "timeout",
    reason,
    durationMs,
  });

  const caseId = recordCase({
    guildId: interaction.guildId,
    userId: target.id,
    moderatorId: interaction.user.id,
    type: "timeout",
    reason,
    durationMs,
  });

  return buildSuccess({
    type: "timeout",
    target,
    moderator: interaction.user,
    reason,
    caseId,
    dmDelivered,
    memberInServer: true,
    titleExtra: ` (${formatDuration(durationMs)})`,
  });
};

