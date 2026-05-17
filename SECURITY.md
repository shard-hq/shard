# Security Policy

Thanks for helping keep Shard and its users safe. Here's how to report a vulnerability and what you can expect from us in return.

## Supported versions

The latest release on `main` is the supported line for security fixes. Older releases and forks aren't backported, so please keep your self-hosted deployment current.

Per the [branching model](CONTRIBUTING.md#branching-model), fixes are developed on `develop` first and reach `main` via release.

## Reporting a vulnerability

Please don't open a public issue — public disclosure before a fix is out puts every self-hosted instance at risk. Use one of these private channels instead:

1. **GitHub Security Advisories** (preferred) — [report privately](https://github.com/shard-hq/shard/security/advisories/new).
2. **Email** — [mael.duret@icloud.com](mailto:mael.duret@icloud.com).

If you can, include: a description and impact, the affected component, reproduction steps or a PoC, and the commit SHA you tested. Don't worry if you don't have everything — send what you have, we'll follow up.

## What to expect

- **Acknowledgement** within **72 hours**.
- **Triage** within **7 days**, including severity rating.
- **Disclosure** coordinated with you; a patched release ships before the GitHub Security Advisory is published.

You will be credited in the advisory unless you ask to remain anonymous.

## Scope

**In scope:** Shard source code, slash command deployment, anything handling the bot token or Discord API responses.

**Out of scope:** third-party dependencies (report upstream), misconfiguration of self-hosted instances, denial-of-service from abusing intended functionality at scale.

## Safe harbor

We support good-faith security research. If you avoid privacy violations and service disruption, don't exploit beyond what's needed to demonstrate the issue, and give us reasonable time to fix before public disclosure, we won't pursue legal action — and we're grateful for your help.
