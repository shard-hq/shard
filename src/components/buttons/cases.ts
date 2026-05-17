import {
  buildCasesPage,
  CASES_BUTTON_PREFIX,
  type CasesTarget,
} from "../../commands/moderation/cases";
import { defineButton } from "../../types/button";

export default defineButton({
  prefix: CASES_BUTTON_PREFIX,
  async execute(interaction) {
    if (!interaction.inGuild()) return;

    const parts = interaction.customId.split(":");
    const targetId = parts[1];
    const pageStr = parts[2];
    if (!targetId || !pageStr) return;

    const page = Number.parseInt(pageStr, 10);
    if (Number.isNaN(page)) return;

    let target: CasesTarget;
    try {
      const user = await interaction.client.users.fetch(targetId);
      target = {
        id: user.id,
        username: user.globalName ?? user.username,
        avatarUrl: user.displayAvatarURL({ size: 256 }),
      };
    } catch {
      target = { id: targetId, username: "Unknown user", avatarUrl: null };
    }

    const rendered = buildCasesPage(interaction.guildId, target, page);
    await interaction.update(rendered);
  },
});
