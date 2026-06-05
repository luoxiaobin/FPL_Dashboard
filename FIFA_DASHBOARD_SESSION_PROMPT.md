# FIFA World Cup 2026 Fantasy Dashboard — Session Handoff Prompt

> Paste this entire file as your first message in the new Claude Code session
> opened from **github.com/luoxiaobin/FIFA_dashboard**

---

## What this project is

A FIFA World Cup 2026 Fantasy analytics dashboard, adapted from an existing
FPL (Fantasy Premier League) Dashboard codebase. The tech stack is:
**Next.js 16, React 19, TypeScript, Supabase, Tailwind CSS 4**.

The repo was cloned from `luoxiaobin/FPL_Dashboard`. Phase 1 adaptation has
already been committed to the `master` branch. Your job is to continue from
there.

---

## Phase 1 — Already done (committed to master)

These files were adapted from FPL → FIFA:

| File | What changed |
|---|---|
| `src/lib/fifaApi.ts` | **New file** — FIFA Fantasy API adapter, types, scoring table, 5 boosters, image helpers, 15-min bootstrap cache |
| `src/app/api/v1/auth/login/route.ts` | Validates against `play.fifa.com/fantasy` |
| `src/app/api/v1/user/summary/route.ts` | FIFA boosters, `$` budget, matchday phase |
| `src/app/api/v1/squad/live/route.ts` | FIFA picks + live points, `matchday` field |
| `src/app/api/v1/fixtures/route.ts` | FIFA fixture schedule, MD labels |
| `src/app/api/v1/user/history/route.ts` | Matchday history from FIFA API |
| `src/app/api/v1/leagues/route.ts` | FIFA league standings |
| `src/app/api/v1/leagues/live/route.ts` | FIFA live league recalc |
| `src/app/page.tsx` | MD labels, `$` budget, FIFA branding |
| `src/app/login/page.tsx` | FIFA Fantasy Team ID prompt |
| `src/components/GwLive.tsx` | `MD{n}` score labels |
| `src/components/FixtureTicker.tsx` | MD headers, "Match Schedule" title |
| `src/lib/playerImage.ts` | FIFA national kit images from `play.fifa.com` CDN |
| `src/lib/sectionPreferences.ts` | Renamed section labels (GW→MD, Fixture Ticker→Match Schedule) |
| `src/app/settings/page.tsx` | Updated panel labels |
| `src/app/layout.tsx` | Updated page title/metadata |

---

## FIFA World Cup 2026 Fantasy — Game Mechanics Reference

### Squad
- **15 players**: 2 GKP, 5 DEF, 5 MID, 3 FWD (different from FPL's 1+4+4+2)
- **11 starters + 4 bench** per matchday
- **Budget**: $100m (increases +$5m at Knockout Phase — applied automatically)
- **Captain**: 2× multiplier (same as FPL)

### Tournament Structure
- **Group Stage**: 3 Matchdays (MD1, MD2, MD3) — June 11–26, 2026
- **Knockout Rounds**: R32, R16, QF, SF, 3rd Place, Final — June 29–July 19
- **Total**: ~10 scoring rounds

### Transfers
- 1 free transfer per matchday
- Can roll 1 over to the next matchday **within** the group stage
- **No rollover** from MD3 → R32 (unlimited transfers open at each knockout round)

### Boosters (5 total — replaces FPL chips WC/BB/TC/FH)
| Internal key | Display name | Effect |
|---|---|---|
| `wildcard` | Wildcard | Unlimited transfers before a deadline (not MD1 or pre-R32) |
| `twelfth_man` | 12th Man | Extra substitute slot for a matchday |
| `max_captain` | Max Captain | Captain earns extra points |
| `qualification_booster` | Qualification Booster | Bonus points for players whose nations advance |
| `mystery_booster` | Clean Sheet Shield | GKP/DEF/MID only lose clean sheet after conceding 2 goals (knockout only) |

### Scoring System
| Action | GKP | DEF | MID | FWD |
|---|---|---|---|---|
| Playing 1–59 min | 1 | 1 | 1 | 1 |
| Playing 60+ min | 2 | 2 | 2 | 2 |
| Goal scored | 6 | 6 | 5 | 4 |
| Assist | 3 | 3 | 3 | 3 |
| Clean sheet (60+ min) | 4 | 4 | 1 | 0 |
| Goal conceded /2 | −1 | −1 | — | — |
| Save /3 | 1 | — | — | — |
| Yellow card | −1 | −1 | −1 | −1 |
| Red card | −3 | −3 | −3 | −3 |
| Own goal | −2 | −2 | −2 | −2 |
| Penalty miss | −2 | −2 | −2 | −2 |
| Goal from outside box | +1 | +1 | +1 | +1 |
| Goal from free kick | +1 | +1 | +1 | +1 |
| Tackle /3 (MID only) | — | — | +1 | — |
| >4pts AND <5% ownership | +2 | +2 | +2 | +2 |

---

## The API Situation

The official FIFA Fantasy game is at **play.fifa.com/fantasy**.

- Its REST API is **not publicly documented** but follows FPL-like conventions.
- All routes call through `src/lib/fifaApi.ts` which reads `FIFA_API_BASE`
  from env (default: `https://play.fifa.com/fantasy/en-GB/api`).
- **The base URL is configurable** — set `FIFA_API_BASE` in `.env.local` once
  the exact endpoint is confirmed (community will reverse-engineer it quickly
  after MD1 on June 11).
- If the official API is unavailable, two fallback options exist:
  - **Fixtures/teams**: `https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/` (free, no key)
  - **Live scores**: API-Football (requires `FIFA_FOOTBALL_API_KEY` in env)

### Expected API endpoint patterns
```
{FIFA_API_BASE}/bootstrap-static/          → players, teams, events, total_players
{FIFA_API_BASE}/entry/{id}/                → user profile, leagues
{FIFA_API_BASE}/entry/{id}/history/        → matchday history + chips used
{FIFA_API_BASE}/entry/{id}/event/{md}/picks/ → squad picks for matchday
{FIFA_API_BASE}/event/{md}/live/           → live points for all players
{FIFA_API_BASE}/fixtures/                  → all tournament fixtures
{FIFA_API_BASE}/fixtures/?event={md}       → fixtures for a specific matchday
{FIFA_API_BASE}/leagues-classic/{id}/standings/ → league standings
```

### .env.local required keys
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
FIFA_API_BASE=https://play.fifa.com/fantasy/en-GB/api   # adjust once confirmed
FIFA_FOOTBALL_API_KEY=                                   # optional fallback
```

---

## Supabase Schema Note

The schema in `supabase/schema.sql` was inherited from FPL. The `fpl_entry_id`
column in the `users` table is reused as the FIFA Fantasy team ID (same concept,
different game). No schema migration needed for Phase 2 — the JSONB
`user_preferences` table handles all panel/booster preferences generically.

---

## Phase 2 — What to build next (priority order)

### P1 — Verify the API works (do first)
1. Set `FIFA_API_BASE` in `.env.local` and run `npm run dev`
2. Hit `GET /api/v1/user/summary` with your FIFA team ID cookie
3. Confirm the bootstrap response shape matches `FifaBootstrap` in `fifaApi.ts`
4. Adjust field names in the adapter if FIFA's JSON differs from FPL's

### P2 — Nation flags in FixtureTicker and GwLive
- `src/components/FixtureTicker.tsx`: replace PL club badge `<img>` with FIFA flag URL
  - Use `getNationFlagUrl(teamCode)` from `src/lib/playerImage.ts`
  - The existing `clubBadgeImg` CSS class can stay, just swap the src
- `src/components/GwLive.tsx`: kit images already use `getPlayerPhotoUrl` which
  now returns FIFA kit URLs — verify they load correctly

### P3 — Booster display in HistoryChart
- `src/components/HistoryChart.tsx` renders chip badges (WC/BB/TC/FH) on the chart
- Replace with FIFA booster abbreviations:
  - `wildcard` → **WC**
  - `twelfth_man` → **12**
  - `max_captain` → **MC**
  - `qualification_booster` → **QB**
  - `mystery_booster` → **CS** (Clean Sheet Shield)
- Import `FIFA_BOOSTER_LABELS` from `@/lib/fifaApi` for display names

### P4 — TransferOptimizer adaptation
- `src/app/api/v1/squad/optimize/route.ts` uses `ep_next` — verify FIFA API
  returns this field; if not, use `form` × fixture difficulty as proxy
- Update budget references from `£` to `$` in `src/components/TransferOptimizer.tsx`
- Squad constraint: account for 2 GKP limit (FIFA) vs 1 GKP (FPL)

### P5 — Rank Projection recalibration
- `src/app/api/v1/rank-projection/route.ts` uses `total_players: 11000000`
- FIFA WC Fantasy has ~2M players — update the sigmoid brackets:
  ```ts
  // Replace existing ranksPerPoint logic with:
  let ranksPerPoint = 10000;
  if (currentOverallRank < 1000)   ranksPerPoint = 50;
  else if (currentOverallRank < 10000)  ranksPerPoint = 300;
  else if (currentOverallRank < 100000) ranksPerPoint = 2000;
  else if (currentOverallRank < 500000) ranksPerPoint = 8000;
  ```

### P6 — Knockout Bracket (new panel, World Cup–specific)
This is a net-new component with no FPL equivalent. Build:
- `src/components/KnockoutBracket.tsx` — visual bracket (R32→R16→QF→SF→Final)
- `src/app/api/v1/bracket/route.ts` — fetch fixture results to populate bracket
- Add `knockoutBracket` to `ALL_PANEL_KEYS` in `src/lib/panelOrder.ts`
- Add `knockoutBracket` to `SECTION_KEYS` in `src/lib/sectionPreferences.ts`
- Show only once group stage MD3 is finished

### P7 — GwModeIndicator rename
- `src/components/GwModeIndicator.tsx` shows "Planning" / "Live" mode
- Rename the component file and display labels to `MatchdayMode` / `MdModeIndicator`
  (low priority — functional as-is)

---

## Architecture notes (inherited from FPL_Dashboard)

- **Next.js 16**: middleware file is `src/proxy.ts` (not `middleware.ts`)
- **No client-side FIFA API calls** — all go through `src/app/api/v1/` routes
- **Session auth**: HTTP-only cookie `fpl_entry_id` holds the FIFA team ID
- **Bootstrap cache**: 15-min in-process cache in `src/lib/fifaApi.ts` (`getBootstrap()`)
- **Rate limiting**: `src/proxy.ts` applies 30 req/min/IP to all `/api/v1/*` routes
- **Path alias**: `@/*` → `src/*`
- **All UI components** are client components (`'use client'` at top)
- **Tests**: Vitest + Testing Library in `src/**/*.test.ts(x)` — run `npm run test`

---

## Commands

```bash
npm run dev      # start dev server
npm run test     # run 90 unit tests (all should pass)
npm run lint     # ESLint (0 errors expected, ~14 img warnings are pre-existing)
npm run build    # production build
```

---

## Key files to read first

1. `src/lib/fifaApi.ts` — the central adapter, all types and constants live here
2. `src/app/api/v1/squad/live/route.ts` — most complex route, good reference
3. `src/components/GwLive.tsx` — main live squad component
4. `src/components/FixtureTicker.tsx` — needs nation flags (P2 above)
5. `src/components/HistoryChart.tsx` — needs booster badge update (P3 above)

---

## Tournament dates for reference

| Round | Dates |
|---|---|
| MD1 (Group Stage) | June 11–15, 2026 |
| MD2 (Group Stage) | June 16–20, 2026 |
| MD3 (Group Stage) | June 23–26, 2026 |
| Round of 32 | June 28–July 1, 2026 |
| Round of 16 | July 3–6, 2026 |
| Quarter-finals | July 9–10, 2026 |
| Semi-finals | July 14–15, 2026 |
| Final | July 19, 2026 |

**MD1 deadline: June 11, 2026** — highest priority is getting the API verified
and the core squad/live/fixtures views working before then.
