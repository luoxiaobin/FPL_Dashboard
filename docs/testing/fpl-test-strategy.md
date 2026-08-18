# FPL Dashboard Playwright Test Strategy — Phase 1 Discovery

> Historical discovery record. For the current test architecture, coverage, commands, security boundary, and maintenance process, use the [Agentic Playwright Testing Handbook](./PLAYWRIGHT_HANDBOOK.md).

## Status and scope

This document records repository-based discovery for the agentic Playwright pilot. It proposes a small Phase 2 but does not implement it. The repository, rather than older product documentation, is the source of truth.

## Architecture

### Application shape

- Next.js 16.3.1 App Router application using React 19.2.4 and TypeScript.
- The browser UI is composed of client components under `src/app` and `src/components`.
- Next.js route handlers under `src/app/api/v1` form the backend-for-frontend. The browser does not call the official FPL API directly.
- `src/proxy.ts` rate-limits `/api/v1/*` requests per inferred client IP to 30 requests per minute. This is process-local rather than distributed.
- The production deployment documented by the repository is Vercel.
- Supabase provides persistence for users, opaque hashed sessions, user preferences, synchronized historical data, recommendation evaluation logs, and confirmed planning-squad imports.

### Routes and user surfaces

- `/login`: public numeric FPL Team ID login.
- `/`: authenticated dashboard shell. An unauthenticated summary response redirects the browser to `/login`.
- `/settings`: authenticated panel visibility and ordering preferences.
- `/planning`: scenario-based five-Gameweek planning workspace. It is available in development and feature-flagged in production.
- `/planning/import`: confirmed-squad import/review flow used when current public picks are unavailable.
- `/planning/import/probe`: feasibility/probe surface for the browser-mediated import mechanism.
- `/api/v1/health`: public configuration, database, upstream FPL, and release-readiness contract.
- Authenticated API groups cover user summary/history/transfers/preferences, live squad, fixtures, captaincy suggestions, transfer optimization, rank projection, leagues, data sync, and planning.

### Main UI composition

The dashboard selects either a live or planning panel order. It renders:

- manager, rank, score, bank, team value, and transfer summary;
- Gameweek mode indicator with a session-scoped manual override;
- live squad in pitch and list representations;
- fixture ticker for starting XI and bench;
- captaincy adviser and market target;
- transfer optimizer and historical transfer analyser;
- rank projection;
- mini-league standings, live standings, and rival comparison;
- season history and Gameweek history;
- sync status;
- settings-driven panel visibility/order.

There is no interactive transfer builder on the main dashboard. The implemented planning workspace generates Floor, Balanced, and Upside scenarios from constraints and current/imported squad data.

## User journeys

1. Enter a public numeric Team ID and establish a server-backed session.
2. Open the dashboard and understand current manager status: Gameweek mode, live/official score, rank, budget, and transfers.
3. Verify the 15-player squad, starting XI, bench, captain, vice-captain, live points, bonus/BPS, and projected total.
4. Review the next five Gameweeks for each owned player, including home/away opponent, fixture difficulty, double Gameweeks, blanks, availability, and club form.
5. Compare captain, vice-captain, alternative, and market-target recommendations for the target Gameweek.
6. Review suggested transfers and expected advantage, then inspect historical transfer impact.
7. Review projected rank movement against Gameweek average and rank tiers.
8. Review mini-leagues, live re-ranked standings, hits, and rival player differentials.
9. Switch between planning and live dashboard modes and retain the override during the browser session.
10. Configure visible sections and panel ordering.
11. Generate five-Gameweek Floor, Balanced, and Upside planning scenarios with locks, exclusions, hit limits, and bank reserve.
12. Import and confirm a current 15-player squad when public current-Gameweek picks are unavailable.

The application does not currently expose a general player-details page, arbitrary player comparison screen, or manual captain/vice-captain selection workflow. Tests should not invent those journeys.

## Data architecture

### Live football data

The backend fetches JSON from the official Fantasy Premier League service through `fplFetch` and `fetchFplJson`. Important upstream resources include:

- bootstrap data for events, players, teams, positions, total managers, availability, price, form, and official expected points;
- entry metadata and history;
- Gameweek picks and transfer state;
- Gameweek live player statistics;
- fixtures and fixture difficulty;
- classic league standings;
- per-player summaries.

`fetchFplJson` validates upstream paths, applies abort timeouts, performs bounded retries, and converts failures to a typed upstream error. Some endpoints use Next.js revalidation; the live-squad route also has a 15-minute process-local bootstrap cache.

### Persistence and authentication

- Login verifies a public entry against FPL, upserts a user, creates a random session token, stores only its SHA-256 hash in Supabase, and sets an HTTP-only strict SameSite cookie.
- Authenticated APIs resolve the FPL entry ID through that session record.
- Supabase tables used by current code include users, FPL sessions, preferences, gameweeks, players, squads, squad players, recommendation logs, and confirmed squad imports.
- Confirmed squad imports are validated, stored server-side, and expire around the active Gameweek deadline.

### External presentation assets

Player imagery and Premier League badges are fetched from Premier League resources with transparent/fallback behavior. Their availability should not determine whether core business tests pass.

### Recommended test-data boundary

- Deterministic layer: intercepted backend responses or controlled fixtures for squad mapping, calculations, Gameweek state, fixtures, errors, planning, and responsive behavior.
- Live-integration layer: a very small smoke check of `/api/v1/health` and, when credentials and a safe test entry are supplied, one authenticated pipeline check. Live tests must assert shape and internal consistency, not exact volatile player totals.

## Calculation logic

The following implemented rules deserve deterministic protection:

1. **Live projected squad total** — starters contribute `live_points × multiplier`; finished zero-minute starters are removed and available bench points are added in bench order. This implementation is an approximation and does not visibly enforce positional legality during auto-substitution.
2. **Point lifecycle** — squad status is live, provisional when all fixtures are finished/provisional, and official only when the event is finished and data checked.
3. **Captain presentation** — multiplier affects projected points; the pitch shows captain and conditional vice-captain state.
4. **Fixture mapping** — player team maps to correct opponent, home/away state, difficulty, next-five-Gameweek window, DGW, BGW, role, availability, and club form.
5. **User summary** — bank and team value scale tenths to millions; chip availability is split into Gameweeks 1–19 and 20–38; three-Gameweek rank trend uses a five-percent threshold; event state drives dashboard mode.
6. **Captaincy suggestions** — ranking combines current player form/ICT and fixture context, labels the top three squad players, normalizes confidence to the top score, and identifies an out-of-squad market target.
7. **Transfer optimizer** — compares same-position replacements using expected-next values, selling prices, available bank, and records recommendation outcomes. Its V1 nature and external inputs make deterministic API fixtures essential.
8. **Rank projection** — starter live totals include multipliers; rank movement uses rank-band heuristics and Gameweek average; final data bypasses projection.
9. **Live mini-league standings** — current live points and transfer hits are recombined with pre-Gameweek totals before re-ranking.
10. **Planning projection** — start probability, form baseline, official next expected points, fixture factor, floor, ceiling, uncertainty, and five-Gameweek totals.
11. **Planning constraints** — exactly 15 players, at most three per club, same-position transfers, locked/excluded players, available bank and reserve, free transfers, four-point hits, and a maximum of five generated transfers.
12. **Formation and leadership** — generated XI uses 1 goalkeeper, 3–5 defenders, 2–5 midfielders, and 1–3 forwards; highest strategy score becomes captain and second-highest vice-captain; captain score is added once more.
13. **Imported squad validity** — 2 goalkeepers, 5 defenders, 5 midfielders, 3 forwards; 11 legal starters; three-player club limit; matching entry; valid players; freshness; and deadline expiry.

Most pure planning rules already have unit coverage. Browser tests should verify only their critical input-to-displayed-result path rather than duplicate every combination.

## Existing testing

### Vitest

- 26 test files and 129 passing tests at discovery time.
- Pure logic coverage includes projection modeling, scenario generation, imported-squad validation, import contracts, club form, panel ordering, release identity, Gameweek mode, and supporting utilities.
- Component coverage includes dashboard authentication gating, live squad views, squad pitch behavior, fixture/history scrolling, planning workspace, settings ordering, import UI, transfer optimizer rendering, build info, and error handling.
- The suite passes, but Recharts emits non-failing zero-size warnings under jsdom.

### Playwright

- Installed `@playwright/test` and CLI version: 1.62.1.
- The CLI advertises native `codex` support for `playwright init-agents`.
- Planner, Generator, and Healer definitions exist under `.codex/agents`, each connected to Playwright's test MCP server.
- `playwright.config.ts` currently runs desktop Chromium only, starts/reuses `npm run dev`, uses a local base URL, captures screenshots on failure, and traces on first retry.
- The current browser suite has three passing tests: login form structure, local rejection of a non-numeric Team ID, and the public health response contract.
- The seed test establishes the unauthenticated login page.

### CI/CD and operational tests

- Pull requests and pushes run lint, Vitest, and production build on Node 24.
- A Playwright workflow runs manually and for published releases, installs browsers, executes the browser suite, and uploads `playwright-report`. The current config uses the GitHub reporter in CI, so artifact/report alignment should be confirmed before relying on the upload.
- A separate hourly and manually triggered non-destructive production smoke script checks readiness, feature flags, unauthenticated protection, and security headers.

## Gaps

1. No authenticated browser test proves the dashboard can turn API data into a correct, usable squad view.
2. No deterministic browser fixture joins summary, picks, live stats, teams, fixtures, captaincy, and displayed values.
3. No mobile Playwright project exists despite mobile-oriented component styles and scroll behavior.
4. Error behavior is inconsistently visible: several secondary widgets deliberately disappear on API failure, making outage diagnosis difficult at the browser level.
5. Live projected auto-substitution appears simpler than official formation-aware rules; product intent is not documented clearly enough to encode a stronger expectation.
6. Rank projection and recommendation algorithms are heuristics. Their product promises and acceptable tolerances are not defined.
7. No browser coverage exists for settings persistence, mode override, planning constraints, squad import, league navigation, or logout.
8. No standard deterministic fixture factory or authenticated storage-state setup exists.
9. `test-results/healing-history.json` does not exist; it should be created only when the healing pilot starts, not as empty discovery ceremony.
10. Failure evidence configuration does not explicitly retain video, console errors, failed requests, current URL, or classification. Trace and screenshot provide only part of the requested evidence.
11. The generated Healer instructions permit `test.fixme()` when failures persist, which conflicts with this pilot's stricter rule against skipping failures. The local agent instruction should be tightened before the healing experiment.
12. The current local health endpoint is degraded without Supabase credentials even when the FPL upstream is healthy. Authenticated local E2E therefore needs controlled API interception or a dedicated test service configuration.

## Risk matrix

| Priority | Risk | Why it matters | Best initial layer |
|---|---|---|---|
| P0 | Login/session or dashboard summary fails | User cannot enter the product | Deterministic Playwright plus one live smoke |
| P0 | Core squad endpoint fails or dashboard crashes | Main product is unusable | Deterministic Playwright |
| P0 | Upstream/API outage becomes an indefinite or blank UI | User cannot distinguish loading from failure | Deterministic Playwright |
| P1 | Player identity, team, role, starting/bench position, captain, or vice-captain is mismapped | User makes decisions from the wrong squad state | Deterministic Playwright |
| P1 | Projected total mishandles multiplier, bench, or finished zero-minute player | Displayed live score is wrong | Unit/API tests plus one displayed-result Playwright test |
| P1 | Fixture opponent, home/away, DGW/BGW, or Gameweek window maps to the wrong player/team | Captaincy and transfer decisions are wrong | Unit/API fixtures plus Playwright display test |
| P1 | Planning scenario violates formation, budget, club, lock, exclusion, or hit constraints | Recommended plan may be illegal or misleading | Existing unit tests plus one Playwright scenario contract |
| P1 | Stale imported squad is accepted or shown as current | Planning uses invalid data | Unit/API tests plus targeted Playwright error path |
| P1 | Live/planning mode or point lifecycle is wrong | User interprets provisional data as final/current | Deterministic Playwright |
| P1 | Recommendation or rank heuristic changes unnoticed | Advice changes materially | Deterministic unit/API contract; avoid live numeric assertion |
| P2 | Settings order/visibility is not retained | Personalization is broken | Playwright |
| P2 | League, history, chart, or transfer-analysis panel fails | Useful context is unavailable | Selective Playwright/component tests |
| P2 | Mobile tables/pitch cannot be read or scrolled | Mobile decision workflow is impaired | Mobile Playwright |
| P3 | Badge/image fallback or minor styling regresses | Cosmetic degradation only | Visual/manual check unless recurrent |

## Proposed Playwright architecture

### Planner

- Explore one bounded business journey at a time against deterministic data.
- Save an approved plan under `specs/` with explicit source data, user outcome, and P0/P1 rationale.
- Identify whether each assertion protects application logic or merely observes live external data.

### Generator

- Generate one test per approved scenario, using semantic locators and route interception for volatile/authenticated APIs.
- Keep fixtures small and human-readable. Assert relationships: correct player to club/position/fixture, source inputs to displayed totals, and scenario constraints to rendered outcome.
- Avoid a page-object layer until repetition is demonstrated.

### Execute and diagnose

- Run the smallest affected spec first, then the pilot suite.
- Classify every failure as `APPLICATION_REGRESSION`, `DATA_CHANGE`, `LOCATOR_DRIFT`, `TIMING_FLAKE`, `API_FAILURE`, `TEST_DATA`, `REQUIREMENT_CHANGE`, `ENVIRONMENT`, or `UNKNOWN` before editing.
- Preserve trace, screenshot, URL, failing step, console errors, and failed requests when relevant.

### Healer

- Permit changes only for proven locator drift, synchronization, or harmless automation implementation defects.
- Forbid assertion weakening, skips, timeout inflation, expected-calculation changes, hidden API failures, and production-code edits.
- Record actual healing events in `test-results/healing-history.json` and inspect the diff before accepting a repair.

### Projects

- Keep desktop Chromium.
- Add one representative mobile project, preferably Playwright's iPhone 13 profile, after deterministic authenticated setup exists.
- Do not add a broad browser matrix during the pilot.

## Initial test scope

Recommended Phase 2 scope is eight tests total, including the three already present.

| Rank | Priority | Scenario | Data mode | User outcome protected |
|---|---|---|---|---|
| 1 | P0 | Authenticated dashboard renders a controlled manager summary and exactly the controlled squad structure | Deterministic intercepted APIs | The main dashboard is usable and bound to the intended entry |
| 2 | P1 | Starting XI, bench, captain, vice-captain, player identity, position, and team remain correctly associated | Deterministic | The user sees the correct squad state |
| 3 | P1 | Controlled live points, multiplier, finished zero-minute starter, and bench input produce the expected displayed projected total | Deterministic | The displayed decision score is internally consistent |
| 4 | P1 | A controlled player's next-five fixtures show correct Gameweek, opponent, home/away, difficulty, DGW, and blank mapping | Deterministic | Fixture-led decisions use the correct schedule |
| 5 | P1 | Live/provisional/official source states produce the correct dashboard score label and mode | Deterministic | Data freshness/status is not misrepresented |
| 6 | P1 | A controlled planning response renders three scenarios whose XI, captaincy, transfers, bank, and hits match the source contract | Deterministic | Planning advice remains legal and explainable |
| 7 | P0 | Critical API failure produces a bounded, understandable dashboard failure state without a crash or endless loading | Deterministic failure injection | Users can identify service failure safely |
| 8 | P2 | Core login/dashboard layout and fixture table remain readable and horizontally operable on a representative mobile viewport | Deterministic | The primary mobile workflow remains usable |

The existing login validation and health contract tests should remain as fast smoke coverage, but they are lower business value than the authenticated deterministic slice.

## Proposed file changes for Phase 2

No Phase 2 files are changed by this discovery report. After approval, make a small reviewable change set:

- Modify `playwright.config.ts` to add the mobile project and fuller failure evidence policy.
- Modify `.codex/agents/playwright_test_healer.toml` to remove permission to skip persistent failures and encode the required classifications.
- Add `tests/fixtures/fpl-dashboard.fixture.ts` for controlled summary, live squad, fixtures, preferences, and planning responses.
- Add `tests/helpers/authenticated-dashboard.ts` only if repeated route/session setup warrants it.
- Add focused specs under `tests/e2e/dashboard`, `tests/e2e/planning`, and `tests/e2e/responsive` rather than a large taxonomy.
- Update `specs/initial-smoke-plan.md` or add one approved authenticated pilot plan under `specs/`.
- Create `test-results/healing-history.json` only when recording the first real healing event; decide whether history belongs in version control while ordinary test artifacts remain ignored.
- Align the CI reporter with the uploaded Playwright artifact, or upload traces/test results instead of a nonexistent HTML report.

## Healing experiment

Use one temporary test-only locator drift after the baseline authenticated squad test passes:

1. Start with a semantic assertion locating the `Substitutes` heading by role/name.
2. On a temporary branch, change only the test locator to an obsolete name such as `Bench` while leaving production untouched.
3. Run the single test and require diagnosis before editing.
4. Expected classification: `LOCATOR_DRIFT`, with high confidence because the current accessible heading and correct rendered squad are visible in the trace/snapshot.
5. Allow the Healer to restore the semantic locator to `Substitutes`.
6. Verify it changes only the test, does not weaken assertions or add waits/skips, records the event, and passes both the single test and pilot suite.
7. Discard the artificial branch/change after evaluating the result.

This tests the Healer's safety without introducing a production or fantasy-calculation defect.

## Questions and unknowns

1. Is there a dedicated non-sensitive FPL entry and Supabase environment suitable for an authenticated live smoke, or should all authenticated pilot tests intercept the backend?
2. Is the live projected auto-substitution intentionally an approximation, or must it enforce official positional formation and goalkeeper substitution rules?
3. Should the vice-captain multiplier transfer be represented when a captain does not play, or is that expected to arrive already encoded in FPL's pick multiplier?
4. What accuracy promise should users infer from the rank projection, captaincy confidence, expected gain, and Floor/Balanced/Upside labels?
5. Is silent disappearance the desired UX for fixture, optimizer, captaincy, and other secondary API failures?
6. Should the production planning workspace be part of the pilot while its feature flag is off by default?
7. Which mobile device/browser represents actual usage? iPhone 13 is proposed only as a practical default.
8. Should browser tests verify official FPL rules exactly, or only the rules currently implemented and documented by this repository?
9. Is `recommendation_logs` test data disposable in a dedicated environment, or must optimizer evaluation remain fully mocked during the pilot?

## Phase 1 recommendation

Proceed to Phase 2 only after resolving the test-data/authentication boundary and the auto-substitution intent. The strongest pilot is a deterministic authenticated dashboard slice plus one mobile check, with live data restricted to a small readiness/pipeline smoke. This protects fantasy-decision correctness without coupling the suite to changing football results.
