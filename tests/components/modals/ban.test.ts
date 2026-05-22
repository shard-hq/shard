import { describe, expect, test } from "bun:test";
import { parseDeleteDays } from "../../../src/components/modals/ban";

describe("parseDeleteDays", () => {
  test("returns 0 for empty input", () => {
    expect(parseDeleteDays("")).toBe(0);
    expect(parseDeleteDays("   ")).toBe(0);
  });

  test("accepts integers in the 0–7 range", () => {
    expect(parseDeleteDays("0")).toBe(0);
    expect(parseDeleteDays("1")).toBe(1);
    expect(parseDeleteDays("7")).toBe(7);
  });

  test("trims surrounding whitespace", () => {
    expect(parseDeleteDays("  3  ")).toBe(3);
  });

  test("rejects values above 7", () => {
    expect(parseDeleteDays("8")).toBeNull();
    expect(parseDeleteDays("100")).toBeNull();
  });

  test("rejects non-numeric and partially-numeric input", () => {
    expect(parseDeleteDays("abc")).toBeNull();
    expect(parseDeleteDays("3abc")).toBeNull();
    expect(parseDeleteDays("-3")).toBeNull();
    expect(parseDeleteDays("3.5")).toBeNull();
    expect(parseDeleteDays("0x3")).toBeNull();
  });
});
