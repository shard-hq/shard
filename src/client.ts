import { Client, GatewayIntentBits } from "discord.js";
import { env } from "./env";

const shards = Array.from({ length: env.SHARD_COUNT }, (_, i) => i);

export const client = new Client({
  intents: [GatewayIntentBits.Guilds],
  shardCount: env.SHARD_COUNT,
  shards,
});
