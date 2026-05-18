import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ChannelType,
  EmbedBuilder,
  GuildExplicitContentFilter,
  GuildFeature,
  GuildMFALevel,
  GuildPremiumTier,
  GuildVerificationLevel,
  InteractionContextType,
  MessageFlags,
  SlashCommandBuilder,
  TimestampStyles,
  time,
  type Guild,
} from "discord.js";
import { CommandCategory, defineCommand } from "../../types/command";

const ICON_SIZE = 256;
const BANNER_SIZE = 1024;
const SPLASH_SIZE = 1024;

const BOOST_TIER_ACCENTS: Record<GuildPremiumTier, number> = {
  [GuildPremiumTier.None]: 0x5865f2,
  [GuildPremiumTier.Tier1]: 0xf47fff,
  [GuildPremiumTier.Tier2]: 0xff73fa,
  [GuildPremiumTier.Tier3]: 0xff0099,
};

const VERIFICATION_LABELS: Record<GuildVerificationLevel, string> = {
  [GuildVerificationLevel.None]: "None",
  [GuildVerificationLevel.Low]: "Low",
  [GuildVerificationLevel.Medium]: "Medium",
  [GuildVerificationLevel.High]: "High",
  [GuildVerificationLevel.VeryHigh]: "Very High",
};

const EXPLICIT_FILTER_LABELS: Record<GuildExplicitContentFilter, string> = {
  [GuildExplicitContentFilter.Disabled]: "Disabled",
  [GuildExplicitContentFilter.MembersWithoutRoles]: "Members w/o roles",
  [GuildExplicitContentFilter.AllMembers]: "All members",
};

const FEATURE_LABELS: Partial<Record<GuildFeature, string>> = {
  COMMUNITY: "Community",
  PARTNERED: "Partnered",
  VERIFIED: "Verified",
  DISCOVERABLE: "Discoverable",
  FEATURABLE: "Featurable",
  BANNER: "Banner",
  ANIMATED_BANNER: "Animated Banner",
  ANIMATED_ICON: "Animated Icon",
  VANITY_URL: "Vanity URL",
  INVITE_SPLASH: "Invite Splash",
  WELCOME_SCREEN_ENABLED: "Welcome Screen",
  MEMBER_VERIFICATION_GATE_ENABLED: "Verification Gate",
  AUTO_MODERATION: "AutoMod",
  ROLE_ICONS: "Role Icons",
  SOUNDBOARD: "Soundboard",
  NEWS: "News Channels",
};

const formatFeatures = (guild: Guild): string =>
  guild.features
    .map((f) => FEATURE_LABELS[f])
    .filter((l): l is string => Boolean(l))
    .join(" · ");

const formatChannels = (guild: Guild): string => {
  const c = guild.channels.cache;
  const counts = [
    { n: c.filter((ch) => ch.type === ChannelType.GuildText).size, label: "text" },
    { n: c.filter((ch) => ch.type === ChannelType.GuildVoice).size, label: "voice" },
    { n: c.filter((ch) => ch.type === ChannelType.GuildStageVoice).size, label: "stage" },
    { n: c.filter((ch) => ch.type === ChannelType.GuildForum).size, label: "forum" },
    { n: c.filter((ch) => ch.type === ChannelType.GuildAnnouncement).size, label: "news" },
    { n: c.filter((ch) => ch.type === ChannelType.GuildCategory).size, label: "categories" },
  ];
  const value = counts
    .filter((x) => x.n > 0)
    .map((x) => `${x.n} ${x.label}`)
    .join("\n");
  return value || "—";
};

const formatBoostTier = (guild: Guild): string => {
  const tier =
    guild.premiumTier === GuildPremiumTier.None
      ? "None"
      : `Tier ${guild.premiumTier}`;
  return `${tier}\n${guild.premiumSubscriptionCount ?? 0} boosts`;
};

const formatEmojis = (guild: Guild): string => {
  const animated = guild.emojis.cache.filter((e) => e.animated === true).size;
  const staticCount = guild.emojis.cache.size - animated;
  return `${staticCount} static\n${animated} animated`;
};

export default defineCommand({
  category: CommandCategory.Utility,
  data: new SlashCommandBuilder()
    .setName("serverinfo")
    .setDescription("Display information about this server.")
    .setContexts(InteractionContextType.Guild),
  async execute(interaction) {
    const { guild } = interaction;
    if (!guild) {
      await interaction.reply({
        content: "This command can only be used in a server.",
        flags: MessageFlags.Ephemeral,
      });
      return;
    }

    const [ownerMention, fetched] = await Promise.all([
      guild
        .fetchOwner()
        .then((o) => `<@${o.id}>`)
        .catch(() => "Unknown"),
      guild.client.guilds
        .fetch({ guild: guild.id, withCounts: true })
        .catch(() => null),
    ]);

    const iconURL = guild.iconURL({ size: ICON_SIZE });
    const bannerURL = guild.bannerURL({ size: BANNER_SIZE });
    const splashURL = guild.splashURL({ size: SPLASH_SIZE });
    const channels = formatChannels(guild);
    const features = formatFeatures(guild);

    const onlineCount = fetched?.approximatePresenceCount;
    const onlineValue =
      typeof onlineCount === "number"
        ? `~${onlineCount.toLocaleString("en-US")}`
        : "—";

    const memberCapValue = guild.maximumMembers
      ? guild.maximumMembers.toLocaleString("en-US")
      : "Unlimited";

    const afkValue = guild.afkChannel
      ? `${guild.afkChannel.toString()}\n${Math.floor(guild.afkTimeout / 60)} min`
      : "None";

    const systemValue = guild.systemChannel
      ? guild.systemChannel.toString()
      : "None";

    const descParts: string[] = [`# ${guild.name}`];
    if (guild.description) descParts.push(guild.description);
    if (guild.vanityURLCode) {
      descParts.push(`**Invite** · \`discord.gg/${guild.vanityURLCode}\``);
    }

    const embed = new EmbedBuilder()
      .setColor(BOOST_TIER_ACCENTS[guild.premiumTier])
      .setFooter({ text: `ID · ${guild.id}` })
      .addFields(
        { name: "👑 Owner", value: ownerMention, inline: true },
        {
          name: "📅 Created",
          value: `${time(guild.createdAt, TimestampStyles.LongDate)}\n${time(guild.createdAt, TimestampStyles.RelativeTime)}`,
          inline: true,
        },
        {
          name: "➕ Bot Joined",
          value: `${time(guild.joinedAt, TimestampStyles.LongDate)}\n${time(guild.joinedAt, TimestampStyles.RelativeTime)}`,
          inline: true,
        },
        {
          name: "👥 Members",
          value: guild.memberCount.toLocaleString("en-US"),
          inline: true,
        },
        { name: "📶 Online", value: onlineValue, inline: true },
        { name: "🎯 Member Cap", value: memberCapValue, inline: true },
        { name: "💬 Channels", value: channels, inline: true },
        { name: "🎭 Roles", value: `${guild.roles.cache.size}`, inline: true },
        {
          name: "🎫 Events",
          value: `${guild.scheduledEvents.cache.size}`,
          inline: true,
        },
        { name: "😀 Emojis", value: formatEmojis(guild), inline: true },
        {
          name: "🏷️ Stickers",
          value: `${guild.stickers.cache.size}`,
          inline: true,
        },
        { name: "🚀 Boost", value: formatBoostTier(guild), inline: true },
        { name: "💤 AFK", value: afkValue, inline: true },
        { name: "📨 System Channel", value: systemValue, inline: true },
        { name: "🌐 Locale", value: `\`${guild.preferredLocale}\``, inline: true },
        {
          name: "🔐 Verification",
          value: VERIFICATION_LABELS[guild.verificationLevel],
          inline: true,
        },
        {
          name: "🚫 Content Filter",
          value: EXPLICIT_FILTER_LABELS[guild.explicitContentFilter],
          inline: true,
        },
        {
          name: "🔑 2FA for Mods",
          value:
            guild.mfaLevel === GuildMFALevel.Elevated
              ? "Required"
              : "Not required",
          inline: true,
        },
      );

    embed.setDescription(descParts.join("\n"));
    if (iconURL) embed.setThumbnail(iconURL);

    if (guild.features.includes(GuildFeature.Community)) {
      const communityLines = [
        `📋 **Rules** · ${guild.rulesChannel?.toString() ?? "Not set"}`,
        `🛠️ **Mod Updates** · ${guild.publicUpdatesChannel?.toString() ?? "Not set"}`,
        `🚨 **Safety Alerts** · ${guild.safetyAlertsChannel?.toString() ?? "Not set"}`,
      ];
      embed.addFields({
        name: "🏛️ Community Channels",
        value: communityLines.join("\n"),
      });
    }

    if (features) embed.addFields({ name: "✨ Features", value: features });

    const linkRow = new ActionRowBuilder<ButtonBuilder>();
    if (iconURL) {
      linkRow.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Icon")
          .setURL(iconURL),
      );
    }
    if (bannerURL) {
      linkRow.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Banner")
          .setURL(bannerURL),
      );
    }
    if (splashURL) {
      linkRow.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Splash")
          .setURL(splashURL),
      );
    }
    if (guild.vanityURLCode) {
      linkRow.addComponents(
        new ButtonBuilder()
          .setStyle(ButtonStyle.Link)
          .setLabel("Invite")
          .setURL(`https://discord.gg/${guild.vanityURLCode}`),
      );
    }

    await interaction.reply({
      embeds: [embed],
      components: linkRow.components.length > 0 ? [linkRow] : [],
    });
  },
});
