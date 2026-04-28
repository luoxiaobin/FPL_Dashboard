# FPL Dashboard — Knowledge Graph Wiki

> Auto-generated from `graphify-out/graph.json`. Navigate communities to understand the codebase.

**246 nodes · 256 edges · 58 communities**

## Communities

### [API Routes & Server Architecture](api-routes-and-server-architecture.md) (37 nodes)
> Next.js API Proxy & Transformation Layer, Key Architectural Decisions (no client FPL calls, bootstrap cache, auto-sub, DGW/BGW, recommendation grading, Vercel serverless), Auto-Sub Projection Concept (simulate injured/0-min starters swapped for bench)

### [Panel Ordering & Club Form Utilities](panel-ordering-and-club-form-utilities.md) (35 nodes)
> GET(), POST(), PUT()

### [Dashboard Shell & FPL Data Layer](dashboard-shell-and-fpl-data-layer.md) (24 nodes)
> Mobile Design — Panel Ordering (planning mode vs live mode default orders, user customization), Live Squad Route (auto-sub projection + status lifecycle), Repository Structure (src/app, src/components, src/lib, supabase)

### [Logo Design Motifs](logo-design-motifs.md) (17 nodes)
> Logo Final — Icon Only, Logo Concept 1 — Shield + Rank Chart, Logo Concept 2 — Pitch + Bar Chart

### [Static Assets & Next.js Icons](static-assets-and-next.js-icons.md) (8 nodes)
> Public Static Assets Directory, File Document Icon, Globe / Internet Icon

### [ChatGPT-Generated Logo PNG](chatgpt-generated-logo-png.md) (8 nodes)
> FPL Dashboard Logo, Shield Icon with Analytics Motif, FPL Dashboard Project

### [Brand Identity & Visual Language](brand-identity-and-visual-language.md) (8 nodes)
> FPL Dashboard Football Pitch / Analytics Board Logo Variant, FPL Dashboard Shield Logo Variant, FPL Dashboard FD Monogram Logo Variant

### [Settings Page Actions](settings-page-actions.md) (5 nodes)
> page.tsx, toggleSection(), resetDefaults()

### [GW Live Points Component](gw-live-points-component.md) (5 nodes)
> GwLive.tsx, notYetPlayed(), displayPts()

### [Gameweek Mode Hook](gameweek-mode-hook.md) (5 nodes)
> useGwMode.ts, getStoredModeOverride(), setStoredModeOverride()

### [Feature Utility Tests](feature-utility-tests.md) (5 nodes)
> features.test.ts, displayRows(), shouldRetry()

### [Next.js 16 Migration & Proxy](next.js-16-migration-and-proxy.md) (5 nodes)
> Edge Proxy (proxy.ts) — IP-based rate limiting, Next.js 16 Breaking Changes (proxy.ts, request.ip removal, bundler module resolution), Rate Limiting (proxy.ts + rateLimit.ts, 30 req/min/IP)

### [User Avatar Assets](user-avatar-assets.md) (5 nodes)
> KL User Avatar, ChatGPT Interface, User Initials KL

### [Main Dashboard Page](main-dashboard-page.md) (4 nodes)
> page.tsx, getScoreLabel(), handleLogout()

### [History Chart Tests](history-chart-tests.md) (4 nodes)
> HistoryChart.test.tsx, observe(), unobserve()

### [Transfer Analyser Component](transfer-analyser-component.md) (4 nodes)
> TransferAnalyser.tsx, getJerseyIconUrl(), difficultyColor()

### [Mobile-First Design Rationale](mobile-first-design-rationale.md) (4 nodes)
> Implementation Plan — Frontend UI (mobile-first, glassmorphism dark-mode), Rationale: Mobile-First Design (80%+ traffic via mobile during live matches), Styling Conventions (Tailwind CSS 4 + CSS Modules + CSS Variables dark-mode-first)

### [Squad Pitch Tests](squad-pitch-tests.md) (3 nodes)
> SquadPitch.test.tsx, makePlayer(), mockSquadWith()

### [Player Image Utilities](player-image-utilities.md) (3 nodes)
> playerImage.ts, getClubShirtUrl(), getPlayerPhotoUrl()

### [Root Layout](root-layout.md) (2 nodes)
> layout.tsx, RootLayout()

### [Login Page](login-page.md) (2 nodes)
> page.tsx, LoginPage()

### [Settings Page Tests](settings-page-tests.md) (2 nodes)
> settings.test.tsx, mockFetch()

### [Build Info Component](build-info-component.md) (2 nodes)
> BuildInfo.tsx, BuildInfo()

### [Fixture Ticker Component](fixture-ticker-component.md) (2 nodes)
> FixtureTicker.tsx, difficultyColor()

### [Gameweek History Component](gameweek-history-component.md) (2 nodes)
> GameweekHistory.tsx, GameweekHistory()

### [GW Live Tests](gw-live-tests.md) (2 nodes)
> GwLive.test.tsx, mockFetch()

### [GW Mode Indicator Component](gw-mode-indicator-component.md) (2 nodes)
> GwModeIndicator.tsx, GwModeIndicator()

### [History Chart Component](history-chart-component.md) (2 nodes)
> HistoryChart.tsx, getBarColor()

### [League Live Component](league-live-component.md) (2 nodes)
> LeagueLive.tsx, getMyEntryId()

### [Rival Compare Component](rival-compare-component.md) (2 nodes)
> RivalCompare.tsx, RivalCompare()

### [Sync Status Component](sync-status-component.md) (2 nodes)
> SyncStatus.tsx, SyncStatus()

### [Transfer Optimizer Tests](transfer-optimizer-tests.md) (2 nodes)
> TransferOptimizer.test.tsx, mockFetch()

### [Club Form Tests](club-form-tests.md) (2 nodes)
> clubForm.test.ts, fix()

### [CI & Testing Architecture](ci-and-testing-architecture.md) (2 nodes)
> Testing Strategy (Vitest unit + Playwright E2E + ESLint), CI Pipeline (lint + test + build on push/PR)

### [Project Scaffolding & Infrastructure](project-scaffolding-and-infrastructure.md) (2 nodes)
> create-next-app CLI Help (project bootstrap options), Implementation Plan — Infrastructure & Core Setup (Next.js App Router bootstrap)

### [Target Audience Messaging](target-audience-messaging.md) (2 nodes)
> Target Audience (rank-focused managers, mini-league players, engaged casuals, content creators), Promotion Copy — Audience-Specific Messaging (mini-league, rank chasers, engaged casuals)

### [Mobile CSS Polish](mobile-css-polish.md) (2 nodes)
> Mobile Design — Component-Level Responsive Changes (stats grid, FixtureTicker, SquadPitch, HistoryChart), Mobile Plan — CSS Polish (stats grid 2×2, FixtureTicker fade, SquadPitch card shrink, HistoryChart scroll)

### [ESLint Config](eslint-config.md) (1 nodes)
> eslint.config.mjs

### [TypeScript Next Env](typescript-next-env.md) (1 nodes)
> next-env.d.ts

### [Next.js Config](next.js-config.md) (1 nodes)
> next.config.ts

### [PostCSS Config](postcss-config.md) (1 nodes)
> postcss.config.mjs

### [Vitest Config](vitest-config.md) (1 nodes)
> vitest.config.ts

### [Captaincy Adviser Component](captaincy-adviser-component.md) (1 nodes)
> CaptaincyAdviser.tsx

### [Fixture Ticker Tests](fixture-ticker-tests.md) (1 nodes)
> FixtureTicker.test.tsx

### [GW Mode Indicator Tests](gw-mode-indicator-tests.md) (1 nodes)
> GwModeIndicator.test.tsx

### [League Standings Component](league-standings-component.md) (1 nodes)
> LeagueStandings.tsx

### [Live Points Tests](live-points-tests.md) (1 nodes)
> LivePoints.test.tsx

### [Live Points Component](live-points-component.md) (1 nodes)
> LivePoints.tsx

### [Rank Projection Component](rank-projection-component.md) (1 nodes)
> RankProjection.tsx

### [Squad Pitch Component](squad-pitch-component.md) (1 nodes)
> SquadPitch.tsx

### [Transfer Optimizer Component](transfer-optimizer-component.md) (1 nodes)
> TransferOptimizer.tsx

### [useGwMode Tests](usegwmode-tests.md) (1 nodes)
> useGwMode.test.ts

### [Panel Order Tests](panel-order-tests.md) (1 nodes)
> panelOrder.test.ts

### [Sanity Tests](sanity-tests.md) (1 nodes)
> sanity.test.ts

### [Supabase Client](supabase-client.md) (1 nodes)
> supabase.ts

### [Component Code Pattern](component-code-pattern.md) (1 nodes)
> Client Component Pattern (use client + useState/useEffect + fetch /api/v1/)

### [Open Questions](open-questions.md) (1 nodes)
> Implementation Plan — Open Questions (Tailwind vs CSS Modules, Supabase vs MongoDB, mock data)

### [Production URL](production-url.md) (1 nodes)
> Production URL (https://fpl-dashboard-seven-pi.vercel.app/)

## God Nodes (most connected)

- **GET()** (degree 22) — `D:\compare\FPL_Dashboard\src\app\api\v1\user\transfers\route.ts`
- **Next.js API Proxy & Transformation Layer** (degree 9) — `ARCHITECTURE.md`
- **Logo Final — Icon Only** (degree 9) — `public/branding/logos/logo-final-icon.svg`
- **Logo Concept 1 — Shield + Rank Chart** (degree 8) — `public/branding/logos/logo-concept-1-shield-rank.svg`
- **Logo Concept 2 — Pitch + Bar Chart** (degree 8) — `public/branding/logos/logo-concept-2-pitch-bars.svg`
- **Logo Final — Full Wordmark** (degree 7) — `public/branding/logos/logo-final-full.svg`
- **FPL Dashboard Football Pitch / Analytics Board Logo Variant** (degree 7) — `public/branding/logos/text-to-image-706f7d35d25b4e948c18275845d15125-1.png`
- **Key Architectural Decisions (no client FPL calls, bootstrap cache, auto-sub, DGW/BGW, recommendation grading, Vercel serverless)** (degree 6) — `CLAUDE.md`
- **Logo Concept 3 — FD Monogram** (degree 6) — `public/branding/logos/logo-concept-3-monogram-fd.svg`
- **FPL Dashboard Shield Logo Variant** (degree 6) — `public/branding/logos/text-to-image-706f7d35d25b4e948c18275845d15125-1.png`

## How to navigate

- Start with **API Routes & Server Architecture** for backend flow
- Start with **Dashboard Shell & FPL Data Layer** for frontend architecture
- Start with **Gameweek Mode Hook** for the live/planning mode system
- Start with **Panel Ordering & Club Form Utilities** for data utility patterns
