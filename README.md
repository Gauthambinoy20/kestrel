# Kestrel

> A kestrel hovers dead-still over a field, scanning the ground, then drops on the one target worth the dive. This engine does the same for jobs.

**Kestrel** is a multi-source job-discovery engine for IT roles. Give it a domain
(say _AI / Machine Learning_) and a country, and it expands that into hundreds of
real-world title variants, sweeps public ATS boards and job APIs, throws out senior
and management roles, verifies that each posting is still live, scores how
ready-to-apply each one is, ranks the strongest matches, and delivers a digest.

The logic lives as a pure, typed TypeScript library. The n8n workflow and the CLI
runner are thin adapters over that library — so every rule is unit-tested in isolation.

<!-- CI badges go live once the pipeline is pushed (M8). -->
<!-- ![CI](https://github.com/Gauthambinoy20/kestrel/actions/workflows/ci.yml/badge.svg) -->

---

## Why it's interesting

✍️ TODO: my words — what I find genuinely interesting about this build.

## Status

🚧 **Active migration / rebuild.** Tracked slice-by-slice in [ROADMAP.md](./ROADMAP.md).
This README documents what exists today and is updated as each milestone lands — no
feature is described here before it is built and tested.

## Architecture (current engine)

Kestrel runs as a staged pipeline. Each stage is a pure function in `src/`:

| Stage | What it does |
| --- | --- |
| **Taxonomy** | Expands one of 20 IT domains into hundreds of role aliases + match terms. |
| **Scrape** | Concurrently queries public ATS boards (Greenhouse, Lever, Ashby), RemoteOK, and — when keys exist — Adzuna, Jooble, SerpAPI, ScrapeGraphAI. Retries with backoff; a dead source never stops the run. |
| **Filter & match** | Normalises titles, blocks senior/management roles, scores each job against the selected domain(s). |
| **Verify & enrich** | Confirms the job link is live, detects expired postings, derives company domain + public careers/contact links, computes an apply-readiness score. |
| **Rank** | Deterministic, explainable local scoring — no paid LLM. |
| **Deliver** | Builds a digest (Telegram today; a web dashboard is on the roadmap). |

> Full diagrams (architecture, data-flow, sequence, ER) land in [`docs/`](./docs) at M9.

## Getting started

```bash
nvm use            # Node 22
npm ci
npm test           # run the unit suite
npm run typecheck  # strict TypeScript, no emit
npm run lint       # ESLint
```

No credentials are required to develop or test: the keyless public boards
(Greenhouse / Lever / Ashby / RemoteOK) need no API keys, and external calls are
mocked in tests. Optional API-key sources are configured via `.env` (see
[`.env.example`](./.env.example)).

## How to run

✍️ TODO: my words — once the CLI runner lands (M6) this section gets the real
`kestrel scan ...` invocation and a real-run example.

## How to test

```bash
npm test           # full suite
npm run test:cov   # with coverage thresholds
```

Tests are free, fast, and deterministic — every external boundary is mocked, and
cases are parametrised across all 20 domains and all source shapes.

## Screenshots

📸 _Captured from a real production run — added at M9 (no staged/fake data)._

## License

[MIT](./LICENSE) © Gautham Binoy
