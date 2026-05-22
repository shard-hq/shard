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
    .setName("Timeout")
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const modal = createModerationModal(
      "mod-timeout",
      "Timeout",
      interaction.targetUser,
    ).addLabelComponents(
      new LabelBuilder()
        .setLabel("Duration (e.g. 10m, 1h, 1d — max 28d)")
        .setTextInputComponent(
          new TextInputBuilder()
            .setCustomId("duration")
            .setStyle(TextInputStyle.Short)
            .setRequired(true)
            .setMaxLength(10)
            .setPlaceholder("10m"),
        ),
      createReasonLabel("Why is this user being timed out?"),
    );

    await interaction.showModal(modal);
  },
});
