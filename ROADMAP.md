# Kestrel — Roadmap

Slice-by-slice migration of the legacy `job-radar` n8n engine into a clean, typed,
tested, world-class repo. Each slice is one coherent change with its tests in the same
commit. Cumulative % and commit hashes are filled in as slices land.

**Current: 25% — M0–M2 complete; M3 next.**

---

## M0 — Scaffold & migration baseline (5% ✅)

- [x] 0.1 repo scaffold + toolchain (TypeScript, Vitest, ESLint, Prettier, EditorConfig) ... 3%  (commit 60918c6)
- [x] 0.2 baseline module + green test + clean build + license/env example ............... 5%  (commit 691583b)

## M1 — Core logic extraction (15% ✅)

- [x] 1.1 text normalisation (`normalizeText`, `stripTitleNoise`, `containsPhrase`) + tests (89fac7c)
- [x] 1.2 domain taxonomy (20 domains) as config + `enrichDomain` + alias expansion + tests (941b346, 0a04416)
- [x] 1.3 domain resolution (`resolveSelectedDomains`, "all", fuzzy, custom fallback) + tests (08fc3bd)
- [x] 1.4 seniority blocklist (`jobSeniorityBlocked`) + word-boundary guards + tests (bdbc8b9)
- [x] 1.5 domain matching + scoring (`matchJobToDomains`) + tests (5d4e361)

## M2 — Sources + schema validation (25% ✅)

- [x] 2.1 Zod RawJob schema + quarantine partitioner + tests (7c8c366, 1c7ff4b)
- [x] 2.2 per-source parsers (helpers + ATS + aggregators + RemoteOK/SGAI) + tests (27ece96, 72bbe4e, 6ee4cb1, e00a7fa)
- [x] 2.3 bounded concurrency + retry/backoff + retryable-status (`runLimited`, `safeRequest`) + tests (2aea960, 6896348)
- [x] 2.4 URL dedup + stable hash + scrape assembly + tests (20ded2e, a917687, fec973e)

## M3 — Verify, enrich & score (target 35%)

- [ ] 3.1 URL safety (`safeUrl`, `baseDomain` incl. multi-part TLDs, `cleanCompanySlug`) + tests
- [ ] 3.2 link verification (HEAD→GET fallback, expired-posting detection) + tests
- [ ] 3.3 company enrichment (`inferCompanyDomain`, public links, source quality) + tests
- [ ] 3.4 apply-readiness score (`calcApplyReadyScore`) bounds + monotonicity + tests

## M4 — Rank, digest & Telegram routing (target 45%)

- [ ] 4.1 deterministic ranker + explainable reason + tests
- [ ] 4.2 digest builder + chunking/escaping + tests
- [ ] 4.3 Telegram intent router + prefs persistence + curated SQL builder + tests

## M5 — n8n adapters (target 53%)

- [ ] 5.1 SQL builder (`pgEscape`, `buildSql`) injection-safe + tests
- [ ] 5.2 generate n8n Code-node bodies from the lib (build step) + parity test
- [ ] 5.3 updated workflow JSON exports verified

## M6 — CLI runner (target 62%)

- [ ] 6.1 `kestrel scan --domain --country --top` (real keyless public boards) + tests
- [ ] 6.2 local store (SQLite/JSON) for cross-run dedup + tests
- [ ] 6.3 offline fixture mode (`--offline`, dev/test only — never used for screenshots)
- [ ] 6.4 real smoke run captured to a run report

## M7 — Features (target 75%)

- [ ] 7.1 config-driven taxonomy (extensible, schema-validated)
- [ ] 7.2 visa / Stamp 1G / sponsorship flags
- [ ] 7.3 salary parse + normalise
- [ ] 7.4 work-mode classifier (remote / hybrid / onsite)
- [ ] 7.5 location & country normalisation + filter
- [ ] 7.6 cross-run dedup with persistent seen-store
- [ ] 7.7 explainable scoring v2 (transparent breakdown)
- [ ] 7.8 freshness / age-decay + stale-link handling
- [ ] 7.9 two new compliance-safe sources (Recruitee, SmartRecruiters public boards)
- [ ] 7.10 structured run report (sources, counts, failures, guardrails)
- [ ] 7.11 Telegram digest v2 (MarkdownV2 + >4096 chunking)
- [ ] 7.12 each feature ships with its full test set

## M8 — Web dashboard (world-class UI) (target 84%)

- [ ] 8.1 React + (MUI or shadcn/Tailwind) app: ranked jobs, filters, run report
- [ ] 8.2 responsive · WCAG 2.1 AA · dark/light · loading/empty/error states
- [ ] 8.3 binds to REAL engine output (no placeholder data) + component/a11y tests
- [ ] 8.4 Lighthouse ≥ 90 (perf / a11y / best-practices)

## M9 — CI/CD green (target 90%)

- [ ] 9.1 GitHub Actions: gitleaks · Trivy · CodeQL · Dependabot
- [ ] 9.2 node jobs: eslint · prettier --check · tsc --noEmit · vitest --cov · build · npm audit
- [ ] 9.3 real CVE bumps (no allowlists) — all workflows GREEN

## M10 — Docs & diagrams (target 96%)

- [ ] 10.1 Mermaid diagrams: architecture, DFD, sequence, ER
- [ ] 10.2 README finalised + ≥4 screenshots from a real production run

## M11 — Definition of Done & push (target 100%)

- [ ] 11.1 full DoD checklist verified (§11 of master CLAUDE.md)
- [ ] 11.2 push to `Gauthambinoy20/kestrel` — **on Gautham's word only**
- [ ] 11.3 delete old `job-radar` from the locked account — **after Gautham's approval**

---

## Known issues

- Legacy n8n install blocks Code-node access to `$env`; the env reads must stay guarded.
- Some public ATS slugs in the legacy list are stale (return zero jobs) — to be pruned in M2.

## Next

→ M3.1: URL safety (`safeUrl`, `baseDomain` incl. multi-part TLDs, `cleanCompanySlug`) with tests.

## ✍️ TODO: my words

(Design decisions, trade-offs, and the story of this build — Gautham's to write.)
