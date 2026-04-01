# Architecture Overview

## Stack

- Next.js 16 App Router
- React 19
- TypeScript
- Supabase
- Recharts
- CSS Modules
- Vitest + Playwright

## High-level architecture

The application is a server-rendered/client-enhanced dashboard backed by Next.js API routes that proxy and reshape official FPL data.

At a high level:

1. the user authenticates through the app flow
2. API routes read session-related context from cookies
3. routes fetch official FPL endpoints
4. the app reshapes data into dashboard-specific JSON payloads
5. the frontend renders specialized modules from those payloads
6. historical and sync workflows persist selective data into Supabase

## Frontend structure

### App shell
- [src/app/page.tsx](src/app/page.tsx) — main dashboard entry
- [src/app/login/page.tsx](src/app/login/page.tsx) — login flow

### UI modules
- [src/components/LivePoints.tsx](src/components/LivePoints.tsx)
- [src/components/SquadPitch.tsx](src/components/SquadPitch.tsx)
- [src/components/LeagueStandings.tsx](src/components/LeagueStandings.tsx)
- [src/components/LeagueLive.tsx](src/components/LeagueLive.tsx)
- [src/components/RankProjection.tsx](src/components/RankProjection.tsx)
- [src/components/HistoryChart.tsx](src/components/HistoryChart.tsx)
- [src/components/GameweekHistory.tsx](src/components/GameweekHistory.tsx)
- [src/components/FixtureTicker.tsx](src/components/FixtureTicker.tsx)
- [src/components/CaptaincyAdviser.tsx](src/components/CaptaincyAdviser.tsx)
- [src/components/TransferAnalyser.tsx](src/components/TransferAnalyser.tsx)
- [src/components/SyncStatus.tsx](src/components/SyncStatus.tsx)

## API layer

The Next.js API layer is used as a proxy and transformation boundary.

### Auth
- [src/app/api/v1/auth/login/route.ts](src/app/api/v1/auth/login/route.ts)
- [src/app/api/v1/auth/logout/route.ts](src/app/api/v1/auth/logout/route.ts)

### User and squad data
- [src/app/api/v1/user/summary/route.ts](src/app/api/v1/user/summary/route.ts)
- [src/app/api/v1/user/history/route.ts](src/app/api/v1/user/history/route.ts)
- [src/app/api/v1/user/transfers/route.ts](src/app/api/v1/user/transfers/route.ts)
- [src/app/api/v1/squad/live/route.ts](src/app/api/v1/squad/live/route.ts)
- [src/app/api/v1/squad/suggestions/route.ts](src/app/api/v1/squad/suggestions/route.ts)
- [src/app/api/v1/squad/optimize/route.ts](src/app/api/v1/squad/optimize/route.ts)

### Fixture and rank intelligence
- [src/app/api/v1/fixtures/route.ts](src/app/api/v1/fixtures/route.ts)
- [src/app/api/v1/rank-projection/route.ts](src/app/api/v1/rank-projection/route.ts)

### League and sync
- [src/app/api/v1/leagues/route.ts](src/app/api/v1/leagues/route.ts)
- [src/app/api/v1/leagues/live/route.ts](src/app/api/v1/leagues/live/route.ts)
- [src/app/api/v1/leagues/compare/route.ts](src/app/api/v1/leagues/compare/route.ts)
- [src/app/api/v1/sync/route.ts](src/app/api/v1/sync/route.ts)

### Asset intelligence
- [src/app/api/v1/player-photo/route.ts](src/app/api/v1/player-photo/route.ts)

## Data sources

The product relies primarily on official public FPL endpoints such as:

- `/api/bootstrap-static/`
- `/api/fixtures/`
- `/api/entry/{id}/`
- `/api/entry/{id}/history/`
- `/api/entry/{id}/transfers/`
- `/api/entry/{id}/event/{gw}/picks/`
- `/api/event/{gw}/live/`

## Data transformation responsibilities

### Summary route
Produces user/team overview values such as:
- team name
- overall rank
- bank balance
- team value
- transfers available

### Live squad route
Combines:
- bootstrap player data
- event live stats
- fixture completion state
- auto-sub style projection logic
- status lifecycle (`live`, `provisional`, `official`)

### Fixture route
Builds the squad fixture ticker payload:
- target gameweek window
- next five gameweeks
- per-player fixtures
- DGW detection via per-team per-event counts

### Suggestions route
Builds captaincy and market-target suggestions using:
- target GW logic
- expected points style heuristics
- fixture difficulty
- DGW/BGW detection
- club form

## Persistence layer

Supabase is used for structured sync and historical persistence.

See:
- [supabase/schema.sql](supabase/schema.sql)
- [src/lib/supabase.ts](src/lib/supabase.ts)

The sync flow stores selective user and historical data rather than trying to mirror the entire FPL platform.

## Image strategy

Player visuals have been standardized around current-season club shirt assets for consistency. Shared image handling lives in:

- [src/lib/playerImage.ts](src/lib/playerImage.ts)

## Testing and validation

- unit tests via Vitest
- end-to-end tests via Playwright
- linting via ESLint

## Architectural strengths

- clear separation between UI modules and FPL proxy logic
- extensible route-based API structure
- strong surface for adding more analytics modules
- low-friction deployment on Vercel-compatible infrastructure

## Current gaps to improve later

- deeper caching/freshness strategy documentation
- explicit observability / monitoring documentation
- clearer public deployment/runtime environment notes
- stronger architectural diagrams for non-technical readers
