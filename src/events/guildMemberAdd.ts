import { Events } from "discord.js";
import { listAutoroles } from "../lib/autoroles";
import { logger } from "../lib/logger";
import { defineEvent } from "../types/event";

const AUDIT_REASON = "Autorole on join";

export default defineEvent({
  name: Events.GuildMemberAdd,
  async execute(member) {
    if (member.user.bot) return;

    const roleIds = listAutoroles(member.guild.id);
    if (roleIds.length === 0) return;

    const assigned: string[] = [];
    for (const roleId of roleIds) {
      try {
        await member.roles.add(roleId, AUDIT_REASON);
        assigned.push(roleId);
      } catch (err) {
        logger.warn(
          {
            err,
            guild: member.guild.id,
            user: member.id,
            role: roleId,
          },
          "autorole assign failed",
        );
      }
    }

    if (assigned.length > 0) {
      logger.info(
        { guild: member.guild.id, user: member.id, roles: assigned },
        "autoroles assigned",
      );
    }
  },
});
