import type {
  ChatInputCommandInteraction,
  SlashCommandBuilder,
  SlashCommandOptionsOnlyBuilder,
  SlashCommandSubcommandsOnlyBuilder,
} from "discord.js";

export const CommandCategory = {
  Utility: "utility",
  Moderation: "moderation",
  Admin: "admin",
} as const;
export type CommandCategory =
  (typeof CommandCategory)[keyof typeof CommandCategory];

export const CATEGORY_LABEL: Record<CommandCategory, string> = {
  utility: "Utility",
  moderation: "Moderation",
  admin: "Admin",
};

export const isCommandCategory = (value: unknown): value is CommandCategory =>
  typeof value === "string" && value in CATEGORY_LABEL;

export type CommandData =
  | SlashCommandBuilder
  | SlashCommandOptionsOnlyBuilder
  | SlashCommandSubcommandsOnlyBuilder;

export interface Command {
  data: CommandData;
  category: CommandCategory;
  execute(interaction: ChatInputCommandInteraction): Promise<void> | void;
}

export const defineCommand = (command: Command): Command => command;
