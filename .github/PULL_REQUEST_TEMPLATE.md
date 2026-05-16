<!--
Thanks for contributing to Shard!

Before opening this PR, please confirm:
- The PR targets `develop`, not `main`.
- The title follows Conventional Commits (e.g. `feat(commands): add /welcome`).
- This PR contains a single feature or fix — not a bundle of unrelated changes.

See CONTRIBUTING.md for the full guidelines.
-->

## Summary

<!-- What does this PR do, in 1–3 sentences? Focus on the "why", not the "what" — the diff already shows the what. -->

## Related issue

<!-- Link the issue this PR closes. Use "Closes #42" so GitHub auto-closes it on merge. If there is no issue, briefly justify why one was not needed. -->

Closes #

## Type of change

<!-- Check all that apply. -->

- [ ] `feat` — new feature
- [ ] `fix` — bug fix
- [ ] `refactor` — code change that is neither a feature nor a fix
- [ ] `perf` — performance improvement
- [ ] `docs` — documentation only
- [ ] `test` — adding or correcting tests
- [ ] `chore` / `ci` / `build` — tooling, dependencies, CI
- [ ] **Breaking change** — the PR title uses `!` and the body includes a `BREAKING CHANGE:` footer

## Test plan

<!--
How did you verify this works? Typecheck does not prove a command behaves correctly.
At minimum, run the bot locally with `bun run dev` and exercise the change in Discord.
-->

- [ ] Tested in a real Discord server (commands invoked, events triggered)
- [ ] Added or updated unit tests where the logic is testable in isolation
- [ ] Tested the failure paths, not just the happy path

## Checklist

- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun test` passes
- [ ] No `--no-verify`, no skipped hooks, no bypassed checks
- [ ] No secrets, tokens, or user IDs committed
- [ ] Docs (`README.md`, `CONTRIBUTING.md`, inline) updated if behavior, config, or conventions changed
- [ ] Code follows the project conventions: no `any`, no `!` non-null assertion, no unnecessary `as`, no `console.*`, no magic strings/numbers

## Screenshots / recordings

<!-- For UI-visible changes (embeds, components, slash command output), attach a screenshot or short recording. Otherwise delete this section. -->

## Additional notes

<!-- Anything reviewers should know: trade-offs you made, follow-ups deferred to a later PR, areas you are unsure about. Otherwise delete this section. -->
