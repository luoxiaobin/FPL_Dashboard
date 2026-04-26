# Mobile-First UI Pass — Implementation Plan
**Date:** 2026-04-26  
**Spec:** `docs/mobile-first-design.md`  
**Target:** iPhone 16 portrait (393 px CSS viewport); breakpoint `@media (max-width: 480px)`

---

## Overview

Ten sequential tasks that transform the dashboard from a desktop-centric two-column grid into a mode-aware, single-column mobile layout with user-customisable panel ordering persisted to Supabase.

Execution order matters: Tasks 1–3 are pure library/hook work with no UI surface; Tasks 4–7 wire them into the shell; Tasks 8–10 are per-component CSS polish.

---

## Task 1 — `src/lib/panelOrder.ts` (new file)

**Goal:** Central source of truth for panel keys, default orders, and the merge helper.

### Test first (`src/lib/panelOrder.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { PLANNING_DEFAULT_ORDER, LIVE_DEFAULT_ORDER, mergeOrder, ALL_PANEL_KEYS } from './panelOrder';

describe('mergeOrder', () => {
  it('returns default when saved is empty', () => {
    expect(mergeOrder([], PLANNING_DEFAULT_ORDER)).toEqual(PLANNING_DEFAULT_ORDER);
  });

  it('prepends saved keys that are in ALL_PANEL_KEYS in saved order', () => {
    const saved = ['livePoints', 'squadPitch'];
    const result = mergeOrder(saved, PLANNING_DEFAULT_ORDER);
    expect(result[0]).toBe('livePoints');
    expect(result[1]).toBe('squadPitch');
  });

  it('appends any default keys missing from saved', () => {
    const saved = ['livePoints'];
    const result = mergeOrder(saved, PLANNING_DEFAULT_ORDER);
    expect(result).toHaveLength(ALL_PANEL_KEYS.length);
  });

  it('ignores unknown keys in saved array', () => {
    const result = mergeOrder(['unknownKey'], PLANNING_DEFAULT_ORDER);
    expect(result).toEqual(PLANNING_DEFAULT_ORDER);
  });
});
```

### Implementation

```ts
export const ALL_PANEL_KEYS = [
  'syncStatus',
  'livePoints',
  'squadPitch',
  'captaincyAdviser',
  'transferOptimizer',
  'transferAnalyser',
  'rankProjection',
  'leagueStandings',
  'leagueLive',
  'historyChart',
  'gameweekHistory',
  'fixtureTicker',
  'rivalCompare',
] as const;

export type PanelKey = (typeof ALL_PANEL_KEYS)[number];

export const PLANNING_DEFAULT_ORDER: PanelKey[] = [
  'syncStatus',
  'transferOptimizer',
  'captaincyAdviser',
  'transferAnalyser',
  'rankProjection',
  'leagueStandings',
  'historyChart',
  'gameweekHistory',
  'fixtureTicker',
  'squadPitch',
  'livePoints',
  'leagueLive',
  'rivalCompare',
];

export const LIVE_DEFAULT_ORDER: PanelKey[] = [
  'syncStatus',
  'livePoints',
  'squadPitch',
  'leagueLive',
  'captaincyAdviser',
  'rankProjection',
  'leagueStandings',
  'fixtureTicker',
  'transferOptimizer',
  'transferAnalyser',
  'historyChart',
  'gameweekHistory',
  'rivalCompare',
];

export function mergeOrder(saved: string[], defaults: PanelKey[]): PanelKey[] {
  const valid = saved.filter((k): k is PanelKey =>
    (ALL_PANEL_KEYS as readonly string[]).includes(k)
  );
  const missing = defaults.filter((k) => !valid.includes(k));
  return [...valid, ...missing];
}
```

---

## Task 2 — `src/lib/sectionPreferences.ts` (edit)

**Goal:** Add `transferOptimizer` to `SECTION_KEYS` so it participates in visibility guards and dynamic ordering.

### Test addition (`src/lib/features.test.ts`)

Add one assertion to the existing test file:

```ts
it('includes transferOptimizer in SECTION_KEYS', () => {
  expect(SECTION_KEYS).toContain('transferOptimizer');
});
```

### Implementation

In `SECTION_KEYS`, append `'transferOptimizer'` after `'transferAnalyser'`.  
In `normalizeSectionPreferences`, add `transferOptimizer: raw.transferOptimizer ?? true`.  
`SectionPreferences` type: add `transferOptimizer: boolean`.

---

## Task 3 — `src/hooks/useGwMode.ts` (new file)

**Goal:** Poll `/api/v1/user/summary` every 60 s; derive `'live' | 'planning'` from event status.

### Test first (`src/hooks/useGwMode.test.ts`)

```ts
import { describe, it, expect } from 'vitest';
import { statusToMode } from './useGwMode';

describe('statusToMode', () => {
  it('maps live to live', () => expect(statusToMode('live')).toBe('live'));
  it('maps finished to planning', () => expect(statusToMode('finished')).toBe('planning'));
  it('maps undefined to planning', () => expect(statusToMode(undefined)).toBe('planning'));
  it('maps any other string to planning', () => expect(statusToMode('upcoming')).toBe('planning'));
});
```

### Implementation

```ts
'use client';
import { useState, useEffect } from 'react';

export type GwMode = 'live' | 'planning';

export function statusToMode(status: string | undefined): GwMode {
  return status === 'live' ? 'live' : 'planning';
}

export function useGwMode(): GwMode {
  const [mode, setMode] = useState<GwMode>('planning');

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch('/api/v1/user/summary');
        if (!res.ok) return;
        const data = await res.json();
        if (!cancelled) setMode(statusToMode(data?.current_event_status));
      } catch {
        // stay on last known mode
      }
    }
    poll();
    const id = setInterval(poll, 60_000);
    return () => { cancelled = true; clearInterval(id); };
  }, []);

  return mode;
}
```

---

## Task 4 — `GwModeIndicator` component (new files)

**Goal:** Visual badge showing current mode; tapping cycles to the other mode and stores override in `sessionStorage`.

### Files

- `src/components/GwModeIndicator.tsx`
- `src/components/GwModeIndicator.module.css`

### Test first (`src/components/GwModeIndicator.test.tsx`)

```tsx
import { render, screen, fireEvent } from '@testing-library/react';
import GwModeIndicator from './GwModeIndicator';

it('renders live badge', () => {
  render(<GwModeIndicator mode="live" onOverride={() => {}} />);
  expect(screen.getByText(/live/i)).toBeInTheDocument();
});

it('calls onOverride with toggled mode on click', () => {
  const spy = vi.fn();
  render(<GwModeIndicator mode="live" onOverride={spy} />);
  fireEvent.click(screen.getByRole('button'));
  expect(spy).toHaveBeenCalledWith('planning');
});
```

### Implementation sketch

```tsx
'use client';
import styles from './GwModeIndicator.module.css';
import type { GwMode } from '@/hooks/useGwMode';

interface Props { mode: GwMode; onOverride: (next: GwMode) => void; }

export default function GwModeIndicator({ mode, onOverride }: Props) {
  return (
    <button
      className={`${styles.badge} ${mode === 'live' ? styles.live : styles.planning}`}
      onClick={() => onOverride(mode === 'live' ? 'planning' : 'live')}
      aria-label={`Mode: ${mode}. Tap to switch.`}
    >
      {mode === 'live' ? '● LIVE' : '○ PLANNING'}
    </button>
  );
}
```

CSS (`.module.css`): pill shape, green for live, blue-grey for planning, `font-size: 0.7rem`, `min-height: 44px` touch target.

---

## Task 5 — `src/app/api/v1/user/preferences/route.ts` (edit)

**Goal:** Extend GET/PUT to also read/write `planning_panel_order` and `live_panel_order` from the `visible_sections` JSONB column.

### Test additions (`src/lib/features.test.ts` or new `preferences.test.ts`)

```ts
it('GET preferences response includes planning_panel_order', async () => {
  // mock Supabase, assert key present in response JSON
});

it('PUT with panel orders round-trips correctly', async () => {
  // mock upsert, assert visible_sections contains both order arrays
});
```

### Implementation

**GET** — after reading `visible_sections`, extract:
```ts
const planning_panel_order = raw?.planning_panel_order ?? [];
const live_panel_order = raw?.live_panel_order ?? [];
return NextResponse.json({ preferences, planning_panel_order, live_panel_order });
```

**PUT** — accept body `{ preferences, planning_panel_order?, live_panel_order? }`:
```ts
const body = await request.json();
await supabase.from('user_preferences').upsert({
  user_id,
  visible_sections: {
    ...body.preferences,
    planning_panel_order: body.planning_panel_order ?? [],
    live_panel_order: body.live_panel_order ?? [],
  },
});
```

---

## Task 6 — `src/app/settings/page.tsx` (edit)

**Goal:** Add per-mode panel reorder UI with up/down arrow buttons; persist order changes via PUT.

### Visual structure

```
[Planning Mode] [Live Mode]   ← tab bar

  ↑ ↓  Transfer Optimizer     ← drag-free reorder with arrow buttons
  ↑ ↓  Captaincy Adviser
  ...
```

### Implementation notes

- Add `activeTab: 'planning' | 'live'` state.
- Load `planning_panel_order` + `live_panel_order` from GET response.
- `movePanel(key, direction, mode)` updates local array, then calls PUT.
- Render the ordered list for the active tab; each row has ↑/↓ buttons (disabled at edges).
- The visibility toggle checkboxes remain; panel order section is additive.

---

## Task 7 — `src/app/page.tsx` (edit)

**Goal:** Replace static JSX order and two-column `mainGrid` with a single-column dynamic `renderPanel()` switch driven by mode + ordered keys.

### Key changes

1. Add `useGwMode` hook; derive `effectiveMode` (auto or sessionStorage override).
2. Load `planning_panel_order` + `live_panel_order` from preferences GET.
3. Replace all static panel JSX with:
   ```tsx
   const order = mergeOrder(
     effectiveMode === 'live' ? livePanelOrder : planningPanelOrder,
     effectiveMode === 'live' ? LIVE_DEFAULT_ORDER : PLANNING_DEFAULT_ORDER
   );

   return (
     <main className={styles.main}>
       <GwModeIndicator mode={effectiveMode} onOverride={handleOverride} />
       {order.map((key) => preferences[key] !== false && renderPanel(key))}
     </main>
   );
   ```
4. `renderPanel(key: PanelKey)` — a `switch` returning the appropriate component JSX.
5. Remove `mainGrid` div and its CSS grid rule.
6. Add `handleOverride` that writes to `sessionStorage` and updates local mode state.

---

## Task 8 — `src/app/page.module.css` + `src/app/globals.css` (edit)

**Goal:** Stats grid 2×2 on mobile; header font/logo shrink.

### Changes

**`page.module.css`** — add at bottom:
```css
@media (max-width: 480px) {
  .statsGrid {
    grid-template-columns: repeat(2, 1fr);
  }
  .header h1 {
    font-size: 1.1rem;
  }
}
```

**`globals.css`** — ensure `--panel-gap` CSS variable is used; add:
```css
@media (max-width: 480px) {
  body { font-size: 14px; }
}
```

---

## Task 9 — `FixtureTicker.tsx` + `FixtureTicker.module.css` (edit)

**Goal:** Add fade-out gradient on the right edge of the horizontally-scrolling fixture table; hide scrollbar.

### CSS additions (`FixtureTicker.module.css`)

```css
.scrollWrapper {
  position: relative;
}
.scrollWrapper::after {
  content: '';
  position: absolute;
  top: 0; right: 0;
  width: 32px; height: 100%;
  background: linear-gradient(to right, transparent, var(--bg-card));
  pointer-events: none;
}
.tableWrapper {
  overflow-x: auto;
  scrollbar-width: none;
}
.tableWrapper::-webkit-scrollbar {
  display: none;
}
```

### JSX change (`FixtureTicker.tsx`)

Wrap existing `<div className={styles.tableWrapper}>` in:
```tsx
<div className={styles.scrollWrapper}>
  <div className={styles.tableWrapper}>
    {/* existing table */}
  </div>
</div>
```

---

## Task 10 — `SquadPitch.module.css`, `HistoryChart.tsx`, `HistoryChart.module.css` (edit)

**Goal:** Shrink player cards on mobile; make chart horizontally scrollable.

### `SquadPitch.module.css`

```css
@media (max-width: 480px) {
  .playerCard {
    width: 54px;
    min-width: 54px;
  }
  .playerName {
    font-size: 0.6rem;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 52px;
  }
  .playerScore {
    font-size: 0.65rem;
  }
}
```

### `HistoryChart.module.css`

```css
.chartScroll {
  overflow-x: auto;
  scrollbar-width: none;
  -webkit-overflow-scrolling: touch;
}
.chartScroll::-webkit-scrollbar { display: none; }

.chartContainer {
  width: 100%;
  height: 280px;
}

@media (max-width: 480px) {
  .chartContainer {
    min-width: 480px;
  }
}
```

### `HistoryChart.tsx`

Wrap the existing `<div className={styles.chartContainer}>` in:
```tsx
<div className={styles.chartScroll}>
  <div className={styles.chartContainer}>
    {/* existing ResponsiveContainer */}
  </div>
</div>
```

---

## Verification Checklist

After all tasks complete, run:

```bash
npm run test        # all unit tests pass
npm run lint        # no ESLint errors
npm run build       # production build succeeds
```

Manual checks at 393 px viewport:
- [ ] `GwModeIndicator` badge visible in header; tap toggles mode
- [ ] Panel order changes in Settings → panels reorder on dashboard
- [ ] Stats grid renders as 2×2
- [ ] FixtureTicker scrolls horizontally, fade visible, no scrollbar
- [ ] HistoryChart scrolls horizontally
- [ ] Squad pitch player cards fit within viewport
- [ ] All panels respect visibility preferences

---

## File Change Summary

| File | Action |
|---|---|
| `src/lib/panelOrder.ts` | Create |
| `src/lib/panelOrder.test.ts` | Create |
| `src/lib/sectionPreferences.ts` | Edit |
| `src/lib/features.test.ts` | Edit |
| `src/hooks/useGwMode.ts` | Create |
| `src/hooks/useGwMode.test.ts` | Create |
| `src/components/GwModeIndicator.tsx` | Create |
| `src/components/GwModeIndicator.module.css` | Create |
| `src/components/GwModeIndicator.test.tsx` | Create |
| `src/app/api/v1/user/preferences/route.ts` | Edit |
| `src/app/settings/page.tsx` | Edit |
| `src/app/page.tsx` | Edit |
| `src/app/page.module.css` | Edit |
| `src/app/globals.css` | Edit |
| `src/components/FixtureTicker.tsx` | Edit |
| `src/components/FixtureTicker.module.css` | Edit |
| `src/components/SquadPitch.module.css` | Edit |
| `src/components/HistoryChart.tsx` | Edit |
| `src/components/HistoryChart.module.css` | Edit |
