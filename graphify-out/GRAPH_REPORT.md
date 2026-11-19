# Graph Report - FPL_Dashboard  (2026-11-19)

## Corpus Check
- 201 files · ~82,733 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 29 file(s) not represented in the graph (top: .css 23, .toml 3, (none) 2)

## Summary
- 1149 nodes · 2055 edges · 73 communities (53 shown, 20 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.86)
- Token cost: 11,600 input · 4,720 output

## Graph Freshness
- Built from commit: `79d2f561`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Next.js API Proxy & Transformation Layer
- next
- Repository Structure (src/app, src/components, src/lib, supabase)
- layout.tsx
- importStore.ts
- importedSquad.ts
- mobile-planning.spec.ts
- types.ts
- reproducibilityStore.ts
- PlanningWorkspaceV2.tsx
- Edge Proxy (proxy.ts) — IP-based rate limiting
- scenarios/route.ts
- FPL Dashboard user guide
- steps
- FPL Dashboard system documentation
- Implementation Plan — Frontend UI (mobile-first, glassmorphism dark-mode)
- FPL Dashboard 2026–27 — As-built architecture and product design
- steps
- import/page.tsx
- FPL Dashboard Playwright Test Strategy — Phase 1 Discovery
- FixtureTicker.tsx
- package.json
- app/page.tsx
- settings/page.tsx
- fplSquadImport.ts
- planning/sync/route.ts
- Testing and Documentation Governance
- workspace.ts
- compilerOptions
- steps
- DashboardShell
- HistoryChart.test.tsx
- Testing Strategy (Vitest unit + Playwright E2E + ESLint)
- create-next-app CLI Help (project bootstrap options)
- Target Audience (rank-focused managers, mini-league players, engaged casuals, content creators)
- Mobile Design — Component-Level Responsive Changes (stats grid, FixtureTicker, SquadPitch, HistoryChart)
- rateLimit.ts
- import/route.ts
- Pull-request process
- Agentic Playwright Testing Handbook
- fplImportProbe.ts
- dependencies
- PlanningBacktest.tsx
- Agentic Playwright Pilot Evaluation
- scripts
- LeagueLive.tsx
- publish-team-news.mjs
- 1. Unauthenticated entry
- TransferAnalyser.tsx
- Scheduled health reviews
- Mobile Design — GwModeIndicator Component (pill badge, override dropdown)
- Weekly Planning Workspace — Target Architecture
- page.test.tsx
- Client Component Pattern (use client + useState/useEffect + fetch /api/v1/)
- Implementation Plan — Open Questions (Tailwind vs CSS Modules, Supabase vs MongoDB, mock data)
- Production URL (https://fpl-dashboard-seven-pi.vercel.app/)
- ADR 003: Authenticated squad import contract
- Local Playwright FPL authentication setup
- Live FPL integration pilot
- Mobile Design — Error Handling & Edge Cases (mode detection failure, override edge cases, panel order edge cases)
- ADR 004: Browser-mediated FPL integration
- testing/README.md
- eslint.config.mjs
- pull_request_template.md
- @playwright/test
- @vitejs/plugin-react
- 001-planning-horizon-and-scenarios.md
- 002-season-aware-snapshots.md
- postcss.config.mjs
- specs/README.md

## God Nodes (most connected - your core abstractions)
1. `next` - 46 edges
2. `vitest` - 46 edges
3. `getEntryIdFromSession()` - 44 edges
4. `toSafeId()` - 34 edges
5. `fplFetch()` - 32 edges
6. `react` - 28 edges
7. `FPL Dashboard system documentation` - 23 edges
8. `FPL Dashboard user guide` - 22 edges
9. `fetchFplJson()` - 21 edges
10. `DashboardShell()` - 20 edges

## Surprising Connections (you probably didn't know these)
- `Open — needs decision or follow-up work` --references--> `getEntryIdFromSession()`  [INFERRED]
  SECURITY_REVIEW_STATUS.md → src/lib/session.ts
- `Live football data` --references--> `fplFetch()`  [INFERRED]
  docs/testing/fpl-test-strategy.md → src/lib/upstreamFetch.ts
- `Live football data` --references--> `fetchFplJson()`  [INFERRED]
  docs/testing/fpl-test-strategy.md → src/server/fpl/client.ts
- `Fixed (details)` --references--> `fplFetch()`  [INFERRED]
  SECURITY_REVIEW_STATUS.md → src/lib/upstreamFetch.ts
- `Fixed (details)` --references--> `toSafeId()`  [INFERRED]
  SECURITY_REVIEW_STATUS.md → src/lib/upstreamFetch.ts

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **FPL Data Proxy Pipeline (FPL Public API → Next.js API Routes → Dashboard Components)** — architecture_fpl_data_sources, architecture_api_layer, architecture_app_shell [EXTRACTED 0.95]
- **Transfer Recommendation Lifecycle (suggestions route → recommendation_logs table → cron evaluate)** — architecture_suggestions_optimization, claude_supabase_tables, architecture_cron_evaluate [INFERRED 0.88]

## Communities (73 total, 20 thin omitted)

### Community 0 - "Next.js API Proxy & Transformation Layer"
Cohesion: 0.06
Nodes (46): Next.js API Proxy & Transformation Layer, Auth API Routes (login + logout), Bootstrap-Static In-Process Cache (15 min TTL), Cron Evaluate Route (retroactive recommendation grading), Fixture Route (DGW/BGW detection + 5-GW ticker payload), Fixture & Rank Intelligence Routes, FPL Public API Data Sources, League & Sync Routes (+38 more)

### Community 1 - "next"
Cohesion: 0.06
Nodes (61): nextConfig, next, Fixed (details), Model/harness update (2026-08-28) — local model abandoned mid-evaluation, pivoting to cloud, Open — needs decision or follow-up work, Resuming this work, Security Review — Status / Parking Lot, Status Summary (+53 more)

### Community 2 - "Repository Structure (src/app, src/components, src/lib, supabase)"
Cohesion: 0.50
Nodes (4): App Shell (page.tsx + login/page.tsx), Player Image Strategy (club shirt assets via playerImage.ts), Technology Stack (Next.js 16 + React 19 + TypeScript + Supabase + Recharts), Repository Structure (src/app, src/components, src/lib, supabase)

### Community 3 - "layout.tsx"
Cohesion: 0.23
Nodes (6): inter, metadata, RootLayout(), BuildInfo(), getReleaseIdentity(), ReleaseIdentity

### Community 5 - "importStore.ts"
Cohesion: 0.27
Nodes (9): BootstrapHealth, GET(), FplSquadImport, checkConfirmedSquadImportStore(), inspectConfirmedSquadImportStore(), StoredSquadImport, StoreHealthCheck, checkPlanningReproducibilityStore() (+1 more)

### Community 6 - "importedSquad.ts"
Cohesion: 0.29
Nodes (6): countPositions(), PlanningPlayerIdentity, PlanningSquadValidationError, identities, lineupOrder, validateImportedSquadForPlanning()

### Community 7 - "mobile-planning.spec.ts"
Cohesion: 0.05
Nodes (38): positiveInteger(), requestHealthyResponse(), responseDiagnostic(), evaluateHealthHistory(), main(), readJson(), assert(), baseUrl (+30 more)

### Community 8 - "types.ts"
Cohesion: 0.07
Nodes (41): vitest, Event, LiveElement, loadLatestBacktest(), StoredScenario, { from, fetchFplJson }, buildChipAdvice(), ChipRecord (+33 more)

### Community 9 - "reproducibilityStore.ts"
Cohesion: 0.11
Nodes (24): POST(), { session, loadPlan, explain }, entryId(), GET(), POST(), { getEntryIdFromSessionMock, loadLatestMyPlanMock, saveMyPlanMock }, PlanExplanation(), explain() (+16 more)

### Community 10 - "PlanningWorkspaceV2.tsx"
Cohesion: 0.09
Nodes (27): PlanningPage(), ChipOpportunities(), names, payload, formatNumber(), MyPlanSummary, parseIds(), PlanningWorkspace() (+19 more)

### Community 11 - "Edge Proxy (proxy.ts) — IP-based rate limiting"
Cohesion: 0.40
Nodes (5): Next.js 16 Breaking Changes Warning, Edge Proxy (proxy.ts) — IP-based rate limiting, Next.js 16 Breaking Changes (proxy.ts, request.ip removal, bundler module resolution), Rate Limiting (proxy.ts + rateLimit.ts, 30 req/min/IP), README Security Architecture (rate limiting + short TTL caching)

### Community 12 - "scenarios/route.ts"
Cohesion: 0.43
Nodes (5): numericIds(), parseConstraints(), POST(), { buildPlanningWorkspaceMock, loadConfirmedSquadImportMock, persistPlanningRunMock }, importedSquad

### Community 13 - "FPL Dashboard user guide"
Cohesion: 0.05
Nodes (44): 10. Why a surprising player may start, 11. Save My Plan, 12. Apply the plan on official FPL, 13. Understand plan verification, 14. Remaining free transfers, 15. Chip opportunities, 16. AI plan explanation, 17. Team News (+36 more)

### Community 14 - "steps"
Cohesion: 0.05
Nodes (41): default, description, required, ESCALATE, ESCALATION_REASON, HISTORY_OUTCOME, SMOKE_BASE_URL, SMOKE_HISTORY_FILE (+33 more)

### Community 15 - "FPL Dashboard system documentation"
Cohesion: 0.05
Nodes (38): 10. My Plan and verification, 11. Chip opportunity guidance, 12.1 Saved-plan explanation, 12.2 Curated Team News pilot, 12.3 Cost and observability, 12. AI-assisted features, 13. Backtest and replay, 14. Persistence model (+30 more)

### Community 16 - "Implementation Plan — Frontend UI (mobile-first, glassmorphism dark-mode)"
Cohesion: 0.50
Nodes (4): Styling Conventions (Tailwind CSS 4 + CSS Modules + CSS Variables dark-mode-first), Implementation Plan — Frontend UI (mobile-first, glassmorphism dark-mode), Rationale: Mobile-First Design (80%+ traffic via mobile during live matches), Requirements Spec — Non-Functional Requirements (latency <2s, 99.9% uptime, mobile-first, 10x surge scalability)

### Community 17 - "FPL Dashboard 2026–27 — As-built architecture and product design"
Cohesion: 0.06
Nodes (30): Automated readiness, Deadline-day check, FPL 2026–27 launch runbook, Privacy boundary, Recovery, Release identity, Rollback, Availability and operations (+22 more)

### Community 18 - "steps"
Cohesion: 0.06
Nodes (34): LIVE_FPL_ENTRY_ID, PLAYWRIGHT_LIVE_BASE_URL, RUN_LIVE_FPL_E2E, live_base_url, run_live_fpl, jobs, test, description (+26 more)

### Community 19 - "import/page.tsx"
Cohesion: 0.11
Nodes (21): BootstrapPayload, BootstrapPlayer, BootstrapTeam, positions, payload, FplSquadImportPage(), PlayerRow(), buildFplAutoSyncUserscript() (+13 more)

### Community 20 - "FPL Dashboard Playwright Test Strategy — Phase 1 Discovery"
Cohesion: 0.07
Nodes (30): Application shape, Architecture, Calculation logic, CI/CD and operational tests, Data architecture, Execute and diagnose, Existing testing, External presentation assets (+22 more)

### Community 21 - "FixtureTicker.tsx"
Cohesion: 0.07
Nodes (25): @testing-library/react@^16.3.2, @testing-library/react, CaptaincyAdviser(), Suggestion, difficultyColor(), Fixture, FixtureTicker(), PlayerFixtures (+17 more)

### Community 22 - "package.json"
Cohesion: 0.10
Nodes (27): devDependencies, autoprefixer@^10.4.27, jsdom@^27.0.1, postcss@^8.5.23, release-it@^21.0.2, supabase@^2.114.0, tailwindcss@^4.2.2, @testing-library/dom@^10.4.1 (+19 more)

### Community 23 - "app/page.tsx"
Cohesion: 0.12
Nodes (10): react, LiveSquadData, UserSummary, GameweekHistory(), GWRow, LeagueStandings(), RankData, RankProjection() (+2 more)

### Community 24 - "settings/page.tsx"
Cohesion: 0.14
Nodes (21): GET(), getUserIdFromCookie(), PUT(), OrderTab, PANEL_LABELS, SettingsPage(), mockPrefsResponse, ALL_PANEL_KEYS (+13 more)

### Community 25 - "fplSquadImport.ts"
Cohesion: 0.14
Nodes (22): dynamic, GET(), decodeBase64Url(), decodeFplSquadImport(), encodeBase64Url(), encodeFplSquadImport(), FPL_SQUAD_IMPORT_MAX_ENCODED_LENGTH, FPL_SQUAD_IMPORT_SCHEMA_VERSION (+14 more)

### Community 26 - "planning/sync/route.ts"
Cohesion: 0.18
Nodes (10): BootstrapPayload, corsHeaders, OPTIONS(), position(), POST(), response(), importedSquad, { resolveTokenMock, fetchFplJsonMock, saveImportMock } (+2 more)

### Community 27 - "Testing and Documentation Governance"
Cohesion: 0.20
Nodes (10): Bug workflow, Change triggers, Definition of done, Document lifecycle, Feature retirement workflow, Keeping inventory accurate, Ownership and exceptions, Purpose (+2 more)

### Community 28 - "workspace.ts"
Cohesion: 0.10
Nodes (21): assertApiPath(), fetchFplJson(), FplRequestOptions, FplUpstreamError, { fplFetchMock }, wait(), selectPublishedSquadGameweek(), asPosition() (+13 more)

### Community 29 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 30 - "steps"
Cohesion: 0.12
Nodes (16): runs-on, steps, jobs, build-and-test, name, on, pull_request, push (+8 more)

### Community 31 - "DashboardShell"
Cohesion: 0.23
Nodes (11): DashboardShell(), loadDashboard(), GwModeIndicator(), Props, getStoredModeOverride(), GwMode, isAutoModeTransition(), setStoredModeOverride() (+3 more)

### Community 32 - "HistoryChart.test.tsx"
Cohesion: 0.18
Nodes (7): recharts@^3.8.1, recharts, chipLabels, CustomTooltip(), HistoryChart(), mockHistory, mockSummary

### Community 37 - "rateLimit.ts"
Cohesion: 0.19
Nodes (9): @upstash/redis@^1.38.3, @upstash/redis, createRateLimit(), hasRedisConfig, rateLimit, RateLimitProvider, ReportFailure, config (+1 more)

### Community 38 - "import/route.ts"
Cohesion: 0.38
Nodes (9): authenticatedEntryId(), BootstrapPayload, DELETE(), GET(), position(), POST(), clearConfirmedSquadImport(), loadConfirmedSquadImport() (+1 more)

### Community 39 - "Pull-request process"
Cohesion: 0.33
Nodes (6): 1. Before implementation, 2. During implementation, 3. Before review, 4. During review, 5. After deployment, Pull-request process

### Community 40 - "Agentic Playwright Testing Handbook"
Cohesion: 0.09
Nodes (23): Adding or changing a test, Agentic Playwright Testing Handbook, Agentic workflow, Authentication and privacy boundary, CI and monitoring, Controlled authenticated dashboard, Current browser coverage, Current limitations (+15 more)

### Community 41 - "fplImportProbe.ts"
Cohesion: 0.33
Nodes (8): FplImportProbePage(), buildFplProbeBookmarklet(), decodeBase64Url(), decodeFplImportProbe(), encodeBase64Url(), encodeFplImportProbe(), FplImportProbe, probe

### Community 42 - "dependencies"
Cohesion: 0.18
Nodes (11): dependencies, next@^16.3.1, react@19.2.4, react-dom@19.2.4, @supabase/supabase-js@^2.100.1, @tailwindcss/postcss@^4.2.2, @upstash/ratelimit@^2.0.8, react-dom (+3 more)

### Community 43 - "PlanningBacktest.tsx"
Cohesion: 0.50
Nodes (4): Backtest, chipNames, PlanningBacktest(), signed()

### Community 44 - "Agentic Playwright Pilot Evaluation"
Cohesion: 0.20
Nodes (10): Adoption boundaries, Agentic Playwright Pilot Evaluation, Executive result, Healing quality, Live integration result, Maintenance value, Recommended follow-up, Test quality (+2 more)

### Community 45 - "scripts"
Cohesion: 0.20
Nodes (10): scripts, build, dev, lint, release, start, test, test:e2e (+2 more)

### Community 46 - "LeagueLive.tsx"
Cohesion: 0.24
Nodes (6): LeagueData, LeagueLive(), LeagueRival, ComparisonData, ComparisonPlayer, RivalCompare()

### Community 47 - "publish-team-news.mjs"
Cohesion: 0.42
Nodes (7): main(), normalize(), requireValue(), schema, signals, timestamp(), validate()

### Community 48 - "1. Unauthenticated entry"
Cohesion: 0.22
Nodes (8): 1.1 Show the Team ID login form, 1.2 Reject a non-numeric Team ID locally, 1. Unauthenticated entry, 2.1 Return a structured readiness response, 2. Public health contract, Deferred follow-up, Initial Playwright smoke plan, Scope

### Community 49 - "TransferAnalyser.tsx"
Cohesion: 0.31
Nodes (7): difficultyColor(), Fixture, FixtureTicker(), getJerseyIconUrl(), SortKey, Transfer, TransferAnalyser()

### Community 50 - "Scheduled health reviews"
Cohesion: 0.50
Nodes (4): After major releases, Before each season / GW1, Quarterly, Scheduled health reviews

### Community 53 - "Weekly Planning Workspace — Target Architecture"
Cohesion: 0.25
Nodes (7): Current vertical-slice limitations, Dependency direction, Identity, Migration, Server boundaries, Snapshot rules, Weekly Planning Workspace — Target Architecture

### Community 58 - "ADR 003: Authenticated squad import contract"
Cohesion: 0.29
Nodes (6): ADR 003: Authenticated squad import contract, Consequences, Context, Decision, Phase 4 integration, Phase 5 lifecycle

### Community 59 - "Local Playwright FPL authentication setup"
Cohesion: 0.29
Nodes (6): Local Playwright FPL authentication setup, Next automation step, One-time setup, Re-authenticate, Security boundary, Verify Git protection

### Community 60 - "Live FPL integration pilot"
Cohesion: 0.29
Nodes (6): Assertions, Failure interpretation, Live FPL integration pilot, Local execution, Purpose, Safety boundary

### Community 63 - "ADR 004: Browser-mediated FPL integration"
Cohesion: 0.33
Nodes (5): ADR 004: Browser-mediated FPL integration, Consequences, Context, Decision, Write boundary

### Community 66 - "eslint.config.mjs"
Cohesion: 0.33
Nodes (5): eslintConfig, eslint@^9, eslint-config-next@^16.3.1, eslint, eslint-config-next

### Community 67 - "pull_request_template.md"
Cohesion: 0.33
Nodes (5): Deployment and rollback, Tests and documentation, User outcome, Validation, What changed

## Knowledge Gaps
- **34 isolated node(s):** `League & Sync Routes`, `Implementation Plan — API Proxy Layer (initial 4 routes)`, `Rationale: No Client-Side FPL Calls (CORS avoidance + server-side transformation)`, `Rationale: Session-Based Proxy Auth (FPL API lacks OAuth 2.0, credentials never stored in plain text)`, `Requirements Spec — API Contract Specification (REST JSON endpoints)` (+29 more)
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 551 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **20 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `next` connect `next` to `layout.tsx`, `importStore.ts`, `import/route.ts`, `rateLimit.ts`, `reproducibilityStore.ts`, `dependencies`, `PlanningWorkspaceV2.tsx`, `scenarios/route.ts`, `import/page.tsx`, `package.json`, `app/page.tsx`, `settings/page.tsx`, `planning/sync/route.ts`?**
  _High betweenness centrality (0.132) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `fplFetch()` (e.g. with `Live football data` and `Fixed (details)`) actually correct?**
  _`fplFetch()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **What connects `League & Sync Routes`, `Implementation Plan — API Proxy Layer (initial 4 routes)`, `Rationale: No Client-Side FPL Calls (CORS avoidance + server-side transformation)` to the rest of the system?**
  _34 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Next.js API Proxy & Transformation Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.057004830917874394 - nodes in this community are weakly interconnected._
- **Why does `FPL Dashboard Playwright Test Strategy — Phase 1 Discovery` connect `FPL Dashboard Playwright Test Strategy — Phase 1 Discovery` to `testing/README.md`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._
- **Should `next` be split into smaller, more focused modules?**
  _Cohesion score 0.06142611683848797 - nodes in this community are weakly interconnected._
- **Why does `Live football data` connect `FPL Dashboard Playwright Test Strategy — Phase 1 Discovery` to `next`, `workspace.ts`?**
  _High betweenness centrality (0.118) - this node is a cross-community bridge._