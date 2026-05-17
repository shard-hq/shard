<!--
Thanks for contributing to Shard! Before opening this PR, please confirm:

- The PR targets `develop` (or `main` from a `hotfix/*` branch on a published release).
- The title follows Conventional Commits — e.g. `feat(commands): add /welcome`.
- This PR contains a single feature or fix, not a bundle of unrelated changes.

See CONTRIBUTING.md for the full guidelines.
-->

## Summary

<!-- What does this PR do, and why? Focus on the "why" — the diff already shows the "what". -->

## Related issue

<!-- Use "Closes #42" so GitHub auto-closes the issue on merge. If there is no issue, briefly justify why one was not needed. -->

Closes #

## Test plan

<!--
How did you verify this works? Typecheck doesn't prove a command behaves correctly.
At minimum, run the bot locally with `bun run dev` and exercise the change in Discord.
-->

## Checklist

- [ ] Tested in a real Discord server
- [ ] `bun run typecheck` passes
- [ ] `bun run lint` passes
- [ ] `bun test` passes
- [ ] No secrets committed; docs updated if behavior or config changed
