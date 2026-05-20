import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
  InteractionContextType,
  SlashCommandBuilder,
  type User,
} from "discord.js";
import { BRAND_BLURPLE } from "../../lib/constants";
import { CommandCategory, defineCommand } from "../../types/command";

const AVATAR_SIZE = 1024;

const resolveAccent = (member: GuildMember | null, user: User): number => {
  if (member && member.displayColor !== 0) return member.displayColor;
  if (typeof user.accentColor === "number") return user.accentColor;
  return BRAND_BLURPLE;
};

export default defineCommand({
  category: CommandCategory.Utility,
  data: new SlashCommandBuilder()
    .setName("avatar")
    .setDescription("Display a user's avatar in high resolution.")
    .setContexts(InteractionContextType.Guild)
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to inspect (defaults to yourself).")
        .setRequired(false),
    ),
  async execute(interaction) {
    const requested = interaction.options.getUser("user") ?? interaction.user;
    const target = await requested.fetch(true);
    const resolved = interaction.options.getMember("user") ?? interaction.member;
    const member = resolved instanceof GuildMember ? resolved : null;

    const hasServerAvatar = Boolean(member?.avatar);
    const serverAvatarURL = hasServerAvatar
      ? member?.displayAvatarURL({ size: AVATAR_SIZE })
      : null;
    const globalAvatarURL = target.displayAvatarURL({ size: AVATAR_SIZE });
    const primaryURL = serverAvatarURL ?? globalAvatarURL;
    const displayName =
      member?.displayName ?? target.globalName ?? target.username;

    const descParts = [
      `# ${displayName}`,
      `\`@${target.username}\` · <@${target.id}>`,
    ];
    if (hasServerAvatar) descParts.push("-# Showing server avatar");

    const embed = new EmbedBuilder()
      .setColor(resolveAccent(member, target))
      .setDescription(descParts.join("\n"))
      .setImage(primaryURL)
      .setFooter({ text: `ID · ${target.id}` });

    const links = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel(hasServerAvatar ? "Server Avatar" : "Avatar")
        .setURL(primaryURL),
    );
    if (hasServerAvatar) {
      links.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Global Avatar")
          .setURL(globalAvatarURL),
      );
    }

    await interaction.reply({ embeds: [embed], components: [links] });
  },
});
