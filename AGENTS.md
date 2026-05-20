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
- For modern rich messages: **Components V2** (`ContainerBuilder`, `SectionBuilder`, `TextDisplayBuilder`, `MediaGalleryBuilder`, `SeparatorBuilder`) — send with `flags: MessageFlags.IsComponentsV2`. Use embeds for info-dense displays (clean column grid via inline fields, minimal emoji); reserve Components V2 for mixed-component messages (welcome DMs, hero layouts).

### Component routing (buttons, modals, selects)

- Component handlers live in `src/components/<type>/<name>.ts` (only `buttons/` for now; add `modals/`, `selects/` when needed). Each file exports `defineButton({ prefix, execute })`.
- `customId` convention: `<prefix>:<arg1>:<arg2>`. The dispatcher in `interactionCreate` splits on `:` and looks the `<prefix>` up in `buttonRegistry`.
- **Encode state in the `customId`**, not in memory — handlers stay stateless so pagination/etc. survive bot restarts and need no cleanup logic.
- Per-feature handlers can import shared rendering helpers from their associated command (e.g. `components/buttons/cases.ts` imports `buildCasesPage` from `commands/moderation/cases.ts`). The command owns the feature; the button file is a thin entry point.
- When a second component type appears (modals, selects), copy the existing pattern into `modal-registry`, `loaders/modals.ts`, etc. — don't generalise into a meta-registry until two real types exist.

### Events

- **Idempotent listeners**: the same event may fire multiple times (gateway resume, partials). Code accordingly.
- **`on` vs `once`**: `once` for `ClientReady`. `on` for everything else.
- Always `try/catch` inside the listener — an unhandled exception in a handler crashes the process.

### REST & rate limits

- Use discord.js's `REST` client; don't call the Discord API with raw `fetch`.
- Don't mass-spam `fetch()` on collections — prefer the cache, or batch.

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
  components/
    buttons/
      <name>.ts           # exports defineButton({ prefix, execute })
  events/
    <eventName>.ts        # exports defineEvent({ name, once?, execute })
  loaders/
    commands.ts           # scans src/commands/**, populates the registry
    buttons.ts            # scans src/components/buttons/**, populates the registry
    events.ts             # scans src/events/**, attaches to the client
  lib/
    logger.ts             # pino instance (pretty in dev, JSON in prod)
    command-registry.ts   # Map<string, Command> singleton
    button-registry.ts    # Map<string, ButtonHandler> singleton (key = customId prefix)
    deploy-commands.ts    # deployCommands(client) — called from ClientReady
  db/
    index.ts              # Bun SQLite instance + PRAGMAs + Drizzle wrapper
    schema.ts             # Drizzle table definitions — source of truth
    migrate.ts            # runMigrations() — called from src/index.ts before login
    migrations/           # auto-generated by `bun run db:generate`, committed
  types/
    command.ts            # Command interface + defineCommand helper
    button.ts             # ButtonHandler interface + defineButton helper
    event.ts              # Event<K> interface + defineEvent helper
drizzle.config.ts         # drizzle-kit config (schema → migrations folder)
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

- `bun test` — tests live in `tests/`, mirroring `src/`'s layout (e.g. `src/lib/moderation.ts` ↔ `tests/lib/moderation.test.ts`). Keeps the source tree free of test noise and lets us exclude `tests/` from the Docker image cleanly.
- Prioritize testing pure logic (formatting, parsing, services). Interaction handlers can be tested by mocking only the minimal `interaction` object needed.
- No test should hit the real Discord API.

---

## 8. Database

- **SQLite** via `bun:sqlite`, wrapped by **Drizzle ORM**. Single file at `data/shard.db` (matches the Docker `data` named volume mounted at `/usr/src/app/data`). No external DB service to install — preserves the one-container self-host story.
- Schema lives in `src/db/schema.ts` (Drizzle TypeScript). It is the source of truth.
- Workflow: edit `schema.ts` → `bun run db:generate` → commit the generated `.sql` in `src/db/migrations/`. Migrations are applied at boot from `src/index.ts` before `client.login`, so a bad migration crashes early rather than mid-flight.
- PRAGMAs set on boot (in `src/db/index.ts`): `journal_mode = WAL` (perf + concurrent reads), `synchronous = NORMAL` (safe + fast paired with WAL), `foreign_keys = ON` (off by default in SQLite, easy gotcha — Drizzle relations rely on this), `busy_timeout = 5000`, `temp_store = MEMORY`.
- **Snowflakes (user/guild/channel IDs) → `text()` columns.** discord.js exposes them as strings, and `text` avoids the 53-bit JS number trap. For genuinely large counters, use `integer({ mode: 'bigint' })` per column when needed.
- `src/db/index.ts` opens the connection eagerly on import, like `lib/logger.ts` and `env.ts`. This is the intentional singleton exception to the "no side effects on import" rule in §5.
- No raw SQL outside `src/db/`. Consumers import the `db` object and use Drizzle's typed API.

---

## 9. Workflow

- **No `--no-verify`** on commits, no hook skipping.
- Before declaring a feature done: `bun test` + run the bot locally and verify the actual interaction in Discord. Typecheck doesn't prove a command works.
- Small commits, imperative present-tense messages in English or French (stay consistent within the repo).

---

## 10. Upgrades & self-hosters

This bot is self-hosted. Every commit ships to live instances someone is running — assume a `git pull` + restart will happen. Before merging, ask: *"if someone updates their running instance to this commit, what breaks?"* No silent breakage, no required manual ops on their side beyond what's documented.

- **DB schema changes** ship with a Drizzle migration in the same commit (see §8). `runMigrations()` runs before login, so a bad migration crashes early instead of mid-flight.
- **New stateful features need a startup backfill**: events (`GuildCreate`, `GuildMemberAdd`, …) only fire for *new* arrivals from now on. When a feature maintains per-X DB state (guild, user, channel…), also iterate the relevant cache on `ClientReady` with an idempotent upsert (`onConflictDoNothing`) — otherwise pre-existing data and offline-adds are silently skipped.
- **New env vars** either have a `.default(...)` in `src/env.ts` zod schema, or fail fast with a clear message. Never let an undefined value sneak two layers deep before crashing.
- **Removed / renamed schema** doesn't get backwards-compat shims (per §5), but the migration must explicitly drop or rename so leftover rows don't confuse new code.
- **Behavioral breaking changes** (command rename, new required permission, data wipe, default flip…) get called out in the PR body and end up in the auto-generated release notes via Conventional Commits (`feat!:` / `BREAKING CHANGE:` footer).
- **New optional intents or scopes** that the Developer Portal must enable: document in the commit body and README, and make the code degrade gracefully when the intent isn't granted.
