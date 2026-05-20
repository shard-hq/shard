<div align="center">

# Shard

**Building an open-source, self-hostable alternative to MEE6, Dyno, Carl-bot, and ProBot — no paywalls, no premium tiers, no feature gating.**

[![Bun](https://img.shields.io/badge/Bun-1.3-fbf0df?logo=bun&logoColor=fff)](https://bun.sh)
[![discord.js](https://img.shields.io/badge/discord.js-v14-5865f2?logo=discord&logoColor=fff)](https://discord.js.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-strict-3178c6?logo=typescript&logoColor=fff)](https://www.typescriptlang.org)
[![ESLint](https://img.shields.io/badge/ESLint-type--checked-4b32c3?logo=eslint&logoColor=fff)](https://eslint.org)
[![License: AGPL v3](https://img.shields.io/badge/License-AGPL_v3-d22128?logo=gnu&logoColor=fff)](LICENSE)

</div>

Shard is a modern Discord bot built with [Bun](https://bun.sh), [TypeScript](https://www.typescriptlang.org), and [discord.js v14](https://discord.js.org).

> [!NOTE]
> Shard is still in active development — every bit of feedback, every bug report, and every contribution genuinely moves the project forward. [Join the Discord](https://discord.gg/gCCfErBEKr) or [file an issue](https://github.com/shard-hq/shard/issues) — we'd love to hear from you.

## Features

- **Moderation commands and logs** — actions with optional DM-to-user, audit log entries, and a configurable mod log channel
- **Case history** — every action tracked, viewable, editable, and deletable
- **Right-click context menus** — quick moderation actions from any user profile
- **Autoroles** — assign roles automatically to new members on join
- **Utility commands** — user, server, and avatar info

## Quick start

### Prerequisites

A Discord application with a bot token — create one at the [Discord Developer Portal](https://discord.com/developers/applications).

### Docker

The easiest way to run Shard is the pre-built image on GHCR: [`ghcr.io/shard-hq/shard:latest`](https://github.com/shard-hq/shard/pkgs/container/shard).

#### One-shot — `docker run`

```bash
docker run -d \
  --name shard \
  --restart unless-stopped \
  -e DISCORD_TOKEN=your_token_here \
  -v shard-data:/usr/src/app/data \
  ghcr.io/shard-hq/shard:latest
```

#### Recommended for self-host — `docker compose`

Create a `compose.yml`:

```yaml
services:
  bot:
    image: ghcr.io/shard-hq/shard:latest
    container_name: shard
    restart: unless-stopped
    env_file:
      - .env
    volumes:
      - data:/usr/src/app/data

volumes:
  data:
```

And a `.env` next to it:

```
DISCORD_TOKEN=your_token_here
```

Then start the bot:

```bash
docker compose up -d
```

Update later with `docker compose pull && docker compose up -d`.

### Privileged intents

In the [Developer Portal](https://discord.com/developers/applications) → your application → **Bot**, enable all three **Privileged Gateway Intents**:

- **Server Members Intent** — required (autoroles, member events)
- **Message Content Intent** — recommended (future features)
- **Presence Intent** — recommended (future features)

Enabling them upfront means you won't have to come back here whenever Shard ships a new feature.

### Invite

In the [Developer Portal](https://discord.com/developers/applications) → **OAuth2 → URL Generator**:

- **Scopes:** `bot`, `applications.commands`
- **Bot permissions:** View Channels, Send Messages, Embed Links, Read Message History, Ban Members, Kick Members, Moderate Members, Manage Messages, Manage Roles

Use the generated URL to invite the bot.

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

Contributions of any size are welcome — typo fixes count just as much as new commands. Have a look at [CONTRIBUTING.md](CONTRIBUTING.md) to get started, or [drop in the Discord](https://discord.gg/gCCfErBEKr) if you want to chat through an idea first.

## License

Shard is free software released under the [GNU Affero General Public License v3.0](LICENSE) (AGPLv3) or any later version.
