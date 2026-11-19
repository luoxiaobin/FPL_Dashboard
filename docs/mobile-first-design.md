# Mobile-First UI Pass — Design Specification

**Original date:** 2026-04-26

**Continuity update:** 2026-11-19

**Target device:** iPhone 16 portrait (393px CSS viewport width)  
**Priority:** Portrait mode first; landscape and tablet are secondary.

## Current status

Mobile remains a release requirement for the full product, including features added after the original UI pass. The core dashboard has automated mobile coverage. The November continuity pass extends the acceptance surface to Planning, private squad access, Team News, chip opportunities, My Plan, official-FPL verification, explanations, settings, and backtesting.

The implementation uses desktop defaults with narrow-screen overrides, so the CSS architecture is responsive rather than strictly mobile-first by source order. Product decisions, touch targets, information priority, and acceptance testing remain mobile-first.

### Mobile release gates

- The supported portrait viewport must not produce document-level horizontal overflow.
- Primary buttons and controls must have a minimum 44px touch height.
- Wide data visualizations may scroll inside a clearly bounded container.
- Planning must remain usable from squad status through saving and reviewing My Plan.
- AI attribution, source freshness, chip caveats, transfer hits, and verification results must remain visible without requiring a desktop viewport.
- Core dashboard and Planning mobile Playwright checks must pass before release.

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

`useGwMode` polls the summary API and returns the automatic `planning` or `live` mode. The dashboard shell owns the optional manual override and stores it through the helpers in `src/hooks/useGwMode.ts`.

- `status === 'live'` → `mode = 'live'`
- `status === 'provisional'` or `status === 'official'` → `mode = 'planning'`
- API error or no current/next gameweek → default to `'planning'`

### Override behaviour

- Override is stored in `sessionStorage`. It survives reloads in the same tab and clears when the tab or browser session closes.
- If the GW status flips while the user is browsing, clear any stale override and notify: `"Gameweek has started — switched to Live mode"`
- Hook polls every 60 seconds

### Summary API extension

`/api/v1/user/summary` provides the current mode field:

```ts
{ current_event_status: 'live' | 'planning' }
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

**Planning mode order** (squad trust, transfers, analysis first):
1. SyncStatus
2. TransferOptimizer
3. CaptaincyAdviser
4. TransferAnalyser
5. RankProjection
6. LeagueStandings
7. HistoryChart
8. GameweekHistory
9. FixtureTicker
10. GW Live
11. LeagueLive
12. RivalCompare

**Live mode order** (points tracking first):
1. SyncStatus
2. GW Live
3. LeagueLive
4. CaptaincyAdviser
5. RankProjection
6. LeagueStandings
7. FixtureTicker
8. TransferOptimizer
9. TransferAnalyser
10. HistoryChart
11. GameweekHistory
12. RivalCompare

The combined GW Live panel replaces the separate legacy LivePoints and SquadPitch render slots. Legacy keys remain accepted when merging older saved preferences.

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

### Planning workspace and private squad flow

At 560px and below:

- page padding is reduced while preserving readable card gutters
- deadline and import controls stack vertically
- constraint controls use a single column and a full-width regenerate button
- scenario cards become horizontally swipeable snap cards without a document-level overflow
- plan metrics and player lists use one column
- the transfer-versus-hold table scrolls inside its own container
- the bench uses a two-column ordered grid
- the save-plan control becomes full width
- Review on FPL uses one column, including the Starting XI list
- verification actions become full-width 44px controls
- Team News source links retain a 44px touch height

The squad-import review changes to one player per row at 680px and below. At the narrowest supported width, captaincy badges move to a second grid row rather than squeezing the player name.

### Settings

At 560px and below, the header, mode tabs, and save/reset actions use stacked or two-column mobile layouts. Panel reorder controls are 44×44px. The label row remains large enough to tap without precision.

### New feature placement

- Planning backtest remains a full-width dashboard panel after the ordered home panels.
- Team News and chip opportunities appear before scenario selection because they can change the manager's interpretation of the recommendation.
- My Plan and Review on FPL remain after scenario details and preserve the decision sequence from recommendation to manual application and verification.

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
| Page reload with override active | Override remains for the current tab session. |
| Tab or browser session closes | Override clears with `sessionStorage`. |

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

---

## November 2026 verification matrix

| Surface | Mobile behavior | Automated evidence |
|---|---|---|
| Dashboard stats and header | 2×2 stats, compact branding, wrapping action row | `tests/e2e/responsive/mobile-dashboard.spec.ts` |
| Fixture ticker | Contained horizontal scroll | `tests/e2e/responsive/mobile-dashboard.spec.ts` |
| Live squad pitch | Compact player cards | `tests/e2e/responsive/mobile-dashboard.spec.ts` |
| Planning constraints and scenarios | Single-column constraints, swipeable scenarios | `tests/e2e/responsive/mobile-planning.spec.ts` |
| Team News and chip opportunities | Full-width readable cards and source actions | `tests/e2e/responsive/mobile-planning.spec.ts` |
| Selected plan and comparison | Single-column metrics, contained table scroll | `tests/e2e/responsive/mobile-planning.spec.ts` |
| My Plan verification | Single-column checklist and full-width sync actions | `tests/e2e/responsive/mobile-planning.spec.ts` |
| Squad import | One-column review and narrow player rows | Component tests plus responsive CSS |
| Settings | Mobile action layout and 44px reorder controls | Unit/component coverage plus responsive CSS |

Run the mobile acceptance checks with:

```bash
npx playwright test tests/e2e/responsive --project=mobile-chromium
```
