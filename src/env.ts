import { z } from "zod";
import { LOG_LEVELS, logger } from "./lib/logger";

const EnvSchema = z.object({
  DISCORD_TOKEN: z
    .string()
    .min(50, { error: "DISCORD_TOKEN must be a valid Discord bot token" }),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  LOG_LEVEL: z.enum(LOG_LEVELS).default("info"),
});

const parsed = EnvSchema.safeParse(Bun.env);

if (!parsed.success) {
  const errors = parsed.error.issues.map((issue) => {
    const path = issue.path.length > 0 ? issue.path.join(".") : "(root)";
    return `${path}: ${issue.message}`;
  });
  logger.fatal({ errors }, "Invalid environment configuration");
  process.exit(1);
}

export const env = Object.freeze(parsed.data);
export type Env = typeof env;
