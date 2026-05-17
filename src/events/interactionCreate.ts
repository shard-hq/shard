import { Events, MessageFlags } from "discord.js";
import { buttonRegistry } from "../lib/button-registry";
import { commandRegistry } from "../lib/command-registry";
import { logger } from "../lib/logger";
import { defineEvent } from "../types/event";

export default defineEvent({
  name: Events.InteractionCreate,
  async execute(interaction) {
    if (interaction.isButton()) {
      const [prefix] = interaction.customId.split(":");
      if (!prefix) return;
      const handler = buttonRegistry.get(prefix);
      if (!handler) {
        logger.warn(
          { customId: interaction.customId },
          "unknown button prefix",
        );
        return;
      }
      try {
        await handler.execute(interaction);
      } catch (err) {
        logger.error(
          { err, customId: interaction.customId, user: interaction.user.id },
          "button handler failed",
        );
      }
      return;
    }

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
