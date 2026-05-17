import { Events, MessageFlags } from "discord.js";
import { commandRegistry } from "../lib/command-registry";
import { logger } from "../lib/logger";
import { defineEvent } from "../types/event";

export default defineEvent({
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (!interaction.isChatInputCommand()) return;

    const command = commandRegistry.get(interaction.commandName);
    if (!command) {
      logger.warn({ command: interaction.commandName }, "unknown command");
      return;
    }

    try {
      await command.execute(interaction);
    } catch (err) {
      logger.error(
        { err, command: interaction.commandName, user: interaction.user.id },
        "command failed",
      );
      if (interaction.deferred || interaction.replied) {
        await interaction.followUp({
          content: "An error occurred.",
          flags: MessageFlags.Ephemeral,
        });
      } else {
        await interaction.reply({
          content: "An error occurred.",
          flags: MessageFlags.Ephemeral,
        });
      }
    }
  },
});
