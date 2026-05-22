import { describe, expect, test } from "bun:test";
import { ComponentType, TextInputStyle, type User } from "discord.js";
import type { ModalSubmitInteraction } from "discord.js";
import {
  createModerationModal,
  createReasonLabel,
  extractReason,
} from "../../src/lib/mod-modals";

const mockReasonInteraction = (value: string): ModalSubmitInteraction =>
  ({
    fields: {
      getTextInputValue: (id: string) =>
        id === "reason" ? value : "",
    },
  }) as unknown as ModalSubmitInteraction;

const mockUser = (id: string, username: string): User =>
  ({ id, username }) as unknown as User;

describe("extractReason", () => {
  test("returns the trimmed reason value", () => {
    expect(extractReason(mockReasonInteraction("  hello  "))).toBe("hello");
  });

  test("returns null when the reason is empty or whitespace", () => {
    expect(extractReason(mockReasonInteraction(""))).toBeNull();
    expect(extractReason(mockReasonInteraction("   "))).toBeNull();
  });
});

describe("createReasonLabel", () => {
  test("builds a Reason label wrapping a paragraph text input", () => {
    const json = createReasonLabel("Why?").toJSON();
    expect(json.label).toBe("Reason");
    if (json.component.type !== ComponentType.TextInput) {
      throw new Error("expected text input component");
    }
    expect(json.component.custom_id).toBe("reason");
    expect(json.component.style).toBe(TextInputStyle.Paragraph);
    expect(json.component.required).toBe(false);
    expect(json.component.max_length).toBe(512);
    expect(json.component.placeholder).toBe("Why?");
  });
});

describe("createModerationModal", () => {
  const withReason = (user: User) =>
    createModerationModal("mod-ban", "Ban", user).addLabelComponents(
      createReasonLabel("Why?"),
    );

  test("encodes the action and target in the title and customId", () => {
    const json = withReason(mockUser("42", "alice")).toJSON();
    expect(json.custom_id).toBe("mod-ban:42");
    expect(json.title).toBe("Ban alice");
  });

  test("truncates the title to Discord's 45-char limit", () => {
    const json = withReason(mockUser("1", "a".repeat(60))).toJSON();
    expect(json.title.length).toBe(45);
  });
});
