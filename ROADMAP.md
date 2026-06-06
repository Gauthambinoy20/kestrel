# Kestrel — Roadmap

Slice-by-slice migration of the legacy `job-radar` n8n engine into a clean, typed,
tested, world-class repo. Each slice is one coherent change with its tests in the same
commit. Cumulative % and commit hashes are filled in as slices land.

**Current: ~92% — engine + CLI + 12 features + web dashboard + CI + diagrams done locally.
Remaining: README screenshots from a real run (needs a browser), then push + CI verification
+ old-repo deletion (all need Gautham's go). Deferred: M5.2/5.3, M7.9.**

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

## M3 — Verify, enrich & score (35% ✅)

- [x] 3.1 URL safety (`safeUrl`, `baseDomain` incl. multi-part TLDs, `cleanCompanySlug`) + tests (a5afad4)
- [x] 3.2 link verification (HEAD→GET fallback, expired-posting detection) + tests (f019d16)
- [x] 3.3 company enrichment (`inferCompanyDomain`, public links, source quality) + tests (5789a01)
- [x] 3.4 apply-readiness score (`calcApplyReadyScore`) bounds + monotonicity + tests (dbcafc4)
- [x] 3.5 verify+enrich orchestration (`enrichJobs`, cached company-link checks, concurrency) + tests (75acaf8)

## M4 — Rank, digest & Telegram routing (45% ✅)

- [x] 4.1 deterministic ranker + explainable reason + tests (349978e)
- [x] 4.2 digest builder + chunking/escaping + tests (4b36781)
- [x] 4.3 Telegram intent router + prefs + curated SQL + menu builder + tests (c1ef6cb, 1c88636, a7085a3)

## M5 — n8n adapters (partial)

- [x] 5.1 SQL builder (`pgEscape`, `buildSql`) injection-safe + tests (d56ec2e)
- [ ] 5.2 generate n8n Code-node bodies from the lib (build step) + parity test — **DEFERRED** (see Known issues)
- [ ] 5.3 updated workflow JSON exports verified — **DEFERRED**

## M6 — CLI runner ✅ (+ source plumbing)

- [x] 6.0 ATS board registry + source request planning + source runner + full scan orchestration + tests (e5a4c9a, 10eddf3, ae8536a, 0afd041)
- [x] 6.1 fetch + verify HTTP clients + `kestrel scan` CLI + tests (951d496, b5d518a)
- [x] 6.3 offline fixture mode (`--offline`, dev/test only) + tests (c1be0ea)
- [x] 6.4 real smoke run verified — live scan returned 43 matched AI/ML jobs from 1581 real candidates with verified links
- [ ] 6.2 local store (SQLite/JSON) for cross-run dedup → folded into M7.6

## M7 — Features (12/13 ✅)

- [x] 7.1 config-driven taxonomy (schema + validated loader) (3e24be8)
- [x] 7.2 visa / Stamp 1G / sponsorship flags (fd4d189)
- [x] 7.3 salary parse + normalise (7f22f2a)
- [x] 7.4 work-mode classifier (remote / hybrid / onsite) (ffe39a8)
- [x] 7.5 location & country normalisation (8a0444b)
- [x] 7.6 cross-run dedup: in-memory seen-store + file persistence (07651bf, 876ac35)
- [x] 7.7 explainable score breakdown (3e08874)
- [x] 7.8 freshness / age-decay (daabed9)
- [ ] 7.9 two new sources (Recruitee, SmartRecruiters) — **DEFERRED** (unverified API shapes/slugs; see Known issues)
- [x] 7.10 structured run report (sources, counts, failures) (b55346b)
- [x] 7.11 Telegram MarkdownV2 escaping + >4096 chunking (c318228)
- [x] 7.x features wired into the pipeline via the annotate stage (e0a29f9)
- [x] 7.12 every feature ships with its full test set

## M8 — Web dashboard (world-class UI) ✅

- [x] 8.1 React + MUI app: ranked jobs, filters, run report (f547408, eee85af)
- [x] 8.2 responsive · dark/light (persisted) · loading/empty/error states
- [x] 8.3 binds to REAL engine output (scan.json from a live run; no placeholder data) + component tests
- [ ] 8.4 Lighthouse ≥ 90 — needs a browser run to measure (with M10 screenshots)

## M9 — CI/CD ✅ (committed; verifies on push)

- [x] 9.1 GitHub Actions: gitleaks · Trivy · CodeQL · Dependabot (4773b0d)
- [x] 9.2 engine + web jobs: eslint · tsc --noEmit · vitest · build · npm audit
- [ ] 9.3 all workflows GREEN on GitHub — pending the push (kept local per instruction)

## M10 — Docs & diagrams (partial)

- [x] 10.1 Mermaid diagrams: architecture, DFD, sequence (e49f5c9)
- [ ] 10.2 README ≥4 screenshots from a real run — **needs a browser** to capture the live dashboard

## M11 — Definition of Done & push (pending Gautham)

- [ ] 11.1 final DoD checklist verification
- [ ] 11.2 push to `Gauthambinoy20/kestrel` — **on Gautham's word only**
- [ ] 11.3 delete old `job-radar` from the locked account — **after Gautham's approval**

---

## Known issues

- **M5.2/5.3 deferred:** regenerating the n8n Code-node bodies from the typed lib (esbuild
  bundling into Code-node strings + a parity test) is scoped but not done. The production
  n8n workflow already runs; this is a sync/maintainability improvement, not a blocker.
- **M7.9 deferred:** Recruitee + SmartRecruiters integrations need their live API response
  shapes and working public board slugs verified before shipping (real-tests rule). Parsers/
  plan/runner are structured to drop in once verified.
- Legacy n8n install blocks Code-node access to `$env`; the env reads must stay guarded.
- Some public ATS slugs are stale (return zero jobs) — prune during a real run.

## Next

→ M8: world-class web dashboard (React + MUI/shadcn) over the engine output.
   Then M9 (CI green), M10 (diagrams + screenshots from a real run), M11 (push on Gautham's word).

## ✍️ TODO: my words

(Design decisions, trade-offs, and the story of this build — Gautham's to write.)
