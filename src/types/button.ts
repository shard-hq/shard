import type { ButtonInteraction } from "discord.js";

export interface ButtonHandler {
  prefix: string;
  execute(interaction: ButtonInteraction): Promise<void> | void;
}

export const defineButton = (handler: ButtonHandler): ButtonHandler => handler;
