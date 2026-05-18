import {
  ChannelType,
  EmbedBuilder,
  InteractionContextType,
  MessageFlags,
  PermissionFlagsBits,
  SlashCommandBuilder,
  type ChatInputCommandInteraction,
} from "discord.js";
import {
  getGuildSettings,
  updateGuildSettings,
} from "../../lib/guild-settings";
import { CommandCategory, defineCommand } from "../../types/command";

const ACCENT = 0x5865f2;

const handleModlogSet = async (
  interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> => {
  const channel = interaction.options.getChannel("channel", true, [
    ChannelType.GuildText,
  ]);

  const me = interaction.guild.members.me;
  if (!me || !channel.permissionsFor(me).has(PermissionFlagsBits.SendMessages)) {
    await interaction.reply({
      content: `I can't send messages in ${channel.toString()}. Grant me **Send Messages** there first.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  updateGuildSettings(interaction.guildId, { modLogChannelId: channel.id });
  await interaction.reply({
    content: `Mod log set to ${channel.toString()}.`,
    flags: MessageFlags.Ephemeral,
  });
};

const handleModlogDisable = async (
  interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> => {
  updateGuildSettings(interaction.guildId, { modLogChannelId: null });
  await interaction.reply({
    content: "Mod log disabled.",
    flags: MessageFlags.Ephemeral,
  });
};

const handleModlogStatus = async (
  interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> => {
  const settings = getGuildSettings(interaction.guildId);
  const channelId = settings?.modLogChannelId;
  const embed = new EmbedBuilder()
    .setColor(ACCENT)
    .setTitle("Server configuration")
    .addFields({
      name: "Mod log",
      value: channelId ? `<#${channelId}>` : "*Disabled*",
    });

  await interaction.reply({
    embeds: [embed],
    flags: MessageFlags.Ephemeral,
  });
};

export default defineCommand({
  category: CommandCategory.Admin,
  data: new SlashCommandBuilder()
    .setName("config")
    .setDescription("Configure server settings.")
    .setContexts(InteractionContextType.Guild)
    .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    .addSubcommandGroup((group) =>
      group
        .setName("modlog")
        .setDescription("Moderation log channel.")
        .addSubcommand((sub) =>
          sub
            .setName("set")
            .setDescription(
              "Send moderation actions to a channel.",
            )
            .addChannelOption((opt) =>
              opt
                .setName("channel")
                .setDescription("The text channel for mod logs.")
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("disable")
            .setDescription("Stop sending moderation actions to a channel."),
        )
        .addSubcommand((sub) =>
          sub
            .setName("status")
            .setDescription("Show the current configuration."),
        ),
    ),
  async execute(interaction) {
    if (!interaction.inCachedGuild()) return;

    const group = interaction.options.getSubcommandGroup(true);
    const sub = interaction.options.getSubcommand(true);

    if (group === "modlog") {
      if (sub === "set") return handleModlogSet(interaction);
      if (sub === "disable") return handleModlogDisable(interaction);
      if (sub === "status") return handleModlogStatus(interaction);
    }
  },
});
