# FPL Dashboard 2026/27 Season Readiness Assessment and Plan

**Assessment date:** 2026-07-17  
**Target season:** 2026/27  
**Season window:** 2026-08-21 to 2027-05-30  
**Status:** Ready for implementation planning; official FPL launch contract still pending

## Executive assessment

The app is healthy on its current codebase (103 unit tests pass, the production build passes, and lint has no errors), but it is **not yet safe for the 2026/27 rollover**.

The main risk is not the frontend. It is that official FPL identifiers such as entry IDs, player IDs, team IDs, and gameweek numbers are treated as globally stable even though they are season-local. The API routes also independently infer the current gameweek, directly call FPL, and assume picks always exist. During the preseason reset these assumptions can return the wrong season's data, fail on unavailable picks, or overwrite historical records.

The correct update is a two-stage release:

1. **Rollover-safe release before FPL launches:** preserve 2025/26 history, introduce explicit season and gameweek context, centralize upstream access, and make every screen tolerate preseason/unavailable states.
2. **Contract-confirmation release after FPL launches:** capture the real 2026/27 API payloads and rules, update schemas and scoring mappings, refresh club/player assets, test with a new entry ID, and enable live features.

Do not apply `supabase/migrations/202607170001_season_aware_schema.sql` in its current form.

## Confirmed 2026/27 facts

- The Premier League season begins Friday 21 August 2026 and ends Sunday 30 May 2027.
- It remains a 38-match-round competition: 33 weekends and five midweek rounds.
- Coventry City, Ipswich Town, and Hull City replace Wolverhampton Wanderers, Burnley, and West Ham United.
- Fixture dates and FDR information are published, but the official 2026/27 FPL game and its final data contract have not launched as of this assessment.
- Nine Premier League clubs are in European competition, increasing rotation and fixture-rescheduling pressure. Fixture data must remain dynamic rather than being copied into code.

## System map and rollover exposure

### Upstream FPL boundary

Every route currently talks to the unofficially documented public FPL JSON endpoints directly. Fetch behavior, retries, caching, validation, and error translation therefore differ across routes.

Affected callers:

- Authentication: `auth/login`
- Dashboard: `user/summary`, `user/history`, `squad/live`, `rank-projection`
- Planning: `fixtures`, `squad/suggestions`, `squad/optimize`, `user/transfers`
- Leagues: `leagues`, `leagues/live`, `leagues/compare`
- Persistence: `sync`, `cron/evaluate`

The unfinished `src/lib/fpl/client.ts` is the right boundary, but it has not been adopted by these callers and lacks endpoint-specific runtime validation.

### Season and gameweek context

Current routes use several incompatible rules:

- `is_current`, otherwise `is_next`
- `is_current`, otherwise the first event
- hard-coded GW1 fallback
- finished current GW plus one
- hard-coded upper bounds of 38

This produces inconsistent behavior in preseason, between gameweeks, and postseason. The unfinished `resolveGameweekContext()` is a useful start, but the domain needs distinct concepts:

- `season`: the upstream dataset being read
- `scoringGW`: the event whose live/official points are displayed
- `picksGW`: the latest event whose public picks can be fetched
- `planningGW`: the next deadline being planned
- `seasonState`: preseason, before first deadline, live, between gameweeks, or postseason

No route should independently derive these values.

### Persistence model

The current schema uses season-local values as global keys:

- `users.fpl_entry_id` is globally unique
- `players.id` is the primary key
- `gameweeks.id` is the primary key
- squads are unique by user and gameweek only

The unfinished migration adds `season_id` broadly, but has structural problems:

- An app user is made to belong to one season, which loses stable identity and makes preferences awkward across seasons.
- The PostgreSQL check uses `\d`; PostgreSQL's regular expression syntax should use `[0-9]` here.
- It assumes all production constraint names and data conditions without a preflight check.
- It does not establish a clean season-entry identity model.
- It changes primary keys and foreign keys in one irreversible migration with no validation or rollback companion.
- Recommendation player/gameweek references remain insufficiently scoped.

Recommended model:

- `users`: stable app/user identity and preferences
- `seasons`: `2025-26`, `2026-27`, dates, lifecycle status
- `season_entries`: `(season_id, fpl_entry_id)` linked to a stable user
- `teams`, `players`, `gameweeks`: composite season identity or internal UUID plus a season-local upstream ID
- `squads`, `squad_players`, `recommendation_logs`: link through the season entry and season-scoped entities

If the app intentionally has no stable account identity, rename `users` to `season_entries` and move preferences to a separate browser/account identity. Do not represent a season entry as a permanent user.

### Scoring and chips

The unfinished scoring module improves captaincy, vice-captain promotion, Bench Boost, formation-valid auto-subs, and transfer costs. It is still a projection layer, not a replacement for FPL's official totals.

Required safeguards:

- Treat upstream `event/{gw}/live` totals and official entry history as authoritative.
- Label local substitution results as projected until FPL finalizes the gameweek.
- Capture the launch-day chip catalogue instead of hard-coding `bboost`, `3xc`, `wildcard`, and `freehit` phase rules.
- Verify formation constraints, captain multiplier, chip availability/reset rules, scoring fields, and BPS changes against the 2026/27 rules at launch.
- Store raw upstream snapshots for replayable scoring regression tests.

### Frontend state handling

The dashboard currently expects season data to exist. For rollover it needs explicit states rather than generic errors:

- **FPL updating:** upstream bootstrap unavailable or serving transitional data
- **Preseason:** game launched but no entry/picks yet
- **Entry changed:** old cookie contains a 2025/26 entry ID that is invalid in 2026/27
- **Before GW1 deadline:** entry exists but public picks are unavailable
- **Live/provisional/official:** existing matchday lifecycle
- **Between gameweeks:** show last official score and next planning event separately
- **Postseason/archive:** freeze completed season while preserving history

Widgets should receive a shared context response and render unavailable states locally; one missing endpoint should not blank the entire dashboard.

## Priority findings

| Priority | Finding | Consequence if unchanged |
|---|---|---|
| P0 | Season-local IDs are globally keyed | Historical overwrite, constraint failures, or mixed-season data |
| P0 | No single gameweek context | Wrong picks/live/planning GW during rollover boundaries |
| P0 | Old entry ID remains in the login cookie | Users see 404/error loops after the new game launches |
| P0 | Draft migration is unsafe | Production migration failure or damaged relationships |
| P1 | Direct fetch logic is duplicated across routes | Inconsistent caching, errors, retries, and transitional behavior |
| P1 | Picks availability is assumed | Pre-GW1 and deadline windows fail noisily |
| P1 | Chip and scoring rules are hard-coded | Incorrect 2026/27 summaries and recommendations if rules change |
| P1 | No upstream contract fixtures | API shape changes reach production undetected |
| P2 | Club/player assets are season-stamped manually | Promoted clubs and new players show stale/broken images |
| P2 | Observability is only ad hoc logging | Upstream outages and stale data are hard to distinguish |

## Implementation plan

### Phase 0 — Preserve and baseline

1. Export/back up the production Supabase schema and data.
2. Record row counts and orphan checks for every affected table.
3. Capture sanitized 2025/26 payload fixtures for bootstrap, fixtures, entry, history, picks, live event, and league standings.
4. Tag or record the last known-good 2025/26 deployment.
5. Keep the existing app serving 2025/26 in archive mode while rollover work is tested.

**Exit criteria:** backup restore is demonstrated; current behavior can be regression-tested without live FPL.

### Phase 1 — Establish the season domain

1. Replace the draft migration with additive migrations:
   - create `seasons`
   - create `season_entries`
   - backfill `2025-26`
   - add nullable season references and new composite uniqueness
   - validate backfill
   - only then enforce non-null and retire old uniqueness
2. Keep stable preferences outside season-entry identity.
3. Add repository helpers that require season context for every read/write.
4. Add migration preflight and postflight SQL checks.

**Exit criteria:** 2025/26 and a synthetic 2026/27 dataset coexist without collisions; preference ownership is preserved.

### Phase 2 — Centralize the FPL contract

1. Finish the shared FPL client and move all route fetches behind it.
2. Add endpoint-specific TypeScript types plus runtime validation at the boundary.
3. Standardize timeouts, retry only safe transient failures, cache TTLs, and structured error codes.
4. Distinguish not found, picks unavailable, rate limited, upstream maintenance, invalid payload, and timeout.
5. Add a contract-snapshot script/test that diffs current upstream keys and key enum values against reviewed fixtures.
6. Prevent unbounded in-process cache growth; use bounded cache behavior or platform cache primitives.

**Exit criteria:** no API route directly fetches `fantasy.premierleague.com`; malformed fixtures fail predictably in tests.

### Phase 3 — One gameweek context

1. Harden `resolveGameweekContext()` using deadlines and event flags.
2. Expose season state, scoring GW, picks GW, planning GW, and data freshness through one server helper.
3. Remove route-level fallbacks to GW1, the first event, or `current + 1`.
4. Avoid using wall-clock season inference once a validated bootstrap season is available; persist explicit season metadata.
5. Test every transition, including empty events and contradictory upstream flags.

**Exit criteria:** all routes resolve the same event for the same purpose in every lifecycle state.

### Phase 4 — Update product behavior

1. Refactor `squad/live` to use shared client, context, and scoring projection.
2. Refactor summary/history/fixtures/planning routes next.
3. Refactor league and background routes last, with concurrency limits for rival picks.
4. Add an app-level season banner and transition-safe empty states.
5. Invalidate the old entry cookie when it is not found in the active season and direct the user to enter the new ID.
6. Preserve an explicit archived-season view instead of silently switching old data.
7. Make recommendations unavailable—not fabricated—until required picks, prices, and fixtures exist.

**Exit criteria:** preseason, before-GW1, live, between-GW, and archive scenarios all render useful screens without server errors.

### Phase 5 — 2026/27 launch-day validation

Run this only after the official FPL game launches.

1. Capture and review fresh API payloads before changing mappings.
2. Confirm:
   - all 20 team IDs and promoted/relegated clubs
   - player IDs, positions, prices, and statuses
   - event count and deadline fields
   - chip catalogue and availability rules
   - scoring/live stat keys and bonus behavior
   - entry, history, picks, transfer, and league payload shapes
3. Update runtime schemas and golden fixtures deliberately.
4. Create a real 2026/27 entry and test login, picks availability, sync, and all dashboard routes.
5. Refresh badges, shirt/player image rules, aliases, and cache-version constants.
6. Seed `2026-27` as active only after validation succeeds.

**Exit criteria:** a smoke test using a real new-season entry passes every critical route; no unknown schema keys affecting product logic remain unreviewed.

### Phase 6 — Release and operate

1. Deploy database additions before code that requires them.
2. Run a staging rollover rehearsal with copied/sanitized data.
3. Deploy application changes behind a season-readiness flag.
4. Monitor upstream error code, endpoint, season, gameweek, cache status, and duration without logging personal data.
5. Add a kill switch for recommendations/sync while keeping archived history readable.
6. Run smoke checks at FPL launch, before GW1 deadline, during the first fixture, after provisional bonus, and after GW1 finalization.

**Exit criteria:** no cross-season writes, no elevated route error rate, and official GW1 totals reconcile with the dashboard.

## Test matrix

Minimum automated coverage:

- empty/transitional/malformed bootstrap payloads
- preseason with no `is_current` or `is_next`
- before GW1 with picks returning 404
- live GW with unfinished, provisional, and finished fixtures
- between-GW state with last official and next planning events
- GW38 completion and archived season
- captain no-show and vice promotion
- goalkeeper and formation-valid outfield substitutions
- Bench Boost and Triple Captain discovered from launch contract
- blank/double gameweeks and postponed/rescheduled fixtures
- 2025/26 and 2026/27 identical upstream IDs stored together
- old entry cookie invalidation
- upstream 429, 5xx, timeout, HTML maintenance page, and invalid JSON
- league rival fan-out limits and partial failures
- migration preflight, backfill, constraints, and rollback/restore rehearsal

## Recommended delivery slices

Each slice should be independently deployable:

1. Contract fixtures and lifecycle tests
2. Additive season schema plus backfill validation
3. Shared FPL client adoption for bootstrap/entry/picks
4. Shared gameweek context adoption
5. Live squad scoring integration and state UI
6. Remaining user/planning routes
7. League, sync, and cron routes
8. Launch-day contract refresh and promoted-club assets
9. Staging rehearsal and production rollout

## Definition of ready for GW1

- 2025/26 remains queryable and cannot be overwritten by 2026/27 IDs.
- All upstream access is centralized, validated, cached appropriately, and observable.
- Every route uses the same explicit season/gameweek context.
- A stale 2025/26 entry cookie produces a guided re-login, not an error loop.
- The app works before picks become public.
- Chip/scoring behavior is verified against published 2026/27 rules and live payloads.
- Promoted clubs and current players have valid display assets or robust fallbacks.
- Staging migration and rollover rehearsal pass.
- Critical route smoke tests pass with a real 2026/27 entry.
- GW1 live and official totals reconcile with FPL.

## Immediate next action

Start with Phase 0 and Phase 1. Replace the existing draft migration before wiring it into application code. In parallel, retain the unfinished FPL client, gameweek context, and scoring modules as prototypes, but do not treat them as production-ready until contract fixtures and route integration tests exist.
