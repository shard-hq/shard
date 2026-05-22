import { eq } from "drizzle-orm";
import { db } from "../db";
import {
  guildSettings,
  type GuildSettings,
  type NewGuildSettings,
} from "../db/schema";

export const ensureGuildSettings = (guildId: string): void => {
  const now = Date.now();
  db.insert(guildSettings)
    .values({ guildId, createdAt: now, updatedAt: now })
    .onConflictDoNothing()
    .run();
};

export const getGuildSettings = (
  guildId: string,
): GuildSettings | undefined =>
  db
    .select()
    .from(guildSettings)
    .where(eq(guildSettings.guildId, guildId))
    .get();

export type GuildSettingsPatch = Partial<
  Omit<NewGuildSettings, "guildId" | "createdAt" | "updatedAt">
>;

export const updateGuildSettings = (
  guildId: string,
  patch: GuildSettingsPatch,
): void => {
  const now = Date.now();
  db.insert(guildSettings)
    .values({ guildId, createdAt: now, updatedAt: now, ...patch })
    .onConflictDoUpdate({
      target: guildSettings.guildId,
      set: { ...patch, updatedAt: now },
    })
    .run();
};
