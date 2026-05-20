import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const CASE_TYPES = [
  "warn",
  "timeout",
  "kick",
  "ban",
  "unban",
  "untimeout",
] as const;
export type CaseType = (typeof CASE_TYPES)[number];

export const cases = sqliteTable(
  "cases",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    guildId: text("guild_id").notNull(),
    userId: text("user_id").notNull(),
    moderatorId: text("moderator_id").notNull(),
    type: text("type", { enum: CASE_TYPES }).notNull(),
    reason: text("reason"),
    durationMs: integer("duration_ms"),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [index("cases_guild_user_idx").on(t.guildId, t.userId)],
);

export type Case = typeof cases.$inferSelect;
export type NewCase = typeof cases.$inferInsert;

export const guildSettings = sqliteTable("guild_settings", {
  guildId: text("guild_id").primaryKey(),
  modLogChannelId: text("mod_log_channel_id"),
  createdAt: integer("created_at").notNull(),
  updatedAt: integer("updated_at").notNull(),
});

export type GuildSettings = typeof guildSettings.$inferSelect;
export type NewGuildSettings = typeof guildSettings.$inferInsert;

export const guildAutoroles = sqliteTable(
  "guild_autoroles",
  {
    guildId: text("guild_id").notNull(),
    roleId: text("role_id").notNull(),
    createdAt: integer("created_at").notNull(),
  },
  (t) => [primaryKey({ columns: [t.guildId, t.roleId] })],
);

export type GuildAutorole = typeof guildAutoroles.$inferSelect;
export type NewGuildAutorole = typeof guildAutoroles.$inferInsert;
