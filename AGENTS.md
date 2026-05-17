# Shard

Discord bot written in **TypeScript** on **Bun**, built on **discord.js v14**.

---

## 1. Runtime — Bun

- Run a file: `bun <file>` (never `node`, `ts-node`).
- Install: `bun add <pkg>` / `bun install` (never npm/yarn/pnpm).
- Scripts: `bun run <script>`. One-off CLIs: `bunx <pkg>`.
- Tests: `bun test` (use `bun:test`, not Jest/Vitest).
- Build: `bun build` if needed.
- **No `dotenv`**: Bun loads `.env` automatically. Access via `Bun.env.X` or `process.env.X`.
- Prefer native Bun APIs when they exist:
  - `Bun.file` over `node:fs.readFile/writeFile`
  - `bun:sqlite` over `better-sqlite3`
  - `Bun.sql` (Postgres), `Bun.redis` (Redis)
  - `Bun.$\`cmd\`` over `execa` / `child_process`

---

## 2. TypeScript — non-negotiable rules

`tsconfig.json` already has `strict: true` + `noUncheckedIndexedAccess` + `noImplicitOverride`. Code must honor that commitment.

- **Never `any`.** If the type is unknown, use `unknown` then narrow with a type guard.
- **No `as` casts** unless the guarantee comes from a runtime check just before. No `as unknown as T`.
- **No `!` non-null assertion.** Check explicitly (`if (!x) return`) or use `?.`.
- **Inference by default** for locals. Annotate explicitly:
  - parameters and return types of exported functions
  - public types (props, payloads, API responses)
- **`interface`** for object shapes and public contracts. **`type`** for unions, intersections, mapped types, utilities.
- **`readonly`** as soon as a value isn't reassigned; `as const` for literals.
- **Type-only imports**: `import type { ... }` when importing only types (`verbatimModuleSyntax` is enabled — it's required).
- **No `enum`** — use `as const` objects + `type X = typeof X[keyof typeof X]`. Exception: enums shipped by discord.js (`GatewayIntentBits`, `Events`, etc.) are used as-is.
- **Typed errors**: `catch (err: unknown)` then narrow. Never re-throw a string.

---

## 3. Discord.js v14 — patterns to follow

Target: `discord.js@^14.26`. Everything goes through modern **builders**.

### Intents — principle of least privilege

Request **only** the intents you need. Privileged intents (`MessageContent`, `GuildMembers`, `GuildPresences`) must also be enabled in the Discord Developer Portal.

```ts
import { Client, GatewayIntentBits, Partials } from "discord.js";

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
  partials: [Partials.Channel], // only if handling DMs or cache-miss events
});
```

### Slash commands first

- Global commands via `SlashCommandBuilder` and REST deployment (`@discordjs/rest` + `Routes.applicationCommands(...)`).
- Deployment is **automatic on `ClientReady`** (`src/lib/deploy-commands.ts`) — runs on every startup.
- No prefix commands (`!cmd`) unless there's a justified exception.

### Interactions — always reply, always `defer` if > 1s

```ts
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  try {
    if (longRunning) await interaction.deferReply({ flags: MessageFlags.Ephemeral });
    // ... work ...
    await interaction.editReply({ content: "ok" });
  } catch (err) {
    logger.error({ err, command: interaction.commandName }, "command failed");
    const payload = { content: "An error occurred.", flags: MessageFlags.Ephemeral };
    if (interaction.deferred || interaction.replied) await interaction.followUp(payload);
    else await interaction.reply(payload);
  }
});
```

Use `flags: MessageFlags.Ephemeral`, **not** the deprecated `ephemeral: true`.

Preferred type guards: `isChatInputCommand()`, `isButton()`, `isStringSelectMenu()`, `isModalSubmit()`, `isAutocomplete()`, `isContextMenuCommand()`.

### Builders — never raw objects

- `EmbedBuilder`, `ActionRowBuilder`, `ButtonBuilder`, `StringSelectMenuBuilder`, `ModalBuilder`, `TextInputBuilder`.
- For modern rich messages: **Components V2** (`ContainerBuilder`, `SectionBuilder`, `TextDisplayBuilder`, `MediaGalleryBuilder`, `SeparatorBuilder`) — send with `flags: MessageFlags.IsComponentsV2`. Prefer Components V2 over embeds for new displays.

### Events

- **Idempotent listeners**: the same event may fire multiple times (gateway resume, partials). Code accordingly.
- **`on` vs `once`**: `once` for `ClientReady`. `on` for everything else.
- Always `try/catch` inside the listener — an unhandled exception in a handler crashes the process.

### REST & rate limits

- Use discord.js's `REST` client; don't call the Discord API with raw `fetch`.
- Don't mass-spam `fetch()` on collections — prefer the cache, or batch.

### Sharding

- We use **internal sharding** — one Bun process holds N WebSocket connections to Discord's gateway. The count is set via `SHARD_COUNT` in `.env` (default `1`). To handle growth past 2500 guilds, bump `SHARD_COUNT` (e.g. `5` covers up to ~12 500 guilds) and restart.
- Cache is shared across all internal shards, so `client.guilds.cache.size` is the **total** guild count. No IPC, no `broadcastEval`, no per-shard gating. `clientReady` fires once when all shards are ready.
- A single process holds every shard, so a crash takes the whole bot down. Docker's restart policy in `compose.yml` covers this. At ~25 000+ guilds, migrating to clustered sharding (e.g. `discord-hybrid-sharding`) becomes the next step — not before.

---

## 4. Project structure

```
src/
  index.ts                # bootstrap: load handlers, attach process listeners, login
  env.ts                  # env var parsing/validation (fail fast if invalid)
  client.ts               # Client construction and configuration
  commands/
    <category>/
      <name>.ts           # exports defineCommand({ data, execute })
  events/
    <eventName>.ts        # exports defineEvent({ name, once?, execute })
  loaders/
    commands.ts           # scans src/commands/**, populates the registry
    events.ts             # scans src/events/**, attaches to the client
  lib/
    logger.ts             # pino instance (pretty in dev, JSON in prod)
    command-registry.ts   # Map<string, Command> singleton
    deploy-commands.ts    # deployCommands(client) — called from ClientReady
  types/
    command.ts            # Command interface + defineCommand helper
    event.ts              # Event<K> interface + defineEvent helper
```

- **One file = one command / one event / one component.**
- Handlers are loaded dynamically via `Bun.Glob`; no manual registry to maintain.
- No business logic in `index.ts` — it orchestrates, nothing more.

---

## 5. Quality, clarity, maintainability

- **No magic numbers / magic strings.** Use named constants at the top of the file or in `lib/constants.ts`.
- **Short functions**, single responsibility. If it exceeds ~50 lines, split it.
- **No side effects on import** (except `index.ts`). An imported file must not start timers or open connections.
- **No comments describing what the code does.** Naming is enough. Only add a comment to explain a non-obvious *why* (workaround, external constraint, subtle invariant).
- **No premature abstraction.** Three duplicated lines are better than a helper used in one place.
- **No feature flags, no backwards-compat shims** until there's an actual current need.
- **Errors**: log with context (command, user id, guild id) — never just `console.log(err)`. Use the structured `logger` from `src/lib/logger.ts`, never `console`.

---

## 6. Secrets & configuration

- `.env` is **in `.gitignore`**, never committed. Keep `.env.example` up to date.
- Required variables: `DISCORD_TOKEN` only. Slash commands are deployed globally at boot via `client.application.id` — no client ID env var needed.
- Parse and **validate** all env vars in `src/env.ts` at boot. If a variable is missing or invalid, fail fast with a clear message — never let the bot start with an invalid config.
- Never log the token, never pass it as an argument.

---

## 7. Tests

- `bun test` — colocate: `foo.ts` ↔ `foo.test.ts`.
- Prioritize testing pure logic (formatting, parsing, services). Interaction handlers can be tested by mocking only the minimal `interaction` object needed.
- No test should hit the real Discord API.

---

## 8. Workflow

- **No `--no-verify`** on commits, no hook skipping.
- Before declaring a feature done: `bun test` + run the bot locally and verify the actual interaction in Discord. Typecheck doesn't prove a command works.
- Small commits, imperative present-tense messages in English or French (stay consistent within the repo).
