<div align="center">

# 🦅 Kestrel

**A multi-source job-discovery engine for IT roles — expands one domain into hundreds of title variants, sweeps 8 sources across ~220 public boards, verifies every link, scores apply-readiness, and ranks the best matches.**

[![CI](https://github.com/Gauthambinoy20/kestrel/actions/workflows/ci.yml/badge.svg)](https://github.com/Gauthambinoy20/kestrel/actions/workflows/ci.yml)
[![CodeQL](https://img.shields.io/github/actions/workflow/status/Gauthambinoy20/kestrel/ci.yml?label=CodeQL&logo=github)](https://github.com/Gauthambinoy20/kestrel/actions/workflows/ci.yml)
[![Node](https://img.shields.io/badge/Node-22-339933?logo=node.js&logoColor=white)](.nvmrc)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.7-3178C6?logo=typescript&logoColor=white)](tsconfig.json)
[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](web/package.json)
[![MUI](https://img.shields.io/badge/MUI-6-007FFF?logo=mui&logoColor=white)](web/package.json)
[![Vitest](https://img.shields.io/badge/tested%20with-Vitest-6E9F18?logo=vitest&logoColor=white)](https://vitest.dev)
[![Tests](https://img.shields.io/badge/tests-624%20passing-3DDC84)](#testing)
[![Coverage](https://img.shields.io/badge/coverage-~97%25-3DDC84)](#testing)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

[**Quick Start**](#quick-start) · [**Architecture**](docs/ARCHITECTURE.md) · [**Report a bug**](https://github.com/Gauthambinoy20/kestrel/issues)

![Kestrel dashboard](docs/screenshots/dashboard-light.png)

</div>

---

## About

A kestrel hovers dead-still over a field, scanning the ground, then drops on the one target worth the dive. This engine does the same for jobs.

Searching for an early-career IT role means checking dozens of company boards and job APIs by hand, most of them noisy, many listing roles that are stale or too senior. **Kestrel** automates the sweep: give it a domain (say _AI / Machine Learning_) and a country, and it expands that into **hundreds of real-world title variants**, queries **8 sources across ~220 public ATS boards**, throws out senior/management roles, **verifies each posting is still live**, scores how ready-to-apply it is, ranks the strongest matches, and delivers them — to a Telegram digest or a web dashboard.

The whole engine is a **pure, typed TypeScript library**. The CLI, the web dashboard and the n8n workflow are thin adapters over it with their HTTP transport injected, so every rule is unit-tested in isolation and the same code drives every surface. A recent live run pulled **2,450 candidates → 75 matched → 12 ranked** in one pass, with verified links.

No API keys are required: the core sources (Greenhouse, Lever, Ashby, RemoteOK) are keyless public endpoints. Optional aggregators switch on when their keys are present.

---

<details>
<summary><b>Table of contents</b></summary>

- [Features](#features)
- [Screenshots](#screenshots)
- [Quick start](#quick-start)
- [How it works](#how-it-works)
- [Sources & domains](#sources--domains)
- [Project structure](#project-structure)
- [Configuration](#configuration)
- [Testing](#testing)
- [CI & security](#ci--security)
- [Roadmap](#roadmap)
- [License](#license)

</details>

## Features

- **20 locked IT domains**, each expanded into **835+ title aliases** (core roles × entry/level variants) for broad, precise matching.
- **8 sources, ~220 public boards** — Greenhouse, Lever, Ashby and RemoteOK (keyless) plus Adzuna, Jooble, SerpAPI and ScrapeGraphAI (opt-in via keys).
- **Schema-validated ingestion** — every source payload passes a Zod gate; malformed rows are **quarantined and reported**, never silently dropped.
- **Seniority filtering** with word-boundary guards (blocks _Senior/Lead/Head…_ without tripping _Headless_ or _Leadership_).
- **Live-link verification** — HEAD→GET with retry/backoff, plus expired/closed-posting detection.
- **Apply-readiness scoring** and a **deterministic, explainable ranker** (no paid LLM — reproducible and free), with a per-job score breakdown.
- **Feature annotations on every job:** visa / Stamp 1G / sponsorship flags, parsed & normalised salary, work-mode (remote/hybrid/onsite), location normalisation, and posting freshness.
- **Cross-run de-duplication** with a persistent seen-store, so a recurring scan only surfaces genuinely new postings.
- **Resilient by design** — bounded concurrency, exponential backoff, and per-source failure isolation: one dead source never stops a scan.
- **Two delivery surfaces** — a Telegram digest (MarkdownV2-escaped, chunked past 4096 chars) and a **world-class web dashboard**.

## Screenshots

Captured from the web dashboard rendering a **real scan** (no staged data).

| Dashboard (light) | Dashboard (dark) |
| --- | --- |
| ![Kestrel dashboard, light theme](docs/screenshots/dashboard-light.png) | ![Kestrel dashboard, dark theme](docs/screenshots/dashboard-dark.png) |

| Search filter | Mobile (responsive) |
| --- | --- |
| ![Kestrel dashboard with a search filter applied](docs/screenshots/dashboard-search.png) | ![Kestrel dashboard on a mobile viewport](docs/screenshots/dashboard-mobile.png) |

## Quick start

Requires **Node 22** (`nvm use`).

```bash
npm ci
npm test          # 603 engine unit tests
npm run build     # emit the typed library to dist/
```

### Run a scan (CLI)

```bash
# Live scan of keyless public boards — no API keys needed:
npm run cli -- scan --domain ai --country IE --top 10

# JSON output (this is what feeds the dashboard):
npm run cli -- scan --domain ai --country IE --top 12 --json > web/public/scan.json

# Deterministic offline run from fixtures (dev/test, no network):
npm run cli -- scan --domain ai --offline tests/fixtures/offline-scan.json
```

| Flag | Default | Description |
| --- | --- | --- |
| `-d, --domain` | `ai` | IT domain to search (`ai`, `devops`, `data`, … or `all`) |
| `-c, --country` | `IE` | Country code (`IE`/`UK`/`US`/`AU`/`AE`) |
| `-t, --top` | `10` | Number of ranked results |
| `--max-boards <n>` | `0` | Cap ATS boards per provider (0 = all) |
| `--json` | — | Emit JSON instead of a digest |
| `--no-verify-company-links` | — | Skip public company-page checks |
| `--offline <file>` | — | Replay recorded fixtures (dev/test) |

### Run the dashboard

```bash
cd web && npm ci && npm run dev   # open the printed URL
```

The dashboard binds to `web/public/scan.json` — **real engine output, no bundled data**. Generate it with the `--json` command above, then refresh.

## How it works

A staged pipeline; each stage is a pure, separately tested function. Full diagrams (architecture, data-flow, sequence) are in **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.

```
domain + country
  → resolve domains → plan source requests → run sources (concurrent + retry)
  → parse per provider → validate (quarantine malformed)
  → dedupe + seniority filter + match → verify links + enrich company + score
  → rank (deterministic) → annotate (visa / salary / work-mode / freshness)
  → ranked result + run report → Telegram digest / web dashboard
```

## Sources & domains

**Sources:** Greenhouse · Lever · Ashby · RemoteOK (keyless) · Adzuna · Jooble · SerpAPI · ScrapeGraphAI (key-gated).

**Domains (20):** AI/ML & GenAI · Software · Backend · Frontend · Full-Stack · Data Engineering · Data Analytics & BI · Cloud · DevOps/Platform/SRE · Cybersecurity · QA & Test Automation · Mobile · Database/DBA · IT Support & Sysadmin · Network · Product · Solutions/Presales · Automation/RPA/Low-Code · Blockchain/Web3 · Game/AR/VR. New domains can be added from config and are schema-validated.

## Project structure

```
kestrel/
├── src/
│   ├── text/         normalisation primitives
│   ├── domains/      taxonomy, enrichment, resolution, schema
│   ├── matching/     seniority filter, domain matching/scoring
│   ├── sources/      boards, planning, runner, parsers, validation, dedup
│   ├── net/          bounded concurrency, retry/backoff
│   ├── enrich/       URL/company inference, link verify, apply-readiness
│   ├── rank/         deterministic ranker + score breakdown
│   ├── features/     visa, salary, work-mode, location, freshness, seen-store, annotate
│   ├── delivery/     digest, Telegram formatting, run report
│   ├── db/           Postgres upsert builder (n8n)
│   ├── runtime/      fetch & fixture HTTP clients, CLI render, seen-file
│   ├── pipeline/     assemble + the scan() orchestrator
│   └── cli.ts        the kestrel CLI
├── web/              Vite + React + MUI dashboard
├── n8n/              the original workflow exports (migration source)
├── docs/             architecture diagrams + screenshots
└── tests/            unit tests + offline fixtures
```

## Configuration

All configuration is via environment variables — see **[.env.example](.env.example)**. Every key is optional; the keyless public boards run with none. API-key sources (Adzuna/Jooble/SerpAPI/ScrapeGraphAI) activate only when their key is set, and scrape/verify concurrency, retries and timeouts are tunable.

## Testing

**624 tests** (603 engine + 21 web), **~97% line coverage**, all green; strict TypeScript and ESLint clean.

```bash
npm run verify          # engine: lint + typecheck + tests
npm run test:cov        # engine coverage
cd web && npm test      # web component/logic tests
```

Tests cover **every kind the project warrants** — unit, integration, edge/negative, security (SQL-injection-safe escaping, URL parsing), and are **parametrised across all 20 domains and all 8 source shapes**. Every external boundary (HTTP) is mocked, so the suite is free, fast and deterministic; nothing hits a real provider.

## CI & security

A single GitHub Actions pipeline runs on push + PR with least-privilege permissions and concurrency-cancel:

- **Engine** and **Web** jobs — ESLint · `tsc --noEmit` · tests · production build · `npm audit`.
- **gitleaks** (secret scan) · **Trivy** (filesystem CVEs) · **CodeQL** (SAST) · **Dependabot** (weekly).

Security gates scan the **shipped surface**: the published library (`zod` + `commander`) and the web runtime (`react` + `mui`) audit clean. Dev-only test tooling is scanned in isolation, so a test-runner advisory never blocks a release while real shipping CVEs do.

## Roadmap

Slice-by-slice progress, deferrals and known issues are tracked in **[ROADMAP.md](ROADMAP.md)**.

## License

[MIT](LICENSE) © Gautham Binoy
