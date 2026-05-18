import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  InteractionContextType,
  LabelBuilder,
  ModalBuilder,
  PermissionFlagsBits,
  TextInputBuilder,
  TextInputStyle,
} from "discord.js";
import { CommandCategory } from "../../../types/command";
import { defineUserCommand } from "../../../types/user-command";

const MODAL_PREFIX = "mod-timeout";

export default defineUserCommand({
  category: CommandCategory.Moderation,
  data: new ContextMenuCommandBuilder()
    .setName("Timeout")
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    const target = interaction.targetUser;

    const modal = new ModalBuilder()
      .setCustomId(`${MODAL_PREFIX}:${target.id}`)
      .setTitle(`Timeout ${target.username}`.slice(0, 45))
      .addLabelComponents(
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
        new LabelBuilder()
          .setLabel("Reason")
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("reason")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
              .setMaxLength(512)
              .setPlaceholder("Why is this user being timed out?"),
          ),
      );

    await interaction.showModal(modal);
  },
});
