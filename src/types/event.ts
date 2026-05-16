import type { ClientEvents } from "discord.js";

export interface Event<K extends keyof ClientEvents = keyof ClientEvents> {
  name: K;
  once?: boolean;
  execute(...args: ClientEvents[K]): Promise<void> | void;
}

export const defineEvent = <K extends keyof ClientEvents>(event: Event<K>): Event<K> =>
  event;
