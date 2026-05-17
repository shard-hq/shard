<div align="center">

# Shard

**The open-source, self-hostable alternative to MEE6, Dyno, Carl-bot, and ProBot — without paywalls, premium tiers, or feature gating.**

[![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?logo=bun&logoColor=fff)](https://bun.sh)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865f2?logo=discord&logoColor=fff)](https://discord.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![ESLint](https://img.shields.io/badge/ESLint-type--checked-4b32c3?logo=eslint&logoColor=fff)](https://eslint.org)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-d22128?logo=gnu&logoColor=fff)](LICENSE)

</div>

Shard is a modern Discord bot built with [Bun](https://bun.sh), [TypeScript](https://www.typescriptlang.org), and [discord.js v14](https://discord.js.org).

## Features

- **Self-hostable** — run it on your own infrastructure, own your data.
- **Modern stack** — Bun, TypeScript strict, discord.js v14, ESLint type-checked.
- **Auto-deployed commands** — slash commands register globally on every startup.

## Quick start

### Prerequisites

A Discord application with a bot token — create one at the [Discord Developer Portal](https://discord.com/developers/applications).

### Install

```bash
git clone https://github.com/shard-hq/shard.git
cd shard
cp .env.example .env  # add your DISCORD_TOKEN
docker compose up -d
```

Update later with `docker compose pull && docker compose up -d`.

### Invite

Generate an OAuth2 install link in the Developer Portal with scopes `bot` and `applications.commands`, plus the permissions matching the features you enable.

## Run without Docker

For local development or contributing. Requires [Bun](https://bun.sh) `1.3` or later.

```bash
git clone https://github.com/shard-hq/shard.git
cd shard
bun install
cp .env.example .env  # add your DISCORD_TOKEN
bun run start
```

Slash commands are deployed globally on startup. First-time propagation can take up to an hour; subsequent updates are near-instant.

## Scripts

| Command | Description |
|---|---|
| `bun run start` | Run the bot |
| `bun run typecheck` | Type-check the project |
| `bun run lint` | ESLint check |
| `bun run lint:fix` | ESLint auto-fix |
| `bun test` | Run the test suite |

## Contributing

Contributions of any size are welcome — typo fixes count just as much as new commands. Have a look at [CONTRIBUTING.md](CONTRIBUTING.md) to get started, or open a [discussion](https://github.com/shard-hq/shard/discussions) if you want to chat through an idea first.

## License

Shard is free software released under the [GNU Affero General Public License v3.0](LICENSE) (AGPLv3) or any later version.
