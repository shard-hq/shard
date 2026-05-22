import { MessageFlags } from "discord.js";
import {
  performBan,
  respondModerationResult,
} from "../../lib/mod-actions";
import {
  extractReason,
  fetchTargetAndMember,
} from "../../lib/mod-modals";
import { defineModal } from "../../types/modal";

const SECONDS_PER_DAY = 24 * 60 * 60;
const MAX_DELETE_DAYS = 7;

export const parseDeleteDays = (input: string): number | null => {
  const trimmed = input.trim();
  if (trimmed === "") return 0;
  if (!/^\d+$/.test(trimmed)) return null;
  const n = Number.parseInt(trimmed, 10);
  if (n > MAX_DELETE_DAYS) return null;
  return n;
};

export default defineModal({
  prefix: "mod-ban",
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const targetId = interaction.customId.split(":")[1];
    if (!targetId) return;

    const deleteDays = parseDeleteDays(
      interaction.fields.getTextInputValue("delete_days"),
    );
    if (deleteDays === null) {
      await interaction.reply({
        content: "Delete days must be a number between 0 and 7.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const resolved = await fetchTargetAndMember(interaction, targetId);
    if (!resolved) {
      await interaction.editReply({ content: "Target user not found." });
      return;
    }

    const result = await performBan({
      interaction,
      target: resolved.target,
      member: resolved.member,
      reason: extractReason(interaction),
      deleteMessageSeconds: deleteDays * SECONDS_PER_DAY,
    });
    await respondModerationResult(interaction, result);
  },
});
