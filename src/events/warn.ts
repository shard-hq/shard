import { Events } from "discord.js";
import { logger } from "../lib/logger";
import { defineEvent } from "../types/event";

export default defineEvent({
  name: Events.Warn,
  execute(msg) {
    logger.warn({ source: "discord.js" }, msg);
  },
});
