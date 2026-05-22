import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { like } from "drizzle-orm";
import { db } from "../../src/db";
import { runMigrations } from "../../src/db/migrate";
import { guildSettings } from "../../src/db/schema";
import {
  ensureGuildSettings,
  getGuildSettings,
  updateGuildSettings,
} from "../../src/lib/guild-settings";

const GUILD_PREFIX = "test-settings-";
const guildId = (n: number): string => `${GUILD_PREFIX}${n}`;

beforeAll(() => {
  runMigrations();
});

beforeEach(() => {
  db.delete(guildSettings).where(like(guildSettings.guildId, `${GUILD_PREFIX}%`)).run();
});

describe("ensureGuildSettings", () => {
  test("creates a row for a new guild", () => {
    ensureGuildSettings(guildId(1));
    const row = getGuildSettings(guildId(1));
    expect(row).toBeDefined();
    expect(row?.modLogChannelId).toBeNull();
  });

  test("is idempotent — calling it twice doesn't reset createdAt", () => {
    ensureGuildSettings(guildId(2));
    const initial = getGuildSettings(guildId(2));
    ensureGuildSettings(guildId(2));
    const after = getGuildSettings(guildId(2));
    expect(after?.createdAt).toBe(initial?.createdAt);
  });
});

describe("getGuildSettings", () => {
  test("returns undefined for an unknown guild", () => {
    expect(getGuildSettings(guildId(3))).toBeUndefined();
  });

  test("returns the stored settings", () => {
    ensureGuildSettings(guildId(4));
    updateGuildSettings(guildId(4), { modLogChannelId: "channel-1" });
    expect(getGuildSettings(guildId(4))?.modLogChannelId).toBe("channel-1");
  });
});

describe("updateGuildSettings", () => {
  test("upserts a row when the guild has no settings yet", () => {
    updateGuildSettings(guildId(5), { modLogChannelId: "channel-x" });
    expect(getGuildSettings(guildId(5))?.modLogChannelId).toBe("channel-x");
  });

  test("updates the value when the guild already has settings", () => {
    updateGuildSettings(guildId(6), { modLogChannelId: "channel-a" });
    updateGuildSettings(guildId(6), { modLogChannelId: "channel-b" });
    expect(getGuildSettings(guildId(6))?.modLogChannelId).toBe("channel-b");
  });

  test("supports nullifying a previously set channel", () => {
    updateGuildSettings(guildId(7), { modLogChannelId: "channel-c" });
    updateGuildSettings(guildId(7), { modLogChannelId: null });
    expect(getGuildSettings(guildId(7))?.modLogChannelId).toBeNull();
  });

  test("preserves createdAt across updates", () => {
    updateGuildSettings(guildId(8), { modLogChannelId: "channel-1" });
    const initial = getGuildSettings(guildId(8));
    updateGuildSettings(guildId(8), { modLogChannelId: "channel-2" });
    const after = getGuildSettings(guildId(8));
    expect(after?.createdAt).toBe(initial?.createdAt);
  });

  test("bumps updatedAt on each call", async () => {
    updateGuildSettings(guildId(9), { modLogChannelId: "channel-1" });
    const initial = getGuildSettings(guildId(9));
    await Bun.sleep(2);
    updateGuildSettings(guildId(9), { modLogChannelId: "channel-2" });
    const after = getGuildSettings(guildId(9));
    expect(after?.updatedAt).toBeGreaterThan(initial?.updatedAt ?? 0);
  });
});
