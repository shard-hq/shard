import type { GuildMember, User } from "discord.js";
import { BRAND_BLURPLE } from "./constants";

export const resolveAccent = (
  member: GuildMember | null,
  user: User,
): number => {
  if (member && member.displayColor !== 0) return member.displayColor;
  if (typeof user.accentColor === "number") return user.accentColor;
  return BRAND_BLURPLE;
};
