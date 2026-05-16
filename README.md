<div align="center">

# Shard

**The open-source, self-hostable alternative to MEE6, Dyno, Carl-bot, and ProBot — without paywalls, premium tiers, or feature gating.**

[![Bun](https://img.shields.io/badge/Bun-1.x-fbf0df?logo=bun&logoColor=000)](https://bun.sh)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865f2?logo=discord&logoColor=fff)](https://discord.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![ESLint](https://img.shields.io/badge/ESLint-type--checked-4b32c3?logo=eslint&logoColor=fff)](https://eslint.org)

</div>

---

## Why Shard?

- **Open-source** — every line is auditable, modifiable, and forkable.
- **Self-hostable** — run it on your own infrastructure and own your data. A maintained hosted instance is also available.
- **No paywalls** — features are never artificially gated.

---

## Tech stack

| Layer | Choice |
|---|---|
| Runtime | [Bun](https://bun.sh) |
| Language | [TypeScript](https://www.typescriptlang.org) (strict) |
| Discord API | [discord.js v14](https://discord.js.org) |
| Validation | [Zod](https://zod.dev) |
| Logging | [pino](https://getpino.io) + [pino-pretty](https://github.com/pinojs/pino-pretty) |
| Linting | [ESLint 9](https://eslint.org) + [typescript-eslint 8](https://typescript-eslint.io) |

---

## Getting started

### Prerequisites

- [Bun](https://bun.sh) `1.x` or later
- A Discord application with a bot token — create one at the [Discord Developer Portal](https://discord.com/developers/applications)

### Setup

```bash
git clone https://github.com/your-user/shard.git
cd shard
bun install
cp .env.example .env
```

Open `.env` and fill in your bot token:

```dotenv
DISCORD_TOKEN=your-token-here
```

Then run:

```bash
bun run dev
```

The bot validates the environment, loads commands and events, logs in, and deploys slash commands globally. The first global deployment can take up to an hour to propagate; subsequent updates are near-instant.

### Inviting the bot

Generate an OAuth2 install link in the Discord Developer Portal with:

- **Scopes:** `bot`, `applications.commands`
- **Permissions:** adjust to the features you enable.

---

## Scripts

| Command | Description |
|---|---|
| `bun run dev` | Run with hot reload |
| `bun run start` | Run in production mode |
| `bun run typecheck` | Type-check the project |
| `bun run lint` | ESLint check |
| `bun run lint:fix` | ESLint auto-fix |
| `bun test` | Run the test suite |

---

## Contributing

Contributions are welcome. See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines and [AGENTS.md](AGENTS.md) for coding conventions.

---

## License

To be defined. Until a `LICENSE` file is added, all rights are reserved by the authors.
