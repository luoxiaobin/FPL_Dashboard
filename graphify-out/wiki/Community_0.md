# Community 0

> 46 nodes

## Key Concepts

- **Next.js API Proxy & Transformation Layer** (9 connections) — `ARCHITECTURE.md`
- **Key Architectural Decisions (no client FPL calls, bootstrap cache, auto-sub, DGW/BGW, recommendation grading, Vercel serverless)** (6 connections) — `CLAUDE.md`
- **Auto-Sub Projection Concept (simulate injured/0-min starters swapped for bench)** (5 connections) — `CLAUDE.md`
- **Recommendation Grading Concept (Hit/Miss/Neutral via cron retroactive evaluation)** (5 connections) — `CLAUDE.md`
- **Live Squad Route (auto-sub projection + status lifecycle)** (4 connections) — `ARCHITECTURE.md`
- **DGW/BGW Detection Concept (count matches per team per event, 2+=DGW, 0=BGW)** (4 connections) — `CLAUDE.md`
- **Session Authentication via HTTP-only Cookie (fpl_entry_id, public FPL Team ID only)** (4 connections) — `CLAUDE.md`
- **Core Value — Planning Intelligence (fixture ticker, DGW/BGW, captaincy adviser, Transfer Optimizer)** (4 connections) — `PRODUCT_OVERVIEW.md`
- **Problems Solved (fragmented matchday tracking, lack of planning context, weak decision review)** (4 connections) — `PRODUCT_OVERVIEW.md`
- **Bootstrap-Static In-Process Cache (15 min TTL)** (3 connections) — `ARCHITECTURE.md`
- **FPL Public API Data Sources** (3 connections) — `ARCHITECTURE.md`
- **Supabase Persistence Layer** (3 connections) — `ARCHITECTURE.md`
- **Suggestions & Optimization Route (xP heuristics + captaincy + transfer)** (3 connections) — `ARCHITECTURE.md`
- **User & Squad API Routes** (3 connections) — `ARCHITECTURE.md`
- **Supabase Database Tables (users, players, gameweeks, squads, squad_players, user_preferences, recommendation_logs)** (3 connections) — `CLAUDE.md`
- **Design Decision — No Client-Side FPL Requests (all proxied through /api/v1/ to avoid CORS)** (3 connections) — `CLAUDE.md`
- **Vercel Serverless Deployment Target** (3 connections) — `CLAUDE.md`
- **Core Value — Decision Review (transfer analyser, history, season trajectory)** (3 connections) — `PRODUCT_OVERVIEW.md`
- **Core Value — Live Clarity (GW lifecycle, rank/score awareness, auto-sub logic)** (3 connections) — `PRODUCT_OVERVIEW.md`
- **Product Overview — All-in-One FPL Decision Cockpit** (3 connections) — `PRODUCT_OVERVIEW.md`
- **README Key Features (Public Team ID Auth, Season Trajectory, BPS Radar, Transfer Analyser)** (3 connections) — `README.md`
- **Requirements Spec — Functional Requirements FR-01 to FR-09** (3 connections) — `RequirementTechSpec.md`
- **Auth API Routes (login + logout)** (2 connections) — `ARCHITECTURE.md`
- **Cron Evaluate Route (retroactive recommendation grading)** (2 connections) — `ARCHITECTURE.md`
- **Fixture Route (DGW/BGW detection + 5-GW ticker payload)** (2 connections) — `ARCHITECTURE.md`
- *... and 21 more nodes in this community*

## Relationships

- No strong cross-community connections detected

## Source Files

- `ARCHITECTURE.md`
- `CLAUDE.md`
- `PRODUCT_OVERVIEW.md`
- `PROMOTION_COPY.md`
- `README.md`
- `RequirementTechSpec.md`
- `docs/mobile-first-design.md`
- `implementation_plan.md`

## Audit Trail

- EXTRACTED: 48 (81%)
- INFERRED: 11 (19%)
- AMBIGUOUS: 0 (0%)

---

*Part of the graphify knowledge wiki. See [index](index.md) to navigate.*