# Contributing to Shard

Thanks for your interest in contributing to Shard. This document describes the workflow and conventions used in this repository.

## Code of conduct

Be respectful, constructive, and inclusive. Discrimination, harassment, or abuse will not be tolerated. Maintainers reserve the right to close contributions or block users who don't follow this principle.

## Reporting bugs

Open a GitHub issue with:

- a clear description of the unexpected behavior
- steps to reproduce
- expected vs. actual behavior
- environment (Bun version, OS, discord.js version)

## Suggesting features

Open a GitHub issue describing the **use case first**, not the implementation. Discussion happens on the issue before code is written.

## Development setup

1. Fork the repository on GitHub.
2. Clone your fork locally:

   ```bash
   git clone https://github.com/shard-hq/shard.git
   cd shard
   ```

3. Install dependencies and configure your bot token — see [README.md](README.md#getting-started).
4. Create a branch from `develop` using a [Conventional Branch](https://conventional-branch.github.io) name:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/your-feature-name
   ```

Valid prefixes: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, `perf/`, `ci/`.

## Commit messages

This repository follows the [Conventional Commits](https://www.conventionalcommits.org/) specification. All commit messages must be in English.

```
<type>(<optional scope>): <description>

[optional body]

[optional footer]
```

### Types

| Type | When to use |
|---|---|
| `feat` | A new feature |
| `fix` | A bug fix |
| `docs` | Documentation only |
| `style` | Formatting, whitespace (no logic change) |
| `refactor` | Code change that neither fixes a bug nor adds a feature |
| `perf` | Performance improvement |
| `test` | Adding or correcting tests |
| `chore` | Maintenance, dependencies, tooling |
| `ci` | CI configuration changes |
| `build` | Build system or external dependency changes |

### Examples

```
feat(commands): add /welcome with configurable channel
fix(loader): handle invalid command exports gracefully
docs(readme): update getting started section
refactor(logger): drop pino-pretty in production builds
chore(deps): bump discord.js to 14.27
```

### Breaking changes

Append `!` after the type/scope and add a `BREAKING CHANGE:` footer:

```
feat(api)!: switch slash command deployment to global only

BREAKING CHANGE: DISCORD_GUILD_ID env var has been removed.
```

## Pull requests

- **Target `develop`**, never `main`.
- The PR title must follow Conventional Commits (e.g. `feat(commands): add /welcome`).
- One feature or fix per PR — don't bundle unrelated changes.
- Link the related issue in the description (e.g. `Closes #42`).
- All of the following must pass locally before opening:

  ```bash
  bun run typecheck
  bun run lint
  bun test
  ```

- Run the bot locally (`bun run dev`) and verify the change actually works in Discord. Typecheck doesn't prove a command behaves correctly.
- Never bypass git hooks (`--no-verify`).

A maintainer will review and either merge, request changes, or close.

## Adding a command

Create `src/commands/<category>/<name>.ts`:

```ts
import { SlashCommandBuilder } from "discord.js";
import { defineCommand } from "../../types/command";

export default defineCommand({
  data: new SlashCommandBuilder()
    .setName("hello")
    .setDescription("Says hello."),
  async execute(interaction) {
    await interaction.reply({ content: `Hello, ${interaction.user.username}!` });
  },
});
```

The loader picks it up on next startup, registers it, and the deploy step pushes it to Discord (no-op if the command set hasn't changed).

## Adding an event handler

Create `src/events/<eventName>.ts`:

```ts
import { Events } from "discord.js";
import { defineEvent } from "../types/event";

export default defineEvent({
  name: Events.GuildMemberAdd,
  async execute(member) {
    // ...
  },
});
```

Use `once: true` for events that must fire only once (e.g. `ClientReady`).

## Coding standards

Full coding conventions live in [AGENTS.md](AGENTS.md). Non-negotiables:

- No `any`, no `!` non-null assertion, no unnecessary `as` casts.
- No business logic in `index.ts`.
- No magic strings or numbers — use named constants.
- Errors logged with context via the structured `logger`, never `console`.
- One file = one command / one event / one component.

Read AGENTS.md before contributing to avoid friction during review.

## License

By contributing, you agree that your contributions are licensed under the project's [GNU Affero General Public License v3.0](LICENSE) (AGPLv3) or any later version.
