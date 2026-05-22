import { MessageFlags } from "discord.js";
import {
  performKick,
  respondModerationResult,
} from "../../lib/mod-actions";
import {
  extractReason,
  fetchTargetAndMember,
} from "../../lib/mod-modals";
import { defineModal } from "../../types/modal";

export default defineModal({
  prefix: "mod-kick",
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const targetId = interaction.customId.split(":")[1];
    if (!targetId) return;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const resolved = await fetchTargetAndMember(interaction, targetId);
    if (!resolved) {
      await interaction.editReply({ content: "Target user not found." });
      return;
    }

    const result = await performKick({
      interaction,
      target: resolved.target,
      member: resolved.member,
      reason: extractReason(interaction),
    });
    await respondModerationResult(interaction, result);
  },
});
