import { MessageFlags } from "discord.js";
import { performBan } from "../../lib/mod-actions";
import { sendModLog } from "../../lib/mod-log";
import { defineModal } from "../../types/modal";

const SECONDS_PER_DAY = 24 * 60 * 60;
const MAX_DELETE_DAYS = 7;

const parseDeleteDays = (input: string): number | null => {
  const trimmed = input.trim();
  if (trimmed === "") return 0;
  const n = Number.parseInt(trimmed, 10);
  if (!Number.isInteger(n) || n < 0 || n > MAX_DELETE_DAYS) return null;
  return n;
};

export default defineModal({
  prefix: "mod-ban",
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const targetId = interaction.customId.split(":")[1];
    if (!targetId) return;

    const deleteDaysInput = interaction.fields.getTextInputValue("delete_days");
    const deleteDays = parseDeleteDays(deleteDaysInput);
    if (deleteDays === null) {
      await interaction.reply({
        content: "Delete days must be a number between 0 and 7.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const reasonInput = interaction.fields
      .getTextInputValue("reason")
      .trim();
    const reason = reasonInput || null;

    await interaction.deferReply({ flags: MessageFlags.Ephemeral });

    const target = await interaction.client.users
      .fetch(targetId)
      .catch(() => null);
    if (!target) {
      await interaction.editReply({ content: "Target user not found." });
      return;
    }

    const member = await interaction.guild.members
      .fetch(targetId)
      .catch(() => null);

    const result = await performBan({
      interaction,
      target,
      member,
      reason,
      deleteMessageSeconds: deleteDays * SECONDS_PER_DAY,
    });

    if (!result.ok) {
      await interaction.editReply({ content: result.error });
      return;
    }

    await interaction.editReply({ embeds: [result.embed] });
    await sendModLog(interaction.guild, result.embed);
  },
});
