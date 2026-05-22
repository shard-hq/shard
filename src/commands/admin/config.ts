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
  addAutorole,
  listAutoroles,
  removeAutorole,
} from "../../lib/autoroles";
import { BRAND_BLURPLE } from "../../lib/constants";
import {
  getGuildSettings,
  updateGuildSettings,
} from "../../lib/guild-settings";
import { CommandCategory, defineCommand } from "../../types/command";

const handleModlogSet = async (
  interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> => {
  const channel = interaction.options.getChannel("channel", true, [
    ChannelType.GuildText,
  ]);

  const me = interaction.guild.members.me;
  const botPerms = me ? channel.permissionsFor(me) : null;
  if (!botPerms?.has(PermissionFlagsBits.SendMessages)) {
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
    .setColor(BRAND_BLURPLE)
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

const handleAutoroleAdd = async (
  interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> => {
  const role = interaction.options.getRole("role", true);

  if (role.id === interaction.guild.id) {
    await interaction.reply({
      content: "Can't use @everyone as an autorole.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  if (role.managed) {
    await interaction.reply({
      content: "Can't use a managed role (bot, integration, or booster role).",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const me = interaction.guild.members.me;
  if (!me?.permissions.has(PermissionFlagsBits.ManageRoles)) {
    await interaction.reply({
      content: "I need **Manage Roles** to assign roles.",
      flags: MessageFlags.Ephemeral,
    });
    return;
  }
  if (role.position >= me.roles.highest.position) {
    await interaction.reply({
      content: `I can't assign ${role.toString()} — it's at or above my highest role.`,
      flags: MessageFlags.Ephemeral,
    });
    return;
  }

  const added = addAutorole(interaction.guildId, role.id);
  await interaction.reply({
    content: added
      ? `Added ${role.toString()} to autoroles.`
      : `${role.toString()} is already an autorole.`,
    flags: MessageFlags.Ephemeral,
  });
};

const handleAutoroleRemove = async (
  interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> => {
  const role = interaction.options.getRole("role", true);
  const removed = removeAutorole(interaction.guildId, role.id);
  await interaction.reply({
    content: removed
      ? `Removed ${role.toString()} from autoroles.`
      : `${role.toString()} wasn't an autorole.`,
    flags: MessageFlags.Ephemeral,
  });
};

const handleAutoroleList = async (
  interaction: ChatInputCommandInteraction<"cached">,
): Promise<void> => {
  const roleIds = listAutoroles(interaction.guildId);
  const embed = new EmbedBuilder()
    .setColor(BRAND_BLURPLE)
    .setTitle("Autoroles")
    .setDescription(
      roleIds.length === 0
        ? "*No autoroles configured.*"
        : roleIds.map((id) => `<@&${id}>`).join("\n"),
    );

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
            .setDescription("Send moderation actions to a channel.")
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
    )
    .addSubcommandGroup((group) =>
      group
        .setName("autorole")
        .setDescription("Roles assigned to new members on join.")
        .addSubcommand((sub) =>
          sub
            .setName("add")
            .setDescription("Add a role to assign on join.")
            .addRoleOption((opt) =>
              opt
                .setName("role")
                .setDescription("The role to assign.")
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("remove")
            .setDescription("Stop assigning a role on join.")
            .addRoleOption((opt) =>
              opt
                .setName("role")
                .setDescription("The role to stop assigning.")
                .setRequired(true),
            ),
        )
        .addSubcommand((sub) =>
          sub
            .setName("list")
            .setDescription("List all roles assigned on join."),
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

    if (group === "autorole") {
      if (sub === "add") return handleAutoroleAdd(interaction);
      if (sub === "remove") return handleAutoroleRemove(interaction);
      if (sub === "list") return handleAutoroleList(interaction);
    }
  },
});
