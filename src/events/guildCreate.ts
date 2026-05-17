import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ContainerBuilder,
  Events,
  MessageFlags,
  SeparatorBuilder,
  SeparatorSpacingSize,
  TextDisplayBuilder,
} from "discord.js";
import { logger } from "../lib/logger";
import { defineEvent } from "../types/event";

const REPO_URL = "https://github.com/shard-hq/shard";
const ISSUES_URL = `${REPO_URL}/issues/new/choose`;

export default defineEvent({
  name: Events.GuildCreate,
  async execute(guild) {
    let owner;
    try {
      owner = await guild.fetchOwner();
    } catch (err) {
      logger.warn(
        { err, guild: guild.id, name: guild.name },
        "joined guild, could not fetch owner",
      );
      return;
    }

    const container = new ContainerBuilder()
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          `# Hey ${owner.user.username} 👋\nThanks for adding **Shard** to **${guild.name}**!`,
        ),
      )
      .addSeparatorComponents(
        new SeparatorBuilder().setSpacing(SeparatorSpacingSize.Small),
      )
      .addTextDisplayComponents(
        new TextDisplayBuilder().setContent(
          [
            "Shard is an open-source Discord bot — no paywalls, no premium tier.",
            "Type `/` in your server to discover the available commands. First-time propagation can take a few minutes.",
            "",
            "Got an idea, a bug, or a question? Come chat with us on GitHub — every bit of feedback matters ❤️",
          ].join("\n"),
        ),
      )
      .addActionRowComponents(
        new ActionRowBuilder<ButtonBuilder>().addComponents(
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("GitHub")
            .setURL(REPO_URL),
          new ButtonBuilder()
            .setStyle(ButtonStyle.Link)
            .setLabel("Report an issue")
            .setURL(ISSUES_URL),
        ),
      );

    try {
      await owner.send({
        components: [container],
        flags: MessageFlags.IsComponentsV2,
      });
      logger.info(
        { guild: guild.id, name: guild.name, owner: owner.id },
        "joined guild, DM sent to owner",
      );
    } catch (err) {
      logger.warn(
        { err, guild: guild.id, name: guild.name, owner: owner.id },
        "joined guild, owner DMs closed",
      );
    }
  },
});
