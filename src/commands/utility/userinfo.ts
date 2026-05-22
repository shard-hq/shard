import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  EmbedBuilder,
  GuildMember,
  InteractionContextType,
  PermissionFlagsBits,
  SlashCommandBuilder,
  TimestampStyles,
  UserFlags,
  time,
  type User,
} from "discord.js";
import { badgeEmoji } from "../../lib/badge-emojis";
import { resolveAccent } from "../../lib/user-colors";
import { CommandCategory, defineCommand } from "../../types/command";

const MAX_ROLES_DISPLAYED = 25;
const AVATAR_SIZE = 256;
const BANNER_SIZE = 1024;

interface BadgeDef {
  flag: UserFlags;
  emojiName: string | null;
  label: string;
}

const BADGE_LABELS: readonly BadgeDef[] = [
  { flag: UserFlags.Staff, emojiName: "discordstaff", label: "Discord Staff" },
  { flag: UserFlags.Partner, emojiName: "discordpartner", label: "Partner" },
  { flag: UserFlags.CertifiedModerator, emojiName: "discordmod", label: "Moderator" },
  { flag: UserFlags.Hypesquad, emojiName: "hypesquadevents", label: "HypeSquad Events" },
  { flag: UserFlags.HypeSquadOnlineHouse1, emojiName: "hypesquadbravery", label: "House of Bravery" },
  { flag: UserFlags.HypeSquadOnlineHouse2, emojiName: "hypesquadbrilliance", label: "House of Brilliance" },
  { flag: UserFlags.HypeSquadOnlineHouse3, emojiName: "hypesquadbalance", label: "House of Balance" },
  { flag: UserFlags.BugHunterLevel1, emojiName: "discordbughunter1", label: "Bug Hunter" },
  { flag: UserFlags.BugHunterLevel2, emojiName: "discordbughunter2", label: "Bug Hunter Lv. 2" },
  { flag: UserFlags.VerifiedDeveloper, emojiName: "discordbotdev", label: "Early Bot Developer" },
  { flag: UserFlags.PremiumEarlySupporter, emojiName: "discordearlysupporter", label: "Early Supporter" },
  { flag: UserFlags.VerifiedBot, emojiName: null, label: "Verified Bot" },
];

const formatBadges = (user: User): string => {
  const flags = user.flags;
  if (!flags) return "";

  const emojis: string[] = [];
  const texts: string[] = [];
  for (const b of BADGE_LABELS) {
    if (!flags.has(b.flag)) continue;
    const emoji = b.emojiName ? badgeEmoji(b.emojiName) : null;
    if (emoji) emojis.push(emoji);
    else texts.push(b.label);
  }

  const parts: string[] = [];
  if (emojis.length > 0) parts.push(emojis.join(" "));
  if (texts.length > 0) parts.push(texts.join(", "));
  return parts.join(" · ");
};

const formatMemberStatus = (member: GuildMember): string => {
  const tags: string[] = [];
  if (member.id === member.guild.ownerId) tags.push("Server Owner");
  else if (member.permissions.has(PermissionFlagsBits.Administrator)) {
    tags.push("Administrator");
  }
  if (member.premiumSince) tags.push("Server Booster");
  return tags.join(" · ");
};

export default defineCommand({
  category: CommandCategory.Utility,
  data: new SlashCommandBuilder()
    .setName("userinfo")
    .setDescription("Display information about a user.")
    .setContexts(InteractionContextType.Guild)
    .addUserOption((opt) =>
      opt
        .setName("user")
        .setDescription("The user to inspect (defaults to yourself).")
        .setRequired(false),
    ),
  async execute(interaction) {
    await interaction.deferReply();

    const requested = interaction.options.getUser("user") ?? interaction.user;
    const target = await requested.fetch(true);
    const resolved = interaction.options.getMember("user") ?? interaction.member;
    const member = resolved instanceof GuildMember ? resolved : null;

    const displayName =
      member?.displayName ?? target.globalName ?? target.username;
    const avatarURL = (member ?? target).displayAvatarURL({ size: AVATAR_SIZE });
    const bannerURL = target.bannerURL({ size: BANNER_SIZE });
    const badges = formatBadges(target);

    const customRoles = member
      ? [...member.roles.cache.values()]
          .filter((r) => r.id !== member.guild.id)
          .sort((a, b) => b.position - a.position)
      : [];

    const descParts: string[] = [
      `# ${displayName}`,
      `\`@${target.username}\` · <@${target.id}>`,
    ];
    const typeTags: string[] = [];
    if (target.bot) typeTags.push("Bot");
    if (target.system) typeTags.push("System");
    if (typeTags.length > 0) descParts.push(`-# ${typeTags.join(" · ")}`);
    const status = member ? formatMemberStatus(member) : "";
    if (status) descParts.push(status);

    const embed = new EmbedBuilder()
      .setColor(resolveAccent(member, target))
      .setThumbnail(avatarURL)
      .setDescription(descParts.join("\n"))
      .setFooter({ text: `ID · ${target.id}` });

    embed.addFields({
      name: "📅 Account Created",
      value: `${time(target.createdAt, TimestampStyles.LongDate)}\n${time(target.createdAt, TimestampStyles.RelativeTime)}`,
      inline: true,
    });

    if (member?.joinedAt) {
      embed.addFields({
        name: "📥 Joined Server",
        value: `${time(member.joinedAt, TimestampStyles.LongDate)}\n${time(member.joinedAt, TimestampStyles.RelativeTime)}`,
        inline: true,
      });
    }

    const highest = customRoles[0];
    if (highest) {
      embed.addFields({
        name: "🥇 Highest Role",
        value: `<@&${highest.id}>`,
        inline: true,
      });
    }

    if (member?.premiumSince) {
      embed.addFields({
        name: "💎 Boosting Since",
        value: `${time(member.premiumSince, TimestampStyles.LongDate)}\n${time(member.premiumSince, TimestampStyles.RelativeTime)}`,
        inline: true,
      });
    }

    const timeoutUntil = member?.communicationDisabledUntil;
    if (timeoutUntil && timeoutUntil > new Date()) {
      embed.addFields({
        name: "⏸️ Timed Out Until",
        value: time(timeoutUntil, TimestampStyles.FullDateShortTime),
        inline: true,
      });
    }

    if (customRoles.length > 0) {
      const shown = customRoles
        .slice(0, MAX_ROLES_DISPLAYED)
        .map((r) => `<@&${r.id}>`)
        .join(" ");
      const overflow =
        customRoles.length > MAX_ROLES_DISPLAYED
          ? ` *(+${customRoles.length - MAX_ROLES_DISPLAYED} more)*`
          : "";
      embed.addFields({
        name: "🎭 Roles",
        value: `${customRoles.length} total\n${shown}${overflow}`,
      });
    }

    if (badges) {
      embed.addFields({ name: "🏅 Badges", value: badges });
    }

    const linkRow = new ActionRowBuilder<ButtonBuilder>().addComponents(
      new ButtonBuilder()
        .setStyle(ButtonStyle.Link)
        .setLabel("Avatar")
        .setURL(avatarURL),
    );
    if (bannerURL) {
      linkRow.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Banner")
          .setURL(bannerURL),
      );
    }

    await interaction.editReply({
      embeds: [embed],
      components: [linkRow],
    });
  },
});
