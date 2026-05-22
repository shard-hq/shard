import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  InteractionContextType,
  LabelBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
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
    .setName("Ban")
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const modal = createModerationModal(
      "mod-ban",
      "Ban",
      interaction.targetUser,
    ).addLabelComponents(
      createReasonLabel("Why is this user being banned?"),
      new LabelBuilder()
        .setLabel("Delete messages from the last N days (0–7)")
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("delete_days")
            .setStyle(TextInputStyle.Short)
            .setRequired(false)
            .setMaxLength(1)
            .setPlaceholder("0"),
        ),
    );

    await interaction.showModal(modal);
  },
});
