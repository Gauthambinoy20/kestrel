# Kestrel — Architecture

All diagrams are derived from the real code in `src/` and the `web/` dashboard.

## Component architecture

How the pieces connect: one typed engine library, three thin adapters over it.

```mermaid
flowchart TD
  subgraph adapters[Adapters]
    CLI[CLI<br/>src/cli.ts]
    WEB[Web dashboard<br/>web/]
    N8N[n8n workflow<br/>n8n/*.json]
  end

  subgraph engine[Engine library - src/]
    SCAN[scan orchestrator<br/>pipeline/scan.ts]
    DOM[domains<br/>taxonomy / enrich / resolve / schema]
    SRC[sources<br/>plan / run / parsers / validate / dedup / boards]
    MATCH[matching<br/>seniority / match]
    ENR[enrich<br/>verify / company / score]
    RANK[rank + breakdown]
    FEAT[features<br/>visa / salary / workmode / location / freshness / annotate / seen-store]
    DEL[delivery<br/>digest / telegram-format / report]
    DB[db<br/>insert]
    NET[net<br/>retry / concurrency]
  end

  subgraph external[External - injected HTTP]
    GH[Greenhouse / Lever / Ashby]
    AGG[Adzuna / Jooble / SerpAPI]
    RO[RemoteOK / ScrapeGraphAI]
  end

  CLI --> SCAN
  WEB -->|scan.json| SCAN
  N8N -.regenerated from.-> engine
  SCAN --> DOM & SRC & MATCH & ENR & RANK & FEAT
  SRC --> NET --> external
  ENR --> NET
  SCAN --> DEL
  N8N --> DB
```

## Data-flow diagram

How a request becomes a ranked digest.

```mermaid
flowchart LR
  REQ[domain + country + topN] --> RESOLVE[resolve domains]
  RESOLVE --> PLAN[plan source requests]
  PLAN --> RUN[run sources - concurrent + retry]
  RUN --> PARSE[parse per provider]
  PARSE --> VALIDATE{validate}
  VALIDATE -->|valid| ASSEMBLE[dedupe + seniority filter + match]
  VALIDATE -->|malformed| Q[(quarantine)]
  ASSEMBLE --> ENRICH[verify links + company + apply-readiness]
  ENRICH --> RANK[deterministic rank]
  RANK --> ANNOTATE[annotate: visa / salary / work-mode / freshness]
  ANNOTATE --> OUT[ranked result + run report]
  OUT --> DIGEST[Telegram digest]
  OUT --> DASH[web dashboard]
```

## Scan sequence

The lifecycle of a single `scan()` call.

```mermaid
sequenceDiagram
  participant C as Caller (CLI/web/n8n)
  participant S as scan()
  participant P as planSources
  participant R as runSources
  participant V as validateRawJobs
  participant A as assembleJobs
  participant E as enrichJobs
  participant K as rankJobs + annotate

  C->>S: scan(config)
  S->>P: plan(domains, country, keys)
  P-->>S: SourceRequest[]
  S->>R: run(requests, httpClient)
  R-->>S: candidates + debug
  S->>V: validate(candidates)
  V-->>S: valid + quarantined
  S->>A: assemble(valid, ctx)
  A-->>S: matched jobs
  S->>E: enrich(matched, verifyClient)
  E-->>S: verified + scored jobs
  S->>K: rank(topN) + annotate(now)
  K-->>S: RankedJob[]
  S-->>C: ScanResult { ranked, counts, debug }
```

> No ER diagram: the engine library is stateless over injected HTTP. The only
> persistence is the optional cross-run seen-store (a flat JSON array of hashes)
> and, for the n8n adapter, the existing `jobs` table written via `db/insert.ts`.
