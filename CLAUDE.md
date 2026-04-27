@AGENTS.md

# FPL Dashboard — AI Assistant Guide

## Project Overview

A Fantasy Premier League analytics dashboard built with **Next.js 16**, **React 19**, **TypeScript**, **Supabase**, and **Tailwind CSS 4**. It proxies official FPL API data and reshapes it into specialised dashboard modules with optional Supabase persistence.

**No authentication beyond a public FPL Team ID** — users log in with their numeric `entry_id` and the session is held in an HTTP-only cookie (`fpl_entry_id`).

---

## Critical: Next.js 16 Breaking Changes

Next.js 16 introduces breaking changes from what most training data covers. Key differences already applied in this codebase:

- **`middleware.ts` → `proxy.ts`**: The edge middleware file is named `src/proxy.ts` and exports `proxy` (not `middleware`). The `config` export still works the same.
- **`request.ip` removed**: Use `x-real-ip` / `x-forwarded-for` headers instead (see `src/proxy.ts`).
- **Module resolution is `bundler`**: `tsconfig.json` uses `"moduleResolution": "bundler"` — path aliases and imports follow Next.js 16 bundler rules.
- **No `pages/` directory**: This project uses the App Router exclusively (`src/app/`).

If `node_modules/next/dist/docs/` is missing, look at existing route files for the correct patterns rather than guessing from older Next.js knowledge.

---

## Repository Structure

```
FPL_Dashboard/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── layout.tsx          # Root layout (Inter font, metadata)
│   │   ├── page.tsx            # Main dashboard shell (client component)
│   │   ├── globals.css         # Tailwind + CSS custom properties
│   │   ├── login/page.tsx      # Public team-ID login
│   │   ├── settings/page.tsx   # Section visibility preferences
│   │   └── api/v1/             # All API routes (versioned)
│   │       ├── auth/login/     # POST — validates FPL ID, sets cookie
│   │       ├── auth/logout/    # POST — clears cookie
│   │       ├── user/summary/   # GET — rank, points, chips, bank
│   │       ├── user/history/   # GET — per-GW historical data
│   │       ├── user/transfers/ # GET — transfer history
│   │       ├── user/preferences/ # GET/POST — visible section settings
│   │       ├── squad/live/     # GET — live squad + auto-sub projection
│   │       ├── squad/optimize/ # GET — AI transfer suggestions
│   │       ├── squad/suggestions/ # GET — captaincy advice
│   │       ├── fixtures/       # GET — fixture ticker (5 GWs)
│   │       ├── leagues/        # GET — league standings
│   │       ├── leagues/live/   # GET — live league updates
│   │       ├── leagues/compare/ # GET — rival comparison
│   │       ├── rank-projection/ # GET — rank projection data
│   │       ├── player-photo/   # GET — player/shirt image URL
│   │       ├── sync/           # POST — sync data to Supabase
│   │       └── cron/evaluate/  # POST — grade transfer recommendations
│   ├── components/             # All UI components (client-side)
│   │   ├── LivePoints.tsx
│   │   ├── SquadPitch.tsx
│   │   ├── LeagueStandings.tsx
│   │   ├── LeagueLive.tsx
│   │   ├── RankProjection.tsx
│   │   ├── HistoryChart.tsx
│   │   ├── GameweekHistory.tsx
│   │   ├── FixtureTicker.tsx
│   │   ├── CaptaincyAdviser.tsx
│   │   ├── TransferAnalyser.tsx
│   │   ├── TransferOptimizer.tsx
│   │   ├── RivalCompare.tsx
│   │   ├── SyncStatus.tsx
│   │   └── BuildInfo.tsx
│   │   (each has a co-located <ComponentName>.module.css)
│   ├── lib/
│   │   ├── supabase.ts         # Supabase client (anon + service role)
│   │   ├── playerImage.ts      # Club shirt image URL helper
│   │   ├── sectionPreferences.ts # Type definitions for section toggles
│   │   ├── rateLimit.ts        # In-memory rate limiter (30 req/min/IP)
│   │   ├── changelog.json      # Version history
│   │   ├── features.test.ts    # Vitest unit tests
│   │   └── sanity.test.ts      # Sanity check test
│   └── proxy.ts                # Next.js 16 edge proxy (rate limiting)
├── supabase/
│   └── schema.sql              # Full DB schema with RLS policies
├── public/                     # Static assets
├── .github/workflows/          # CI (ci.yml) and E2E (e2e.yml)
├── ARCHITECTURE.md             # Architecture deep-dive
├── package.json
├── next.config.ts
├── tsconfig.json
├── vitest.config.ts
└── eslint.config.mjs
```

---

## Development Workflow

### Prerequisites

Requires `.env.local` with:
```
NEXT_PUBLIC_SUPABASE_URL=<supabase-project-url>
NEXT_PUBLIC_SUPABASE_ANON_KEY=<supabase-anon-key>
SUPABASE_SERVICE_ROLE_KEY=<supabase-service-role-key>
```

### Commands

| Command | Description |
|---|---|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint (flat config, ESLint 9) |
| `npm run test` | Run unit tests with Vitest |
| `npm run test:e2e` | Run Playwright E2E tests |

### CI Pipeline

CI runs automatically on push/PR to main/master:
1. `npm run lint`
2. `npm run test`
3. `npm run build`

E2E tests run on manual dispatch or release publish only.

---

## Code Conventions

### Component Pattern

All UI components are **client components** (include `'use client'` at the top). They use:
- `useState` / `useEffect` for local state and data fetching
- Direct `fetch` calls to internal `/api/v1/` routes
- No global state management (no Redux, Zustand, or Context)

```tsx
'use client';
import styles from './MyComponent.module.css';

export default function MyComponent() { ... }
```

### API Route Pattern

API routes live at `src/app/api/v1/<resource>/route.ts`. They:
- Read session from cookies: `request.cookies.get('fpl_entry_id')?.value`
- Return early with `{ error: '...' }` + appropriate status if unauthenticated
- Fetch from the FPL public API and reshape the response
- Never expose raw FPL responses directly to the client

```ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const entryId = request.cookies.get('fpl_entry_id')?.value;
  if (!entryId) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
  // ...
}
```

### Styling

- **Tailwind CSS 4** via PostCSS (`postcss.config.mjs`)
- **CSS Modules** per component (co-located `.module.css` files)
- **CSS variables** in `globals.css` for theming (dark-mode-first)
- Do **not** use inline styles or `styled-components`
- Class names: use CSS Modules for component-specific styles; use Tailwind for layout/spacing

### TypeScript

- `strict: true` — no implicit any
- Path alias `@/*` → `src/*` (e.g., `import { createClient } from '@/lib/supabase'`)
- `@typescript-eslint/no-explicit-any` and `no-unused-vars` are disabled in ESLint — but avoid `any` regardless

### Testing

- Unit tests: Vitest + Testing Library, placed in `src/lib/*.test.ts`
- Test files match `**/*.test.ts` or `**/*.test.tsx`
- Environment: jsdom (configured in `vitest.config.ts`)
- Run `npm run test` before committing

---

## External Data Sources

**FPL Public API** (no authentication required):

| Endpoint | Purpose |
|---|---|
| `/api/bootstrap-static/` | All players, teams, events — cached 15 min |
| `/api/entry/{id}/` | User overview (rank, points, chips) |
| `/api/entry/{id}/history/` | Per-gameweek history |
| `/api/entry/{id}/transfers/` | Transfer history |
| `/api/entry/{id}/event/{gw}/picks/` | Squad for a specific gameweek |
| `/api/event/{gw}/live/` | Live points for current gameweek |
| `/api/fixtures/` | All fixtures with difficulty ratings |
| `/api/fixtures/?event={gw}` | Fixtures for a specific gameweek |

Base URL: `https://fantasy.premierleague.com`

---

## Database (Supabase)

Schema lives in `supabase/schema.sql`. Key tables:

| Table | Purpose |
|---|---|
| `users` | Registered FPL managers (UUID + fpl_entry_id) |
| `players` | Player metadata (position enum: GKP/DEF/MID/FWD) |
| `gameweeks` | GW metadata (is_current, is_next, deadline) |
| `squads` | Squad snapshots per user per gameweek |
| `squad_players` | Individual player entries within a squad |
| `user_preferences` | Dashboard section visibility (JSONB) |
| `recommendation_logs` | Transfer suggestions with outcome grading |

RLS is enabled on all tables. `players` and `gameweeks` are publicly readable. All mutations use the service role key (server-side only).

---

## Rate Limiting

`src/proxy.ts` intercepts all `/api/v1/*` requests and applies in-memory rate limiting (30 requests/minute per IP). The rate limiter lives in `src/lib/rateLimit.ts`. This is the Next.js 16 equivalent of `middleware.ts`.

---

## Key Architectural Decisions

1. **No client-side FPL requests**: All FPL API calls go through `src/app/api/v1/` routes to avoid CORS and to keep transformation logic server-side.
2. **Bootstrap cache**: The `bootstrap-static` endpoint is expensive — cache the result in-process for 15 minutes.
3. **Auto-sub projection**: The live squad route simulates automatic substitutions (injured/0-minute starters swapped for bench players) for score projection.
4. **DGW/BGW detection**: Count matches per team per event — 2+ = Double Gameweek, 0 = Blank Gameweek.
5. **Recommendation grading**: Transfer suggestions are stored with `outcome: 'Pending'`; the `cron/evaluate` route retroactively updates them to Hit/Miss/Neutral.
6. **Deployment target**: Vercel serverless — no persistent in-process state beyond the 15-min bootstrap cache.

## graphify

This project has a graphify knowledge graph at graphify-out/.

Rules:
- Before answering architecture or codebase questions, read graphify-out/GRAPH_REPORT.md for god nodes and community structure
- If graphify-out/wiki/index.md exists, navigate it instead of reading raw files
- For cross-module "how does X relate to Y" questions, prefer `graphify query "<question>"`, `graphify path "<A>" "<B>"`, or `graphify explain "<concept>"` over grep — these traverse the graph's EXTRACTED + INFERRED edges instead of scanning files
- After modifying code files in this session, run `graphify update .` to keep the graph current (AST-only, no API cost)
