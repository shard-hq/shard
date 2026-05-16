import pino from "pino";
import pretty from "pino-pretty";

export const LOG_LEVELS = [
  "fatal",
  "error",
  "warn",
  "info",
  "debug",
  "trace",
  "silent",
] as const;

export type LogLevel = (typeof LOG_LEVELS)[number];

const isLogLevel = (value: string): value is LogLevel =>
  (LOG_LEVELS as readonly string[]).includes(value);

const rawLevel = Bun.env.LOG_LEVEL ?? "info";
const level: LogLevel = isLogLevel(rawLevel) ? rawLevel : "info";
const isDev = Bun.env.NODE_ENV !== "production";

const stream = isDev
  ? pretty({
      colorize: true,
      translateTime: "HH:MM:ss.l",
      ignore: "pid,hostname",
      sync: true,
    })
  : undefined;

export const logger = stream
  ? pino({ level, base: undefined }, stream)
  : pino({ level, base: undefined });

export type Logger = typeof logger;
