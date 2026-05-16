# Security Policy

Thanks for helping keep Shard and its users safe. This document describes how to report a vulnerability and what to expect in return.

## Supported versions

Shard is pre-1.0. Only the latest commit on the `main` branch receives security fixes — there are no maintained LTS branches. If you self-host, keep your deployment current.

| Version | Supported |
|---|---|
| `main` (latest) | Yes |
| Older commits / forks | No |

## Reporting a vulnerability

**Do not open a public GitHub issue, pull request, or Discord message for security reports.** Public disclosure before a fix is available puts every self-hosted instance at risk.

Use one of the following private channels:

1. **GitHub Security Advisories** (preferred) — open a private report via the [Security tab](https://github.com/shard-hq/shard/security/advisories/new) of the repository. This gives maintainers a private workspace to triage, patch, and coordinate disclosure with you.
2. **Email** — [mael.duret@icloud.com](mailto:mael.duret@icloud.com). Use this if you cannot access GitHub Security Advisories.

When reporting, please include:

- a clear description of the vulnerability and its impact
- the affected component (file, command, event handler, deployment step…)
- steps to reproduce, or a proof-of-concept
- the commit SHA or version you tested against
- any suggested remediation, if you have one

## What to expect

- **Acknowledgement**: within **72 hours** of receipt.
- **Initial assessment**: within **7 days**, including severity rating and whether we accept the report as a vulnerability.
- **Fix timeline**: communicated after triage; depends on severity and complexity. Critical issues are prioritized.
- **Disclosure**: coordinated. We will agree with you on a disclosure date, publish a patched release first, then a GitHub Security Advisory with a CVE if applicable.

We will keep you updated throughout the process and credit you in the advisory unless you prefer to remain anonymous.

## Scope

**In scope:**

- the Shard source code in this repository
- the slash command deployment flow and any code that handles the bot token, user input, or Discord API responses
- documented configuration (`.env`, `src/env.ts`)

**Out of scope:**

- vulnerabilities in third-party dependencies — please report those upstream first. If a dep is unmaintained and we are exposed, we will accept the report.
- misconfiguration of a self-hosted instance (leaked `.env`, exposed logs, missing OS updates, etc.)
- social engineering of maintainers or contributors
- denial-of-service caused solely by Discord rate limits or by abusing intended functionality at scale
- issues only reproducible on heavily modified forks

## Safe harbor

We support responsible security research. If you act in good faith — avoid privacy violations, data destruction, and service disruption; do not exploit beyond what is necessary to demonstrate the issue; give us reasonable time to fix before public disclosure — we will not pursue or support any legal action against you.

## Recognition

Reporters of valid vulnerabilities are credited in the corresponding GitHub Security Advisory and release notes, unless they request otherwise.
