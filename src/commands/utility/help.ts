import {
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder,
} from "discord.js";
import { commandRegistry } from "../../lib/command-registry";
import { defineCommand } from "../../types/command";

const ACCENT = 0x5865f2;

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("help")
    .setDescription("List all available commands."),
  async execute(interaction) {
    const commands = [...commandRegistry.values()].sort((a, b) =>
      a.data.name.localeCompare(b.data.name),
    );

    const embed = new EmbedBuilder()
      .setColor(ACCENT)
      .setTitle("Commands")
      .setDescription(`${commands.length} commands available`)
      .addFields(
        commands.map((c) => ({
          name: `/${c.data.name}`,
          value: c.data.description,
        })),
      );

    await interaction.reply({
      embeds: [embed],
      flags: MessageFlags.Ephemeral,
    });
  },
});
