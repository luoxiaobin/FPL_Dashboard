# Mobile-First UI Pass — Design Specification

**Date:** 2026-04-26  
**Target device:** iPhone 16 portrait (393px CSS viewport width)  
**Priority:** Portrait mode first; landscape and tablet are secondary.

---

## 1. Architecture — Mode Detection

### Two user modes

The dashboard has two distinct use cases that drive completely different panel ordering priorities:

| Mode | When | User goal |
|---|---|---|
| **Planning** | Between gameweeks (transfers open) | Scout players, plan transfers, analyse form |
| **Live** | During an active gameweek | Track live points, monitor substitutions |

### `useGwMode` hook

A new custom hook reads the `status` field from `/api/v1/squad/live` and maps it to a mode:

```ts
// src/hooks/useGwMode.ts
type GwMode = 'planning' | 'live';

export function useGwMode(): {
  mode: GwMode;
  override: GwMode | null;
  setOverride: (m: GwMode | null) => void;
}
```

- `status === 'live'` → `mode = 'live'`
- `status === 'provisional'` or `status === 'official'` → `mode = 'planning'`
- API error or no current/next gameweek → default to `'planning'`

### Override behaviour

- Override is stored in `sessionStorage` (clears on page reload — intentional)
- If the GW status flips while the user is browsing, clear any stale override and notify: `"Gameweek has started — switched to Live mode"`
- Hook polls every 60 seconds

### Summary API extension

`/api/v1/user/summary` response gains one field:

```ts
{ gw_status: 'live' | 'provisional' | 'official' | 'between' }
```

This avoids a separate round-trip for mode detection.

---

## 2. GwModeIndicator Component

### Placement

Inline in the dashboard header, immediately after the gameweek badge.

### Visual design

- Small pill: `Planning mode ▾` or `Live mode ▾`
- Colour-coded: green for Live, blue-grey for Planning
- Tap opens an inline dropdown with the override option

### Override display

| State | Indicator text |
|---|---|
| Auto Planning | `Planning mode ▾` |
| Auto Live | `Live mode ▾` |
| Manual override → Live | `Live mode (override) ▾` with amber border |
| Manual override → Planning | `Planning mode (override) ▾` with amber border |

Dropdown explains the current auto-detection reason:
> "Gameweek 32 is active — Live mode recommended. Switch to Planning mode?"

---

## 3. Panel Ordering

### System defaults

**Planning mode order** (transfers, analysis first):
1. TransferOptimizer
2. CaptaincyAdviser
3. FixtureTicker
4. LivePoints
5. SquadPitch
6. LeagueStandings
7. LeagueLive
8. RivalCompare
9. RankProjection
10. HistoryChart
11. GameweekHistory
12. TransferAnalyser
13. SyncStatus

**Live mode order** (points tracking first):
1. LivePoints
2. SquadPitch
3. LeagueLive
4. LeagueStandings
5. RivalCompare
6. CaptaincyAdviser
7. FixtureTicker
8. RankProjection
9. TransferOptimizer
10. HistoryChart
11. GameweekHistory
12. TransferAnalyser
13. SyncStatus

### User customisation

- Reorder UI lives on the **Settings page only** (`/settings`)
- Two separate orderings: Planning and Live
- Up/down arrow controls per panel row
- Reset to system defaults button per mode

### Implementation

```ts
// src/lib/panelOrder.ts
export const PLANNING_DEFAULT_ORDER: string[] = [...];
export const LIVE_DEFAULT_ORDER: string[] = [...];

export function mergeOrder(saved: string[], defaults: string[]): string[] {
  // Append any new panels not in saved order
  // Drop any saved keys that no longer exist
}
```

Supabase `user_preferences` JSONB extended with:
```json
{
  "planning_panel_order": ["TransferOptimizer", "CaptaincyAdviser", ...],
  "live_panel_order": ["LivePoints", "SquadPitch", ...]
}
```

### Edge cases

- New panel added in a release → appended to end of saved order (never dropped silently)
- Stale panel key in saved preferences → dropped silently (no error)
- Supabase unavailable → fall back to system defaults

---

## 4. Component-Level Responsive Changes

### Stats grid (page.tsx)

```css
@media (max-width: 480px) {
  .statsGrid { grid-template-columns: repeat(2, 1fr); }
}
```

Four stats (Rank, Points, Bank, Value) → 2×2 grid.

### FixtureTicker

Horizontal scroll with right-edge fade gradient:

```css
.tickerWrapper { position: relative; overflow: hidden; }
.tickerScroll  { overflow-x: auto; -webkit-overflow-scrolling: touch; scrollbar-width: none; }
.tickerFade    { position: absolute; right: 0; top: 0; bottom: 0; width: 48px;
                 background: linear-gradient(to right, transparent, var(--bg-primary));
                 pointer-events: none; }
```

Hide wrapper entirely when there are no fixtures.

### SquadPitch

Shrink cards at ≤480px:

```css
@media (max-width: 480px) {
  .playerCard   { width: 54px; }
  .playerName   { font-size: 0.6rem; text-overflow: ellipsis; overflow: hidden; white-space: nowrap; }
  .playerPoints { font-size: 0.65rem; }
  .playerPhoto  { width: 38px; height: 38px; }
}
```

5-card DEF row fits at 393px at 54px/card with ~5px gaps.

### HistoryChart

Horizontal scroll with fade + minimum readable width:

```css
.chartWrapper { position: relative; overflow: hidden; }
.chartScroll  { overflow-x: auto; -webkit-overflow-scrolling: touch; }
.chartInner   { min-width: 480px; }
/* Same fade gradient as FixtureTicker */
```

### Remaining tables

`TransferOptimizer`, `GameweekHistory`, `LeagueStandings`, `RivalCompare`, `TransferAnalyser` — wrap each table in:

```css
.tableWrapper { overflow-x: auto; -webkit-overflow-scrolling: touch; }
```

### Header

Accommodate `GwModeIndicator` pill at 393px:

```css
@media (max-width: 480px) {
  .headerMeta { font-size: 0.7rem; gap: 6px; }
  .modePill   { padding: 2px 7px; font-size: 0.65rem; }
}
```

---

## 5. Error Handling & Edge Cases

### Mode detection failures

| Failure | Behaviour |
|---|---|
| API unreachable | Default to `'planning'` (safer — never shows stale live data) |
| No current/next GW | Default to `'planning'` |
| Partial response (status present, no players) | Keep current mode, don't flip |

### Override edge cases

| Scenario | Behaviour |
|---|---|
| GW kicks off while user is browsing | Auto-flip Planning → Live, clear override, show notification |
| User overrides to Live during planning hours | Amber border indicator + warning text in pill |
| Page reload with override active | Override clears (sessionStorage) — intentional |

### Panel order edge cases

| Scenario | Behaviour |
|---|---|
| New panel released, not in saved order | Append to end of user's list |
| Stale panel key in user preference | Drop silently |
| Supabase unavailable | Fall back to system defaults (never empty list) |

---

## Out of scope

- Landscape orientation (secondary priority)
- Tablet breakpoints
- Touch gesture swipe between panels
- Push notifications for GW start
