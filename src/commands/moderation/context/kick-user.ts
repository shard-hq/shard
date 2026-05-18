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

const MODAL_PREFIX = "mod-kick";

export default defineUserCommand({
  category: CommandCategory.Moderation,
  data: new ContextMenuCommandBuilder()
    .setName("Kick")
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
  async execute(interaction) {
    const target = interaction.targetUser;

    const modal = new ModalBuilder()
      .setCustomId(`${MODAL_PREFIX}:${target.id}`)
      .setTitle(`Kick ${target.username}`.slice(0, 45))
      .addLabelComponents(
        new LabelBuilder()
          .setLabel("Reason")
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("reason")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
              .setMaxLength(512)
              .setPlaceholder("Why is this user being kicked?"),
          ),
      );

    await interaction.showModal(modal);
  },
});
