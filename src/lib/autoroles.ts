import { and, eq } from "drizzle-orm";
import { db } from "../db";
import { guildAutoroles } from "../db/schema";

export const listAutoroles = (guildId: string): string[] =>
  db
    .select({ roleId: guildAutoroles.roleId })
    .from(guildAutoroles)
    .where(eq(guildAutoroles.guildId, guildId))
    .all()
    .map((r) => r.roleId);

export const addAutorole = (guildId: string, roleId: string): boolean => {
  const inserted = db
    .insert(guildAutoroles)
    .values({ guildId, roleId, createdAt: Date.now() })
    .onConflictDoNothing()
    .returning({ roleId: guildAutoroles.roleId })
    .get();
  return inserted !== undefined;
};

export const removeAutorole = (guildId: string, roleId: string): boolean => {
  const deleted = db
    .delete(guildAutoroles)
    .where(
      and(
        eq(guildAutoroles.guildId, guildId),
        eq(guildAutoroles.roleId, roleId),
      ),
    )
    .returning({ roleId: guildAutoroles.roleId })
    .get();
  return deleted !== undefined;
};
