import { beforeAll, beforeEach, describe, expect, test } from "bun:test";
import { like } from "drizzle-orm";
import { db } from "../../src/db";
import { runMigrations } from "../../src/db/migrate";
import { guildAutoroles } from "../../src/db/schema";
import {
  addAutorole,
  listAutoroles,
  removeAutorole,
} from "../../src/lib/autoroles";

const GUILD_PREFIX = "test-autoroles-";
const guildId = (n: number): string => `${GUILD_PREFIX}${n}`;

beforeAll(() => {
  runMigrations();
});

beforeEach(() => {
  db.delete(guildAutoroles).where(like(guildAutoroles.guildId, `${GUILD_PREFIX}%`)).run();
});

describe("listAutoroles", () => {
  test("returns an empty array when no roles are configured", () => {
    expect(listAutoroles(guildId(1))).toEqual([]);
  });

  test("returns every role configured for the guild", () => {
    addAutorole(guildId(2), "role-a");
    addAutorole(guildId(2), "role-b");
    expect(listAutoroles(guildId(2)).sort()).toEqual(["role-a", "role-b"]);
  });

  test("isolates roles per guild", () => {
    addAutorole(guildId(3), "shared-role");
    addAutorole(guildId(4), "shared-role");
    expect(listAutoroles(guildId(3))).toEqual(["shared-role"]);
    expect(listAutoroles(guildId(4))).toEqual(["shared-role"]);
  });
});

describe("addAutorole", () => {
  test("returns true when the role is newly added", () => {
    expect(addAutorole(guildId(5), "role-x")).toBe(true);
    expect(listAutoroles(guildId(5))).toEqual(["role-x"]);
  });

  test("returns false when the role already exists for this guild", () => {
    addAutorole(guildId(6), "role-y");
    expect(addAutorole(guildId(6), "role-y")).toBe(false);
    expect(listAutoroles(guildId(6))).toEqual(["role-y"]);
  });

  test("the same role is allowed in different guilds", () => {
    expect(addAutorole(guildId(7), "shared")).toBe(true);
    expect(addAutorole(guildId(8), "shared")).toBe(true);
  });
});

describe("removeAutorole", () => {
  test("returns true and drops the role when it exists", () => {
    addAutorole(guildId(9), "role-z");
    expect(removeAutorole(guildId(9), "role-z")).toBe(true);
    expect(listAutoroles(guildId(9))).toEqual([]);
  });

  test("returns false when the role isn't configured", () => {
    expect(removeAutorole(guildId(10), "ghost-role")).toBe(false);
  });

  test("only removes the targeted role", () => {
    addAutorole(guildId(11), "role-a");
    addAutorole(guildId(11), "role-b");
    expect(removeAutorole(guildId(11), "role-a")).toBe(true);
    expect(listAutoroles(guildId(11))).toEqual(["role-b"]);
  });
});
