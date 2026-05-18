import { MessageFlags, SlashCommandBuilder } from "discord.js";
import { CommandCategory, defineCommand } from "../../types/command";

export default defineCommand({
  category: CommandCategory.Utility,
  data: new SlashCommandBuilder()
    .setName("ping")
    .setDescription("Replies with pong and the WebSocket latency."),
  async execute(interaction) {
    const ping = Math.round(interaction.client.ws.ping);
    await interaction.reply({
      content: `Pong! \`${ping}ms\``,
      flags: MessageFlags.Ephemeral,
    });
  },
});
