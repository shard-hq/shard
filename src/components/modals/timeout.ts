import { MessageFlags } from "discord.js";
import {
  performTimeout,
  respondModerationResult,
} from "../../lib/mod-actions";
import {
  extractReason,
  fetchTargetAndMember,
} from "../../lib/mod-modals";
import { parseDuration } from "../../lib/moderation";
import { defineModal } from "../../types/modal";

export default defineModal({
  prefix: "mod-timeout",
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const targetId = interaction.customId.split(":")[1];
    if (!targetId) return;

    const durationMs = parseDuration(
      interaction.fields.getTextInputValue("duration"),
    );
    if (durationMs === null) {
      await interaction.reply({
        content:
          "Invalid duration. Use a number followed by s/m/h/d/w (e.g. `10m`, `1h`, `1d`). Max 28d.",
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

    const result = await performTimeout({
      interaction,
      target: resolved.target,
      member: resolved.member,
      reason: extractReason(interaction),
      durationMs,
    });
    await respondModerationResult(interaction, result);
  },
});
