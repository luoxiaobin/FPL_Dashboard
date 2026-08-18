# Agentic Playwright Pilot Evaluation

## Executive result

**Recommendation: ADOPT WITH LIMITATIONS**

Use the Planner → Generator → Execute → Diagnose → Healer workflow for a small set of P0/P1 browser journeys whose outcomes can be expressed with deterministic data or stable live relationships. Keep pure fantasy calculations in Vitest and do not allow automated healing to change business expectations, skip failures, or reinterpret volatile football data.

## What worked

- Repository-first discovery identified the real architecture, data sources, calculations, and user journeys before browser coverage expanded.
- A controlled authenticated fixture made squad identity, captaincy, bench association, projected totals, fixtures, lifecycle state, API failure behavior, and mobile scrolling deterministic.
- Semantic Playwright locators produced readable tests and clear failure messages.
- Desktop Chromium plus one mobile profile provided useful coverage without a costly browser matrix.
- Failure evidence now combines final URL, console errors, network failures, screenshot, video, trace, and Playwright's accessibility snapshot.
- The controlled Healer experiment correctly distinguished locator drift from application behavior and repaired only the obsolete test locator.
- The live pilot found a real season-boundary behavior that deterministic tests alone did not expose.

## What did not work well

- Generated Playwright agent files were useful scaffolding, but meaningful test design still required repository-specific judgment about FPL data volatility, authentication, and implemented calculation rules.
- The first evidence hook relied on test status too early in fixture teardown. Path-backed lightweight evidence attached for every executed test proved simpler and more reliable.
- The native Healer configuration initially allowed `test.fixme()`, which was unsafe for this pilot and had to be tightened.
- Running `next dev` rewrites the repository's generated `AGENTS.md` block, creating unrelated worktree noise that must be removed after local browser runs.
- A full live squad assertion cannot run year-round because official current-Gameweek picks may legitimately be unavailable.

## Healing quality

The controlled experiment introduced one harmless test-only change from the accessible heading `Substitutes` to `Bench`.

- Classification: `LOCATOR_DRIFT`.
- Confidence: high.
- Repair: restored one semantic locator.
- Assertions weakened: none.
- Timeouts added: none.
- Tests skipped: none.
- Production changes: none.
- Individual rerun: passed.
- Complete deterministic pilot rerun: passed.

The event is recorded in `test-results/healing-history.json`. This is sufficient evidence that the constrained healing policy can safely handle simple locator drift. It does not prove that autonomous healing is safe for calculation or live-data failures.

## Test quality

The pilot protects user outcomes rather than generic clickability:

- an authenticated manager can reach the dashboard;
- a complete squad remains associated with the correct identity, position, captaincy, and bench state;
- controlled source points produce the expected displayed projected total;
- fixture opponents, venues, double Gameweeks, and blanks remain attached to the intended player;
- critical summary failure ends in a bounded error state;
- the core mobile view and fixture scrolling remain operable;
- live production authentication and current/off-season data state are coherent.

The suite intentionally avoids exact live ranks, points, player names, and fixtures.

## Live integration result

The production pilot ran against the designated public entry `3376378`.

- Login succeeded.
- The dashboard rendered `FPL Manager: Kevin Luo`.
- Production health was ready, including configuration, database, and official FPL upstream checks.
- The official data exposed no active Gameweek/current picks at execution time.
- `/api/v1/squad/live` returned 404 and the dashboard explicitly rendered `No active gameweek right now.`
- The live contract accepted only that exact pairing; an unexplained missing squad would still fail.
- Test-session cleanup ran through the logout endpoint.

The first live run also captured these secondary endpoint failures in the same season-boundary state:

- `POST /api/v1/squad/optimize` returned 500;
- `GET /api/v1/squad/suggestions` returned 500;
- `GET /api/v1/fixtures` returned 500.

These findings were subsequently resolved. Upcoming-Gameweek public-picks 404 responses now produce an intentional `squad_unpublished` state for fixtures, captaincy suggestions, transfer optimization, and rank projection instead of false 500 responses. Confirmed bookmarklet imports can supply the planning engine until official public picks are released.

## Maintenance value

The likely maintenance return is positive when the suite remains small:

- deterministic fixtures isolate product behavior from football-data churn;
- semantic locators reduce selector maintenance;
- failure evidence shortens classification time;
- healing history makes automated changes auditable;
- a gated live check detects integration and lifecycle conditions without destabilizing normal CI.

Value would decrease if the suite duplicated all unit calculations, asserted volatile football values, expanded to a broad browser matrix, or permitted the Healer to rewrite expectations.

## Adoption boundaries

Adopt agentic Playwright for:

- login/session and dashboard availability;
- squad/player/fixture relationship integrity;
- a few displayed calculation paths backed by controlled inputs;
- critical error states;
- representative mobile usability;
- one manually triggered, gated live pipeline check.

Keep manual or deterministic non-browser testing for:

- exhaustive projection and transfer-algorithm combinations;
- official-rule edge cases;
- rapidly changing live football values;
- visual polish unless a recurrent regression justifies snapshots.

Do not allow the Healer to:

- change fantasy calculations or expected outcomes;
- accept changed external data without classification;
- suppress API failures;
- skip tests;
- edit production logic.

## Recommended follow-up

1. Run the live pilot again after an active Gameweek begins to exercise the full published 15-player production path.
2. Store `LIVE_FPL_ENTRY_ID` as a GitHub Actions secret only if this public entry is approved for recurring manual checks.
3. Keep the live workflow manually triggered until several runs demonstrate stability and bounded database impact.
4. Review the suite quarterly and remove superficial or redundant scenarios before adding new ones.
