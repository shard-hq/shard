import {
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { commandRegistry } from "../../lib/command-registry";
import { BRAND_BLURPLE } from "../../lib/constants";
import {
  CATEGORY_LABEL,
  CommandCategory,
  defineCommand,
  type Command,
} from "../../types/command";

export default defineCommand({
  category: CommandCategory.Utility,
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List all available commands."),
  async execute(interaction) {
    const grouped = new Map<CommandCategory, Command[]>();
    for (const cmd of commandRegistry.values()) {
      const arr = grouped.get(cmd.category) ?? [];
      arr.push(cmd);
      grouped.set(cmd.category, arr);
    }

    const embed = new EmbedBuilder()
      .setColor(BRAND_BLURPLE)
      .setTitle("Commands")
      .setDescription(`${commandRegistry.size} commands available`);

    for (const category of Object.keys(CATEGORY_LABEL) as CommandCategory[]) {
      const cmds = grouped.get(category);
      if (!cmds || cmds.length === 0) continue;
      cmds.sort((a, b) => a.data.name.localeCompare(b.data.name));
      embed.addFields({
        name: CATEGORY_LABEL[category],
        value: cmds
          .map((c) => `**/${c.data.name}** — ${c.data.description}`)
          .join("\n"),
      });
    }

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
});
