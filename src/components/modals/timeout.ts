import { MessageFlags } from "discord.js";
import { performTimeout } from "../../lib/mod-actions";
import { sendModLog } from "../../lib/mod-log";
import { parseDuration } from "../../lib/moderation";
import { defineModal } from "../../types/modal";

export default defineModal({
  prefix: "mod-timeout",
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const targetId = interaction.customId.split(":")[1];
    if (!targetId) return;

    const target = await interaction.client.users
      .fetch(targetId)
      .catch(() => null);
    if (!target) {
      await interaction.reply({
        content: "Target user not found.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const durationInput = interaction.fields.getTextInputValue("duration");
    const durationMs = parseDuration(durationInput);
    if (durationMs === null) {
      await interaction.reply({
        content:
          "Invalid duration. Use a number followed by s/m/h/d/w (e.g. `10m`, `1h`, `1d`). Max 28d.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const reasonInput = interaction.fields
      .getTextInputValue("reason")
      .trim();
    const reason = reasonInput || null;
    const member = await interaction.guild.members
      .fetch(targetId)
      .catch(() => null);

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

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
