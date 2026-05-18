import type {
  ContextMenuCommandBuilder,
  UserContextMenuCommandInteraction,
} from "discord.js";
import type { CommandCategory } from "./command";

export interface UserCommand {
  data: ContextMenuCommandBuilder;
  category: CommandCategory;
  execute(
    interaction: UserContextMenuCommandInteraction,
  ): Promise<void> | void;
}

export const defineUserCommand = (command: UserCommand): UserCommand => command;
