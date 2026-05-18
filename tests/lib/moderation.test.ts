import { describe, expect, test } from "bun:test";
import type {
  ChatInputCommandInteraction,
  GuildMember,
  User,
} from "discord.js";
import {
  buildModerationEmbed,
  checkGuards,
  formatDuration,
} from "../../src/lib/moderation";

const mockUser = (id: string, username = "user"): User =>
  ({ id, username }) as unknown as User;

const mockMember = (rolePosition: number): GuildMember =>
  ({ roles: { highest: { position: rolePosition } } }) as unknown as GuildMember;

interface InteractionOpts {
  invokerId?: string;
  botId?: string;
  ownerId?: string;
  invokerRolePosition?: number;
  botRolePosition?: number | null;
}

const mockInteraction = (
  opts: InteractionOpts = {},
): ChatInputCommandInteraction<"cached"> => {
  const botRolePosition = opts.botRolePosition;
  return {
    user: { id: opts.invokerId ?? "INVOKER" },
    client: { user: { id: opts.botId ?? "BOT" } },
    guild: {
      ownerId: opts.ownerId ?? "OWNER",
      members: {
        me:
          botRolePosition === null
            ? null
            : {
                roles: {
                  highest: { position: botRolePosition ?? 100 },
                },
              },
      },
    },
    member: {
      roles: { highest: { position: opts.invokerRolePosition ?? 50 } },
    },
  } as unknown as ChatInputCommandInteraction<"cached">;
};

describe("formatDuration", () => {
  test("renders seconds under one minute", () => {
    expect(formatDuration(0)).toBe("0s");
    expect(formatDuration(30_000)).toBe("30s");
    expect(formatDuration(59_999)).toBe("59s");
  });

  test("never rounds up across thresholds (90s used to render '2m')", () => {
    expect(formatDuration(60_000)).toBe("1m");
    expect(formatDuration(89_999)).toBe("1m");
    expect(formatDuration(90_000)).toBe("1m");
    expect(formatDuration(119_999)).toBe("1m");
  });

  test("crosses minute, hour, and day thresholds", () => {
    expect(formatDuration(60 * 60_000)).toBe("1h");
    expect(formatDuration(23 * 60 * 60_000)).toBe("23h");
    expect(formatDuration(24 * 60 * 60_000)).toBe("1d");
    expect(formatDuration(7 * 24 * 60 * 60_000)).toBe("7d");
    expect(formatDuration(28 * 24 * 60 * 60_000)).toBe("28d");
  });
});

describe("buildModerationEmbed", () => {
  const target = mockUser("123", "alice");

  test("uses TYPE_META emoji, verb, and color", () => {
    const json = buildModerationEmbed({
      type: "ban",
      target,
      reason: "spam",
      caseId: 42,
    }).toJSON();
    expect(json.title).toBe("🔨 Banned alice");
    expect(json.color).toBe(0xed4245);
    expect(json.description).toBe("**Reason:** spam");
    expect(json.footer?.text).toBe("Case #42");
  });

  test("renders fallback description when reason is null", () => {
    const json = buildModerationEmbed({
      type: "warn",
      target,
      reason: null,
      caseId: 1,
    }).toJSON();
    expect(json.description).toBe("*No reason provided.*");
  });

  test("appends titleExtra to the title", () => {
    const json = buildModerationEmbed({
      type: "timeout",
      target,
      reason: null,
      caseId: 7,
      titleExtra: " (5m)",
    }).toJSON();
    expect(json.title).toBe("🔇 Timed out alice (5m)");
  });

  test("appends dmNote to the footer", () => {
    const json = buildModerationEmbed({
      type: "kick",
      target,
      reason: null,
      caseId: 3,
      dmNote: " · DM not delivered",
    }).toJSON();
    expect(json.footer?.text).toBe("Case #3 · DM not delivered");
  });

  test("untimeout uses the 'Removed timeout from' verb", () => {
    const json = buildModerationEmbed({
      type: "untimeout",
      target,
      reason: null,
      caseId: 9,
    }).toJSON();
    expect(json.title).toBe("🔊 Removed timeout from alice");
  });

  test("adds a moderator field when provided", () => {
    const moderator = mockUser("999", "bob");
    const json = buildModerationEmbed({
      type: "warn",
      target,
      moderator,
      reason: null,
      caseId: 5,
    }).toJSON();
    const field = json.fields?.[0];
    expect(field?.name).toBe("Moderator");
    expect(field?.value).toBe("<@999>");
    expect(field?.inline).toBe(true);
  });

  test("omits the moderator field when not provided", () => {
    const json = buildModerationEmbed({
      type: "warn",
      target,
      reason: null,
      caseId: 5,
    }).toJSON();
    expect(json.fields ?? []).toHaveLength(0);
  });
});

describe("checkGuards", () => {
  const TARGET = mockUser("TARGET");

  test("blocks self-moderation", () => {
    const interaction = mockInteraction({ invokerId: "TARGET" });
    expect(
      checkGuards(interaction, TARGET, null, { requireBotHierarchy: false }),
    ).toBe("You can't moderate yourself.");
  });

  test("blocks moderating the bot", () => {
    const interaction = mockInteraction({ botId: "TARGET" });
    expect(
      checkGuards(interaction, TARGET, null, { requireBotHierarchy: false }),
    ).toBe("I can't moderate myself.");
  });

  test("blocks moderating the server owner", () => {
    const interaction = mockInteraction({ ownerId: "TARGET" });
    expect(
      checkGuards(interaction, TARGET, null, { requireBotHierarchy: false }),
    ).toBe("I can't moderate the server owner.");
  });

  test("returns null when target has no member (left the server)", () => {
    const interaction = mockInteraction();
    expect(
      checkGuards(interaction, TARGET, null, { requireBotHierarchy: false }),
    ).toBeNull();
  });

  test("blocks invoker with equal or lower role than target", () => {
    const interaction = mockInteraction({ invokerRolePosition: 5 });
    expect(
      checkGuards(interaction, TARGET, mockMember(5), {
        requireBotHierarchy: false,
      }),
    ).toBe("You can't moderate someone with an equal or higher role than you.");
    expect(
      checkGuards(interaction, TARGET, mockMember(10), {
        requireBotHierarchy: false,
      }),
    ).toBe("You can't moderate someone with an equal or higher role than you.");
  });

  test("server owner bypasses role hierarchy", () => {
    const interaction = mockInteraction({
      invokerId: "OWNER",
      ownerId: "OWNER",
      invokerRolePosition: 1,
    });
    expect(
      checkGuards(interaction, TARGET, mockMember(99), {
        requireBotHierarchy: false,
      }),
    ).toBeNull();
  });

  test("blocks when bot lacks hierarchy and requireBotHierarchy is true", () => {
    const interaction = mockInteraction({
      invokerRolePosition: 100,
      botRolePosition: 5,
    });
    expect(
      checkGuards(interaction, TARGET, mockMember(10), {
        requireBotHierarchy: true,
      }),
    ).toBe("I can't moderate someone with an equal or higher role than me.");
  });

  test("returns error when bot member is missing", () => {
    const interaction = mockInteraction({ botRolePosition: null });
    expect(
      checkGuards(interaction, TARGET, mockMember(5), {
        requireBotHierarchy: true,
      }),
    ).toBe("I can't determine my own role in this server.");
  });

  test("passes when invoker and bot both outrank the target", () => {
    const interaction = mockInteraction({
      invokerRolePosition: 50,
      botRolePosition: 100,
    });
    expect(
      checkGuards(interaction, TARGET, mockMember(10), {
        requireBotHierarchy: true,
      }),
    ).toBeNull();
  });
});
