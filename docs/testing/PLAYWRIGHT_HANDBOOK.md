# Agentic Playwright Testing Handbook

Status: Active
Last reviewed: 2026-08-18

## Why this exists

FPL Dashboard helps a manager make decisions from several systems that change on different schedules: the application, Supabase, official FPL APIs, live match data, and the manager's private pre-deadline squad. A page can remain visually available while presenting the wrong player, captain, fixture, multiplier, Gameweek state, or transfer recommendation.

The browser suite therefore protects decision outcomes, not generic clickability. Its core question is:

> Can the manager reach the product and trust the relationships needed to make an FPL decision?

The suite is intentionally small. Exhaustive calculations belong in Vitest; volatile football facts do not belong in deterministic assertions; production checks assert stable contracts rather than exact ranks, names, points, or fixtures.

## Quality strategy

The test pyramid has four layers:

| Layer | Purpose | Data boundary | Normal trigger |
|---|---|---|---|
| Vitest | Projection, formation, budget, import validation, scenario generation, and component behavior | Fixed local inputs | Every pull request and protected-branch push |
| Deterministic Playwright | Critical user outcomes across the real browser UI | Intercepted application APIs with controlled fixtures | Manual/release workflow and local development |
| Production smoke | Health, release identity, planning contract, access control, and security headers | Deployed read-only contracts | Hourly and manual |
| Gated live Playwright | Real dashboard session plus official FPL lifecycle behavior | Public Team ID and deployed services | Explicit manual opt-in |

An additional local bookmarklet test uses an ignored FPL browser state to prove transport from the authenticated FPL origin to the dashboard review page. It is never part of normal CI.

## Risk model

- **P0 — unusable:** login, session, core route, dashboard, or critical data fails.
- **P1 — wrong decision:** player identity, squad role, captaincy, projected total, fixture, Gameweek state, budget, formation, or recommendation is incorrect or stale.
- **P2 — useful feature unavailable:** settings, history, leagues, filters, or secondary analysis fails.
- **P3 — cosmetic:** visual polish that does not change meaning or operability.

New browser coverage should normally protect P0 or P1 outcomes. P2 scenarios are added selectively. P3 belongs in manual review unless a recurring visual regression justifies automation.

## Agentic workflow

The repository uses Playwright's native Codex agents in `.codex/agents/`:

1. **Planner** inspects actual code and approved product behavior, then writes a bounded plan under `specs/`.
2. **Generator** creates semantic, outcome-focused tests from that plan.
3. **Execute** starts with the smallest affected spec, then expands to the complete deterministic suite.
4. **Diagnose** classifies the failure before any edit.
5. **Healer** may repair proven locator or synchronization defects only.
6. **Re-run** verifies the individual case and the relevant suite.
7. **Learn** records meaningful healing events and updates documentation when contracts change.

The Healer must not alter fantasy calculations, weaken assertions, suppress API failures, inflate timeouts, skip tests, or edit production logic.

## Current browser coverage

### Public entry and readiness

- Login form is visible and initially safe.
- Non-numeric Team IDs are rejected locally.
- Health returns a structured ready/degraded contract.

### Controlled authenticated dashboard

- Manager summary and complete 15-player squad render.
- Player identity remains attached to role, starting/bench position, captain, and vice-captain.
- Controlled live points and multipliers produce the displayed projected total and lifecycle label.
- Fixture mapping preserves opponent, venue, difficulty, double Gameweek, and blank Gameweek relationships.
- A critical summary failure produces a bounded error state rather than a crash or endless loader.

### Planning

- A server-confirmed imported squad renders Floor, Balanced, and Upside plans.
- Complete XI, bench, captaincy, transfers, hits, bank, and projection values come from the controlled planning contract.
- Locks, exclusions, hit ceiling, and bank reserve are sent correctly on regeneration.
- The browser does not resend the full confirmed squad payload; the server owns the confirmed copy.
- Desktop and mobile execute the same planning outcome.

### Responsive behavior

- The representative iPhone 13 project keeps core dashboard information readable.
- The fixture table remains horizontally operable.

### Gated real integrations

- The deployed live test verifies public-entry login, manager identity, current-picks behavior, and logout cleanup.
- The local bookmarklet test verifies authenticated `/api/me/` and `/api/my-team/` transport into a 15-player review without confirming or saving the squad.

## Test design rules

### Test stable relationships

Good assertions connect controlled input to user-visible meaning:

- player ID → correct name, team, role, and lineup position;
- multiplier and live points → projected squad total;
- team and fixture → opponent, home/away, difficulty, DGW/BGW;
- planning constraints → generated request and displayed complete plan.

Avoid exact live player names, points, ranks, deadlines, and fixtures. Those can change without an application regression.

### Prefer semantic locators

Use roles, accessible names, labels, and stable test IDs when the element represents a domain concept. Avoid CSS structure and styling classes. A locator change is not permission to reinterpret the expected business outcome.

### Keep fixtures readable

Controlled data lives in `tests/fixtures/fpl-dashboard.fixture.ts` or next to a narrowly scoped spec. Fixtures should contain only enough data to demonstrate the protected relationship. Do not mirror the entire upstream FPL response.

### Keep browser and calculation responsibilities separate

Playwright proves that a critical input-to-display path is wired correctly. Vitest proves exhaustive formation, scoring, transfer, projection, freshness, and validation combinations. Do not duplicate the full calculation matrix in the browser.

## Authentication and privacy boundary

There are three distinct credentials/states:

1. A public numeric FPL Team ID is not a secret.
2. The dashboard issues its own revocable HTTP-only session after verifying that public entry.
3. `playwright/.auth/fpl.json` contains reusable official FPL authentication cookies and must be treated like a password.

The official FPL state:

- remains only at `playwright/.auth/fpl.json`;
- is ignored by `/playwright/.auth/` in `.gitignore`;
- is rejected by CI if tracked or if the ignore rule disappears;
- is used only by explicitly enabled local auth/bookmarklet projects;
- must never be uploaded as a Playwright artifact, pasted into chat, or stored in an environment variable.

The bookmarklet sends a validated squad contract, not passwords, cookies, or session tokens. Confirmation saves the contract server-side against the dashboard manager session. Official FPL account writes are prohibited by ADR 004.

## Running the tests

Install dependencies and Playwright browsers once:

```bash
npm ci
npx playwright install
```

Run the normal gates:

```bash
npm test
npm run lint
npx tsc --noEmit
npm run test:e2e
```

Run a focused browser spec while developing:

```bash
npx playwright test tests/e2e/planning/confirmed-squad-planning.spec.ts
```

Run the non-destructive deployed smoke contract:

```bash
npm run test:smoke
```

The live and bookmarklet commands, prerequisites, and safety warnings are maintained in the dedicated live-integration and authentication documents. Do not make those projects discoverable by the default Playwright run.

## CI and monitoring

`.github/workflows/ci.yml` runs dependency installation, authentication-state guards, lint, Vitest, and a production build on pull requests and protected-branch pushes.

`.github/workflows/e2e.yml` runs the deterministic browser matrix manually and on published releases. It can include the bounded live project only when explicitly requested with a valid HTTPS deployment URL and approved public entry secret. Reports, failure evidence, and healing history are retained; authentication state is never an artifact.

`.github/workflows/production-smoke.yml` runs hourly and manually. It performs no login and no writes. It verifies health, release identity, planning availability, import-contract readiness, unauthenticated API protection, and security headers.

## Failure diagnosis

Classify every failure before changing code:

| Classification | Meaning |
|---|---|
| `APPLICATION_REGRESSION` | Product behavior differs from the approved contract |
| `DATA_CHANGE` | External football shape/lifecycle changed |
| `LOCATOR_DRIFT` | Outcome is correct but automation can no longer locate it |
| `TIMING_FLAKE` | Valid state exists but synchronization is wrong |
| `API_FAILURE` | Application or upstream endpoint failed |
| `TEST_DATA` | Controlled fixture is invalid or incomplete |
| `REQUIREMENT_CHANGE` | Approved product behavior changed |
| `ENVIRONMENT` | Credentials, service configuration, browser, or infrastructure is unavailable |
| `UNKNOWN` | Evidence is insufficient; investigate before editing |

Every test attaches `runtime-evidence.json` with the final URL, console errors, and failed/error responses. Failures additionally retain screenshot, video, trace, and Playwright context. Review this evidence before invoking the Healer.

## Adding or changing a test

1. Identify the user decision and P0–P3 risk.
2. Decide whether Vitest, deterministic Playwright, production smoke, or gated live coverage is the smallest correct layer.
3. Write or update a bounded plan when introducing a new journey.
4. Use fixed application responses unless the purpose is explicitly integration monitoring.
5. Assert business relationships, not incidental markup.
6. Run the focused test, relevant unit tests, and then the full deterministic browser suite.
7. Confirm `playwright/.auth/fpl.json` remains ignored and untracked.
8. Update this handbook when the suite boundary or operational contract changes.

## Maintenance policy

The required change-management process is defined in [Testing and Documentation Governance](./TESTING_GOVERNANCE.md). Apply its change-trigger matrix and definition of done to every feature, usability change, bug fix, experiment, and retirement.

- Review the suite quarterly and remove redundant or superficial cases.
- Run the live pilot after meaningful deployment changes and after the first active Gameweek to exercise the published 15-player path.
- Keep the browser matrix to desktop Chromium and one representative mobile profile until evidence justifies expansion.
- Keep live checks manual while they create dashboard session records or depend on season lifecycle.
- Record only real Healer interventions in `test-results/healing-history.json`.
- Treat Next.js rewriting `AGENTS.md` during `next dev` as generated worktree noise and restore unrelated changes before handoff.

## Current limitations

- Local authenticated routes require Supabase configuration; deterministic API interception is the normal local browser boundary.
- The production live test can observe either published picks or a valid upcoming/no-active state depending on the season lifecycle.
- The bookmarklet relies on undocumented authenticated FPL endpoints and a user gesture, so it requires monitoring and remains read-only.
- No broad cross-browser or visual-regression matrix is maintained.
- Exact official auto-substitution edge cases and projection heuristics remain unit/domain-test responsibilities.
