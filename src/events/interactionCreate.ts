import {
  Events,
  MessageFlags,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
  type UserContextMenuCommandInteraction,
} from "discord.js";
import { buttonRegistry } from "../lib/button-registry";
import { commandRegistry } from "../lib/command-registry";
import { logger } from "../lib/logger";
import { userCommandRegistry } from "../lib/user-command-registry";
import { defineEvent } from "../types/event";

const ERROR_PAYLOAD = {
  content: "An error occurred.",
  flags: MessageFlags.Ephemeral,
} as const;

const respondError = async (
  interaction:
    | ChatInputCommandInteraction
    | ButtonInteraction
    | UserContextMenuCommandInteraction,
): Promise<void> => {
  try {
    if (interaction.deferred || interaction.replied) {
      await interaction.followUp(ERROR_PAYLOAD);
    } else {
      await interaction.reply(ERROR_PAYLOAD);
    }
  } catch (err) {
    logger.error(
      { err, interactionId: interaction.id },
      "failed to send error response",
    );
  }
};

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
        await respondError(interaction);
      }
      return;
    }

    if (interaction.isUserContextMenuCommand()) {
      const command = userCommandRegistry.get(interaction.commandName);
      if (!command) {
        logger.warn(
          { command: interaction.commandName },
          "unknown user command",
        );
        return;
      }
      try {
        await command.execute(interaction);
      } catch (err) {
        logger.error(
          { err, command: interaction.commandName, user: interaction.user.id },
          "user command failed",
        );
        await respondError(interaction);
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
      await respondError(interaction);
    }
  },
});
