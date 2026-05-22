import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  InteractionContextType,
  PermissionFlagsBits,
} from "discord.js";
import {
  createModerationModal,
  createReasonLabel,
} from "../../../lib/mod-modals";
import { CommandCategory } from "../../../types/command";
import { defineUserCommand } from "../../../types/user-command";

export default defineUserCommand({
  category: CommandCategory.Moderation,
  data: new ContextMenuCommandBuilder()
    .setName("Kick")
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const modal = createModerationModal(
      "mod-kick",
      "Kick",
      interaction.targetUser,
    ).addLabelComponents(createReasonLabel("Why is this user being kicked?"));

    await interaction.showModal(modal);
  },
});
