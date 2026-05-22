import { describe, expect, test } from "bun:test";
import type { GuildMember, User } from "discord.js";
import { BRAND_BLURPLE } from "../../src/lib/constants";
import { resolveAccent } from "../../src/lib/user-colors";

const mockUser = (accentColor: number | null | undefined): User =>
  ({ accentColor }) as unknown as User;

const mockMember = (displayColor: number): GuildMember =>
  ({ displayColor }) as unknown as GuildMember;

describe("resolveAccent", () => {
  test("prefers a non-zero member display color", () => {
    expect(resolveAccent(mockMember(0xff0000), mockUser(0x00ff00))).toBe(
      0xff0000,
    );
  });

  test("falls back to user accent color when member is null", () => {
    expect(resolveAccent(null, mockUser(0x00ff00))).toBe(0x00ff00);
  });

  test("falls back to user accent color when member has no role color", () => {
    expect(resolveAccent(mockMember(0), mockUser(0x00ff00))).toBe(0x00ff00);
  });

  test("falls back to brand blurple when no other color is available", () => {
    expect(resolveAccent(null, mockUser(null))).toBe(BRAND_BLURPLE);
    expect(resolveAccent(mockMember(0), mockUser(undefined))).toBe(
      BRAND_BLURPLE,
    );
  });
});
