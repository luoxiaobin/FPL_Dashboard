# FPL Dashboard

An all-in-one Fantasy Premier League dashboard for managers who want live clarity, smarter weekly decisions, and better context than the official interface provides on its own.

Built with Next.js, React, TypeScript, and Supabase, the app combines live score tracking, rank movement, fixture intelligence, captaincy suggestions, transfer review, and league context in a single dark-mode dashboard.

## Live production URL

https://fpl-dashboard-seven-pi.vercel.app/

### Key Features

* **Public Team ID Authentication:** Securely built on top of the Public FPL Protocol. Simply enter your official numeric FPL Team ID to immediately load your entire dashboard—no email, passwords, or cookies required.
* **Season Trajectory 2.0 (Recharts):** Advanced dual-axis visualization with Logarithmic Rank scaling, Team Value trends, Average Points benchmarks, and tactical Chip markers (WC, BB, TC, FH).
* **Mini-League Battleground:** Real-time Rival Gaps Analysis to identify ownership differentials and point deficits against league competitors.
* **Intelligent Fixture Ticker:** Squad-wide fixture difficulty mapping including player metadata (Club, Form, Position, Injury Status) and heat-mapped intensity.
* **Live Squad Pitch:** A visual 15-man roster pitch that maps out your active starting XI alongside their live match minutes, BPS, and points.
* **Bonus Point System (BPS) Radar:** Our intelligent API parser flags high-performing players with golden `[X bps]` indicators or confirmed `[+X B]` markers dynamically across your pitch array during live matches.
* **Digital Transfer Analyser:** Deep-dive into historical transfer impact, tracking points-hit costs vs. performance gains.

## Why it exists

The official FPL experience is powerful, but fragmented:

- live points sit in one place
- planning sits somewhere else
- rank context is limited during a gameweek
- fixture planning and transfer reflection are manual

This dashboard is designed to bring those decisions into one view.

## Current feature set

### Live matchday dashboard
- live / provisional / official gameweek score lifecycle
- overall rank snapshot
- bank balance and team value
- transfers available

### Squad and scoring intelligence
- live squad pitch
- captain and vice-captain handling
- auto-sub style projected scoring logic
- current-season club shirt visuals for player rendering consistency

### Planning tools
- 5-gameweek fixture ticker
- fixture difficulty color coding
- double gameweek detection
- blank gameweek handling
- explicit "no DGW/BGW in next 5 GWs" indicator when applicable

### Decision support
- captaincy adviser for the target gameweek
- transfer optimizer (AI-driven expected gains analysis and tracked evaluation)
- DGW/BGW-aware suggestions
- market target suggestion
- transfer analyser with hit cost and points impact

### Context and history
- rank projection
- season trajectory charts
- gameweek history
- mini-league standings and live view

## Product positioning

This is best suited to:

- rank-focused FPL managers
- mini-league players who want faster weekly decisions
- engaged casual players who want a better live dashboard than the official UI alone

## Tech stack

- Next.js 16
- React 19
- TypeScript
- Supabase
- Recharts
- CSS Modules
- Vitest
- Playwright

## Project structure

- [src/app](src/app) — App Router pages and API routes
- [src/components](src/components) — dashboard UI modules
- [src/lib](src/lib) — shared helpers, tests, changelog, Supabase client
- [supabase](supabase) — schema and persistence setup

## Key API surfaces

- [src/app/api/v1/user/summary/route.ts](src/app/api/v1/user/summary/route.ts)
- [src/app/api/v1/squad/live/route.ts](src/app/api/v1/squad/live/route.ts)
- [src/app/api/v1/fixtures/route.ts](src/app/api/v1/fixtures/route.ts)
- [src/app/api/v1/squad/optimize/route.ts](src/app/api/v1/squad/optimize/route.ts)
- [src/app/api/v1/squad/suggestions/route.ts](src/app/api/v1/squad/suggestions/route.ts)
- [src/app/api/v1/user/transfers/route.ts](src/app/api/v1/user/transfers/route.ts)
- [src/app/api/v1/leagues/route.ts](src/app/api/v1/leagues/route.ts)
- [src/app/api/v1/rank-projection/route.ts](src/app/api/v1/rank-projection/route.ts)
- [src/app/api/v1/sync/route.ts](src/app/api/v1/sync/route.ts)
- [src/app/api/v1/cron/evaluate/route.ts](src/app/api/v1/cron/evaluate/route.ts)

## Security & Architecture

- **Rate Limiting:** Next.js Edge Proxy (`src/proxy.ts`) enforces per-IP throttling at 30 requests per minute across all public proxy endpoints.
- **Fast Caching:** Critical application endpoints strictly revalidate generic FPL assets sequentially on short TTL pulses, guaranteeing high performance under heavy dashboard viewing load.

## Local development

Install dependencies:

```bash
npm install
```

Run the dev server:

```bash
npm run dev
```

Open the app at `http://localhost:3000`.

Production deployment:

https://fpl-dashboard-seven-pi.vercel.app/

## Validation commands

```bash
npm run lint
npm run test
npm run build
```

## Documentation

- [RequirementTechSpec.md](RequirementTechSpec.md) — product requirements and technical specification
- [implementation_plan.md](implementation_plan.md) — original implementation plan
- [PRODUCT_OVERVIEW.md](PRODUCT_OVERVIEW.md) — audience, value proposition, and feature narrative
- [ARCHITECTURE.md](ARCHITECTURE.md) — implementation architecture and data flow
- [PROMOTION_COPY.md](PROMOTION_COPY.md) — launch messaging and outreach copy

## Roadmap

Near-term areas worth expanding:

- richer rival-watch workflows
- clearer mobile-first optimization across all panels
- exportable reports and sharing assets
- deeper transfer recommendation logic
- stronger public launch collateral

## Status

The application is beyond MVP and already includes live tracking, planning, and historical analysis features suitable for early user promotion and feedback.

Built for FPL managers who want one dashboard for live decisions, weekly planning, and season context.

