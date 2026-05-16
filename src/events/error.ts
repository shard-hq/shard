import { Events } from "discord.js";
import { logger } from "../lib/logger";
import { defineEvent } from "../types/event";

export default defineEvent({
  name: Events.Error,
  execute(err) {
    logger.error({ err }, "client error");
  },
});
