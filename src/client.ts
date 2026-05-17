import { Client, GatewayIntentBits } from "discord.js";
import { env } from "./env";

export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  shardCount: env.SHARD_COUNT,
});
