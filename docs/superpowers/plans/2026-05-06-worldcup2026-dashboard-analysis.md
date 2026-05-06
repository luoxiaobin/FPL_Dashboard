# World Cup 2026 Dashboard — Analysis & Proposal

**Date:** 2026-05-06  
**Status:** Analysis only — implementation not started  
**Continuation:** Resume from "Recommended Architecture" section

---

## Tournament Structure (what makes this different)

| Dimension | FPL | WC 2026 |
|---|---|---|
| Teams | 20 Premier League clubs | 48 nations |
| Season length | 38 gameweeks | ~8 rounds over 39 days |
| Phases | Flat (GW1–38) | Group Stage (MD1/2/3) → R32 → R16 → QF → SF → Final |
| Groups | None | 12 groups of 4 (A–L) |
| Advancement | N/A | Top 2 per group + 8 best 3rd-place → R32 |
| Player removal | Transfers only | Whole nation eliminated |
| Fixtures/day | 10 max | Up to 16 simultaneous group matches |
| Total matches | 380 | 104 |

---

## What Can Be Reused Directly (~60%)

- **Auth system** — entry_id → fantasy team_id, same cookie-based pattern
- **Panel ordering + settings UI** — works as-is
- **League standings + live panels** — same concept, different data
- **History chart + gameweek history** — rename to "Matchday History"
- **Supabase schema** — users, squads, squad_players, leagues, user_preferences all carry over
- **Rate limiting proxy** — unchanged
- **Mobile CSS / panel shell** — unchanged
- **Rival compare** — same concept

---

## Data Source — The Critical Decision

FIFA hasn't confirmed their official fantasy API yet (historically goes live ~9 days before kickoff). Three options:

**Option A — FIFA Official Fantasy API** *(preferred if available)*
- Same pattern as FPL: proxy all calls through `/api/v1/*`
- Likely has bootstrap, picks, live points endpoints
- Risk: unknown structure, very late release

**Option B — API-Football (api-football.com)**
- WC 2026: `league=1&season=2026`
- Paid but well-documented, reliable
- Provides fixtures, live scores, standings, player stats
- You'd build your own fantasy scoring layer on top

**Option C — Sportmonks**
- €69/mo "Special" plan covers fixtures, live scores, group standings, bracket
- Comprehensive but expensive for a hobby project

**Recommendation: Build against Option B (API-Football)** with an adapter layer — same internal `/api/v1/*` shape, swap the upstream source. This decouples the dashboard from FIFA's late/unknown API.

---

## API Route Changes

| Current FPL route | WC equivalent | Change needed |
|---|---|---|
| `bootstrap-static` | `/players`, `/teams`, `/rounds` | Restructure — 3 separate calls |
| `entry/{id}/event/{gw}/picks/` | `fantasy/{id}/picks/{round}` | Rename `gw` → `round` |
| `event/{gw}/live/` | `/live/{round}` | Same pattern |
| `fixtures/?event={gw}` | `/fixtures?round={r}&group={g}` | Add group filter |
| `entry/{id}/history/` | `/entry/{id}/history/` | Same shape |
| `entry/{id}/` | `/entry/{id}/` | Same shape |

New routes needed:
- `/api/v1/groups` — live standings for all 12 groups (A–L)
- `/api/v1/bracket` — knockout tree with match results
- `/api/v1/nations/status` — which of the 48 nations are active/eliminated

---

## The Group Stage Challenge

This is the hardest part. Three specific problems:

### Problem 1 — Staggered group completion
Groups don't all finish simultaneously. Groups A and B matchday 3 might finish before Groups K and L. The 8 best 3rd-place teams can't be determined until all 12 groups complete MD3. This means:
- Fantasy live score is provisional until all MD3 games finish
- Need a `group_status: 'in_progress' | 'complete'` per group
- "Phase complete" only when all 12 groups are done

### Problem 2 — Nation elimination mid-squad
When a nation is knocked out, all their players in users' squads become dead weight. Need:
- `nation_status` map: `{ 'England': 'active' | 'eliminated' | 'champion' }`
- Cards/rows for eliminated players show greyed out with an "OUT" badge (already have this pattern from the auto-sub logic in `GwLive`)
- Transfer chip becomes critical here — users need to rotate eliminated nations out

### Problem 3 — Best 3rd-place rule complexity
The 8 best 3rd-place nations out of 12 advance. This means on MD3 a 3rd-place nation is in a "pending" state — they don't know if they're through. Need a `pending_advancement` state distinct from `active` and `eliminated`.

---

## New Panels Required

### 1. Group Standings Panel *(most important new panel)*
Shows all 12 groups live. Each group: team, P/W/D/L/GD/Pts, with colour coding for the advancement line. The 3rd-place teams show a "pending" indicator during MD3.

### 2. Tournament Bracket Panel
Visual knockout tree from R32 onward. Can start hidden during group stage. Shows TBD slots that fill as groups complete.

### 3. Phase/Mode Indicator *(extends current `GwModeIndicator`)*
Instead of `planning | live`, becomes:
```
Group Stage MD1 → MD2 → MD3 → R32 → R16 → QF → SF → Final
```

### 4. Nation Status Panel
Quick-glance grid of all 48 nations with flag + status badge (Active / Eliminated / Champion). Lets users instantly see which of their squad's nations are still alive.

---

## Squad & Scoring Changes

| FPL concept | WC equivalent |
|---|---|
| £100m budget | Points-based budget or similar cap |
| GKP/DEF/MID/FWD | Same positions apply to national teams |
| 15-player squad (11+4) | Likely 15 players, potentially fewer |
| Unlimited transfers on wildcard | Tournament likely has limited total transfers |
| Auto-subs | Nation elimination is the WC equivalent |
| Bonus points (BPS) | Man of the Match / Tournament awards |
| Club form (`clubForm`) | Nation form — last N WC qualifying matches |

The `GwLive` component's auto-sub projection logic maps cleanly: a nation-eliminated player ≡ a 0-minute finished player → show as dimmed with "OUT", attempt to sub in a bench player whose nation is still active.

---

## Recommended Architecture: Fork, Don't Modify

Rather than converting this repo in place, **fork it** into `WC2026_Dashboard` and:

1. Replace `src/app/api/v1/` route implementations (keep the URL paths identical)
2. Add `src/lib/tournament.ts` — group standings logic, advancement calculation, nation status
3. Add 3 new components: `GroupStandings`, `TournamentBracket`, `NationStatus`
4. Rename "Gameweek" labels → "Matchday/Round" throughout
5. Extend `panelOrder.ts` with the 3 new panel keys
6. Replace `useGwMode` with `useTournamentPhase` (group/knockout phases)
7. Update `playerImage.ts` to serve national team kits instead of club shirts

The Supabase schema needs one migration: add `nation_code` to `players` table and a `tournament_phases` table replacing `gameweeks`.

---

## Implementation Phases

| Phase | Scope | Effort |
|---|---|---|
| 1 — Data adapter | API routes pointing at API-Football WC endpoints | ~2 days |
| 2 — Group standings | `GroupStandings` panel + `/api/v1/groups` route | ~1 day |
| 3 — Squad live | Adapt `GwLive` for nation elimination logic | ~1 day |
| 4 — Bracket + nation status | `TournamentBracket` + `NationStatus` panels | ~2 days |
| 5 — Phase indicator | Replace `useGwMode` with `useTournamentPhase` | ~0.5 day |
| 6 — Polish | Labels, flags, mobile, scoring tweaks | ~1 day |

**Total: ~1 week** to a functional WC 2026 dashboard, given the ~60% code reuse.

---

## Open Questions (to resolve before implementation)

1. Will FIFA release an official fantasy API, and when? Monitor closer to June 11.
2. What is the exact scoring system — goals, assists, clean sheets, minutes? Need to confirm from official rules.
3. Does the official fantasy game allow transfers mid-group-stage or only between rounds?
4. Is there a free tier of API-Football sufficient for dev/testing?
5. Should this be a separate repo or a monorepo with shared lib?

---

## Sources

- [Will there be a FIFA World Cup 2026 Fantasy game?](https://www.fantasyfootballscout.co.uk/2026/05/05/will-there-be-a-fifa-world-cup-2026-fantasy-game-and-when-will-it-go-live)
- [2026 FIFA World Cup — Wikipedia](https://en.wikipedia.org/wiki/2026_FIFA_World_Cup)
- [The 48-Team World Cup: How the New Group Stage Works](https://www.ucfb.ac.uk/news/the-48-team-world-cup-how-the-new-group-stage-works/)
- [Launch a World Cup 2026 fantasy game — Sportmonks](https://www.sportmonks.com/blogs/launch-a-world-cup-2026-fantasy-game/)
- [FIFA World Cup API — API-Football](https://www.api-football.com/news/post/fifa-world-cup-2026-guide-to-using-data-with-api-sports)
