import path from "node:path";
import { Glob } from "bun";
import type { Client } from "discord.js";
import { logger } from "./logger";

const BADGES_DIR = path.resolve(import.meta.dir, "../assets/badges");
const cache = new Map<string, string>();

const formatMention = (name: string, id: string, animated: boolean): string =>
  animated ? `<a:${name}:${id}>` : `<:${name}:${id}>`;

export const syncBadgeEmojis = async (client: Client<true>): Promise<void> => {
  cache.clear();

  try {
    const existing = await client.application.emojis.fetch();
    for (const emoji of existing.values()) {
      if (!emoji.name) continue;
      cache.set(
        emoji.name,
        formatMention(emoji.name, emoji.id, emoji.animated),
      );
    }
  } catch (err) {
    logger.error({ err }, "failed to fetch application emojis");
    return;
  }

  const existingNames = new Set(cache.keys());
  const glob = new Glob("*.{png,gif,webp,jpg,jpeg}");
  let created = 0;

  for await (const file of glob.scan(BADGES_DIR)) {
    const name = path.basename(file, path.extname(file));
    if (existingNames.has(name)) continue;

    try {
      const absPath = path.join(BADGES_DIR, file);
      const data = Buffer.from(await Bun.file(absPath).arrayBuffer());
      const emoji = await client.application.emojis.create({
        attachment: data,
        name,
      });
      cache.set(name, formatMention(name, emoji.id, emoji.animated));
      created++;
      logger.info({ name }, "badge emoji uploaded");
    } catch (err) {
      logger.error({ err, name }, "failed to upload badge emoji");
    }
  }

  logger.info({ total: cache.size, created }, "badge emojis synced");
};

export const badgeEmoji = (name: string): string | null =>
  cache.get(name) ?? null;
