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

const MODAL_PREFIX = "mod-ban";

export default defineUserCommand({
  category: CommandCategory.Moderation,
  data: new ContextMenuCommandBuilder()
    .setName("Ban")
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
  async execute(interaction) {
    const target = interaction.targetUser;

    const modal = new ModalBuilder()
      .setCustomId(`${MODAL_PREFIX}:${target.id}`)
      .setTitle(`Ban ${target.username}`.slice(0, 45))
      .addLabelComponents(
        new LabelBuilder()
          .setLabel("Reason")
          .setTextInputComponent(
            new TextInputBuilder()
              .setCustomId("reason")
              .setStyle(TextInputStyle.Paragraph)
              .setRequired(false)
              .setMaxLength(512)
              .setPlaceholder("Why is this user being banned?"),
          ),
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
