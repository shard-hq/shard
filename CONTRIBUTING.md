# Contributing to Shard

Hey, thanks for thinking about contributing! Shard is young and small, so every fix, doc tweak, and new command genuinely makes a difference. This guide walks through how things work — nothing here is set in stone, so feel free to ask in an issue or discussion if anything's unclear.

## Code of conduct

We follow the [Contributor Covenant](CODE_OF_CONDUCT.md) so everyone feels welcome here. If something's off, please reach out to [mael.duret@icloud.com](mailto:mael.duret@icloud.com).

## Branching model

This repository follows [Git Flow](https://nvie.com/posts/a-successful-git-branching-model/):

- **`main`** — released code. Only receives merges from `develop` (releases) or `hotfix/*` (urgent fixes on a published release).
- **`develop`** — active integration branch and default branch on GitHub. All feature work targets `develop`.
- **`feat/*`, `fix/*`, `chore/*`, …** — short-lived branches created from `develop`, merged back via pull request.

## Development setup

1. Fork the repository and clone your fork.
2. Install dependencies and configure your bot token — see the [README](README.md#quick-start).
3. Create a branch from `develop` with a [Conventional Branch](https://conventional-branch.github.io) name:

   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feat/your-feature-name
   ```

   Valid prefixes: `feat/`, `fix/`, `chore/`, `docs/`, `refactor/`, `test/`, `perf/`, `ci/`.

## Commit messages

[Conventional Commits](https://www.conventionalcommits.org/), in English: `<type>(<scope>): <description>`.

Types: `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`, `ci`, `build`. Append `!` and add a `BREAKING CHANGE:` footer for breaking changes.

## Pull requests

- Target `develop`. Use `main` only via a `hotfix/*` branch on a published release.
- One feature or fix per PR, please — easier to review and revert. Link the related issue with `Closes #N`.
- Run locally before opening:

  ```bash
  bun run typecheck
  bun run lint
  bun test
  ```

- Try the change in a real Discord server (`bun run dev`) — typecheck doesn't prove a command actually works.
- Please don't bypass git hooks (`--no-verify`). If a hook misbehaves, open an issue and we'll fix the hook.

## Coding standards

A few things we try to stick to:

- **TypeScript strict.** No `any`, no `!` non-null assertion, no unnecessary `as` — narrow with type guards.
- **Bun runtime.** Use `bun add`/`bun install`, `bun test`, `Bun.env`. Prefer native Bun APIs (`Bun.file`, `bun:sqlite`, `Bun.$`) over Node equivalents. No `dotenv`, no npm/yarn/pnpm.
- **discord.js v14.** Slash commands only, always builders (`SlashCommandBuilder`, `EmbedBuilder`, …), `flags: MessageFlags.Ephemeral` (not `ephemeral: true`), least-privilege intents.
- **One file = one command / one event / one component.** Auto-loaded via `Bun.Glob`, no manual registry.
- **No business logic in `src/index.ts`** — bootstrap only.
- **No magic strings or numbers** — extract named constants.
- **Structured logging** via `src/lib/logger.ts`, never `console`.

## License

By contributing, you agree your contributions are licensed under the [GNU AGPL v3](LICENSE) or any later version — same as the rest of the project.

---

Thanks again for taking the time. If you get stuck, open a discussion and we'll figure it out together.
