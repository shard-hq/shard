import type { ModalSubmitInteraction } from "discord.js";

export interface ModalHandler {
  prefix: string;
  execute(interaction: ModalSubmitInteraction): Promise<void> | void;
}

export const defineModal = (handler: ModalHandler): ModalHandler => handler;
