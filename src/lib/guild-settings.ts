import { db } from "../db";
import { guildSettings } from "../db/schema";

export const ensureGuildSettings = (guildId: string): void => {
  const now = Date.now();
  db.insert(guildSettings)
    .values({ guildId, createdAt: now, updatedAt: now })
    .onConflictDoNothing()
    .run();
};
