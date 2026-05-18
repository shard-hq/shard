import {
  ApplicationCommandType,
  ContextMenuCommandBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
} from "discord.js";
import { CommandCategory } from "../../../types/command";
import { defineUserCommand } from "../../../types/user-command";
import { buildCasesPage } from "../cases";

export default defineUserCommand({
  category: CommandCategory.Moderation,
  data: new ContextMenuCommandBuilder()
    .setName("View Cases")
    .setType(ApplicationCommandType.User)
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
  async execute(interaction) {
    if (!interaction.inGuild()) return;

    const target = interaction.targetUser;
    const rendered = buildCasesPage(
      interaction.guildId,
      {
        id: target.id,
        username: target.globalName ?? target.username,
        avatarUrl: target.displayAvatarURL({ size: 256 }),
      },
      0,
    );

    await interaction.reply({
      ...rendered,
      flags: MessageFlags.Ephemeral,
    });
  },
});
