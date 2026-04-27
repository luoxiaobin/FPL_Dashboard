# Graph Report - .  (2026-04-27)

## Corpus Check
- 91 files · ~149,824 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 246 nodes · 256 edges · 19 communities detected
- Extraction: 80% EXTRACTED · 20% INFERRED · 1% AMBIGUOUS · INFERRED: 50 edges (avg confidence: 0.79)
- Token cost: 11,600 input · 4,720 output

## Community Hubs (Navigation)
- [[_COMMUNITY_API Routes & Server Architecture|API Routes & Server Architecture]]
- [[_COMMUNITY_Panel Ordering & Club Form Utilities|Panel Ordering & Club Form Utilities]]
- [[_COMMUNITY_Dashboard Shell & FPL Data Layer|Dashboard Shell & FPL Data Layer]]
- [[_COMMUNITY_Logo Design Motifs|Logo Design Motifs]]
- [[_COMMUNITY_Static Assets & Next.js Icons|Static Assets & Next.js Icons]]
- [[_COMMUNITY_ChatGPT-Generated Logo PNG|ChatGPT-Generated Logo PNG]]
- [[_COMMUNITY_Brand Identity & Visual Language|Brand Identity & Visual Language]]
- [[_COMMUNITY_GW Live Points Component|GW Live Points Component]]
- [[_COMMUNITY_Next.js 16 Migration & Proxy|Next.js 16 Migration & Proxy]]
- [[_COMMUNITY_User Avatar Assets|User Avatar Assets]]
- [[_COMMUNITY_Mobile-First Design Rationale|Mobile-First Design Rationale]]
- [[_COMMUNITY_Player Image Utilities|Player Image Utilities]]
- [[_COMMUNITY_CI & Testing Architecture|CI & Testing Architecture]]
- [[_COMMUNITY_Project Scaffolding & Infrastructure|Project Scaffolding & Infrastructure]]
- [[_COMMUNITY_Target Audience Messaging|Target Audience Messaging]]
- [[_COMMUNITY_Mobile CSS Polish|Mobile CSS Polish]]
- [[_COMMUNITY_Component Code Pattern|Component Code Pattern]]
- [[_COMMUNITY_Open Questions|Open Questions]]
- [[_COMMUNITY_Production URL|Production URL]]

## God Nodes (most connected - your core abstractions)
1. `GET()` - 22 edges
2. `Next.js API Proxy & Transformation Layer` - 9 edges
3. `Logo Final — Icon Only` - 9 edges
4. `Logo Concept 1 — Shield + Rank Chart` - 8 edges
5. `Logo Concept 2 — Pitch + Bar Chart` - 8 edges
6. `Logo Final — Full Wordmark` - 7 edges
7. `FPL Dashboard Football Pitch / Analytics Board Logo Variant` - 7 edges
8. `Key Architectural Decisions (no client FPL calls, bootstrap cache, auto-sub, DGW/BGW, recommendation grading, Vercel serverless)` - 6 edges
9. `Logo Concept 3 — FD Monogram` - 6 edges
10. `FPL Dashboard Shield Logo Variant` - 6 edges

## Surprising Connections (you probably didn't know these)
- `Product Overview — All-in-One FPL Decision Cockpit` --semantically_similar_to--> `Promotion Copy — One-Line Pitches & Launch Posts`  [INFERRED] [semantically similar]
  PRODUCT_OVERVIEW.md → PROMOTION_COPY.md
- `Requirements Spec — MVP Requirements (live points, league standings, squad view, transfer analytics)` --semantically_similar_to--> `Product Overview — All-in-One FPL Decision Cockpit`  [INFERRED] [semantically similar]
  RequirementTechSpec.md → PRODUCT_OVERVIEW.md
- `GET()` --calls--> `buildClubFormMap()`  [INFERRED]
  D:\compare\FPL_Dashboard\src\app\api\v1\user\transfers\route.ts → D:\compare\FPL_Dashboard\src\lib\clubForm.ts
- `GET()` --calls--> `extractPanelOrders()`  [INFERRED]
  D:\compare\FPL_Dashboard\src\app\api\v1\user\transfers\route.ts → D:\compare\FPL_Dashboard\src\lib\panelOrder.ts
- `proxy()` --calls--> `GET()`  [INFERRED]
  D:\compare\FPL_Dashboard\src\proxy.ts → D:\compare\FPL_Dashboard\src\app\api\v1\user\transfers\route.ts

## Hyperedges (group relationships)
- **FPL Data Proxy Pipeline (FPL Public API → Next.js API Routes → Dashboard Components)** — architecture_fpl_data_sources, architecture_api_layer, architecture_app_shell [EXTRACTED 0.95]
- **Mode-Aware Mobile Dashboard (useGwMode hook + GwModeIndicator + panelOrder + page.tsx renderPanel)** — mobile_plan_use_gw_mode_hook, mobile_plan_gw_mode_indicator_component, mobile_plan_panel_order_ts, mobile_plan_page_tsx_edit [EXTRACTED 0.92]
- **Transfer Recommendation Lifecycle (suggestions route → recommendation_logs table → cron evaluate)** — architecture_suggestions_optimization, claude_supabase_tables, architecture_cron_evaluate [INFERRED 0.88]

## Communities

### Community 0 - "API Routes & Server Architecture"
Cohesion: 0.07
Nodes (37): Next.js API Proxy & Transformation Layer, Auth API Routes (login + logout), Bootstrap-Static In-Process Cache (15 min TTL), Cron Evaluate Route (retroactive recommendation grading), Fixture Route (DGW/BGW detection + 5-GW ticker payload), Fixture & Rank Intelligence Routes, League & Sync Routes, Suggestions & Optimization Route (xP heuristics + captaincy + transfer) (+29 more)

### Community 1 - "Panel Ordering & Club Form Utilities"
Cohesion: 0.07
Nodes (11): buildClubFormMap(), buildPanelOrderPayload(), extractPanelOrders(), proxy(), rateLimit(), GET(), getBootstrap(), getUserIdFromCookie() (+3 more)

### Community 2 - "Dashboard Shell & FPL Data Layer"
Cohesion: 0.09
Nodes (24): App Shell (page.tsx + login/page.tsx), FPL Public API Data Sources, Player Image Strategy (club shirt assets via playerImage.ts), Live Squad Route (auto-sub projection + status lifecycle), Supabase Persistence Layer, Technology Stack (Next.js 16 + React 19 + TypeScript + Supabase + Recharts), Repository Structure (src/app, src/components, src/lib, supabase), Supabase Database Tables (users, players, gameweeks, squads, squad_players, user_preferences, recommendation_logs) (+16 more)

### Community 3 - "Logo Design Motifs"
Cohesion: 0.28
Nodes (17): Design Element — Rank Badge / Trophy Indicator, Design Effect — Glow / Bloom Filter on Chart Elements, Design Motif — Rising Bar Chart, Design Motif — FD Monogram Letterform, Design Motif — Football Pitch Outline, Design Motif — Rank / Line Chart with Data Points, Design Motif — Shield, Design Palette — Blue-to-Green Accent Gradient (#60A5FA → #22C55E) (+9 more)

### Community 4 - "Static Assets & Next.js Icons"
Cohesion: 0.43
Nodes (8): File Document Icon, Globe / Internet Icon, Next.js Wordmark Logo, Next.js Framework, Public Static Assets Directory, Vercel Deployment Platform, Vercel Triangle Logo, Browser Window Icon

### Community 5 - "ChatGPT-Generated Logo PNG"
Cohesion: 0.39
Nodes (8): Bar Chart Icon (Data Visualisation Symbol), Blue and Green Colour Palette, DASHBOARD Wordmark Text, FPL Dashboard Logo, FPL Wordmark Text, Shield Icon with Analytics Motif, Upward-Trending Arrow (Analytics/Growth Symbol), FPL Dashboard Project

### Community 6 - "Brand Identity & Visual Language"
Cohesion: 0.64
Nodes (8): Analytics / Data Visualisation Motif (bar chart + upward arrow), Brand Colour Palette: Dark Navy, Blue, Teal, Green Gradient, Football Pitch Overhead View Motif, FPL Dashboard Brand Identity, FPL Dashboard FD Monogram Logo Variant, FPL Dashboard Branding Sheet (Logo Variants), FPL Dashboard Football Pitch / Analytics Board Logo Variant, FPL Dashboard Shield Logo Variant

### Community 8 - "GW Live Points Component"
Cohesion: 0.5
Nodes (2): displayPts(), notYetPlayed()

### Community 11 - "Next.js 16 Migration & Proxy"
Cohesion: 0.4
Nodes (5): Next.js 16 Breaking Changes Warning, Edge Proxy (proxy.ts) — IP-based rate limiting, Next.js 16 Breaking Changes (proxy.ts, request.ip removal, bundler module resolution), Rate Limiting (proxy.ts + rateLimit.ts, 30 req/min/IP), README Security Architecture (rate limiting + short TTL caching)

### Community 12 - "User Avatar Assets"
Cohesion: 0.6
Nodes (5): Coral Red-Orange Avatar Background, FPL Dashboard Branding Assets, ChatGPT Interface, KL User Avatar, User Initials KL

### Community 16 - "Mobile-First Design Rationale"
Cohesion: 0.5
Nodes (4): Styling Conventions (Tailwind CSS 4 + CSS Modules + CSS Variables dark-mode-first), Implementation Plan — Frontend UI (mobile-first, glassmorphism dark-mode), Rationale: Mobile-First Design (80%+ traffic via mobile during live matches), Requirements Spec — Non-Functional Requirements (latency <2s, 99.9% uptime, mobile-first, 10x surge scalability)

### Community 18 - "Player Image Utilities"
Cohesion: 1.0
Nodes (2): getClubShirtUrl(), getPlayerPhotoUrl()

### Community 33 - "CI & Testing Architecture"
Cohesion: 1.0
Nodes (2): Testing Strategy (Vitest unit + Playwright E2E + ESLint), CI Pipeline (lint + test + build on push/PR)

### Community 34 - "Project Scaffolding & Infrastructure"
Cohesion: 1.0
Nodes (2): create-next-app CLI Help (project bootstrap options), Implementation Plan — Infrastructure & Core Setup (Next.js App Router bootstrap)

### Community 35 - "Target Audience Messaging"
Cohesion: 1.0
Nodes (2): Target Audience (rank-focused managers, mini-league players, engaged casuals, content creators), Promotion Copy — Audience-Specific Messaging (mini-league, rank chasers, engaged casuals)

### Community 36 - "Mobile CSS Polish"
Cohesion: 1.0
Nodes (2): Mobile Design — Component-Level Responsive Changes (stats grid, FixtureTicker, SquadPitch, HistoryChart), Mobile Plan — CSS Polish (stats grid 2×2, FixtureTicker fade, SquadPitch card shrink, HistoryChart scroll)

### Community 55 - "Component Code Pattern"
Cohesion: 1.0
Nodes (1): Client Component Pattern (use client + useState/useEffect + fetch /api/v1/)

### Community 56 - "Open Questions"
Cohesion: 1.0
Nodes (1): Implementation Plan — Open Questions (Tailwind vs CSS Modules, Supabase vs MongoDB, mock data)

### Community 57 - "Production URL"
Cohesion: 1.0
Nodes (1): Production URL (https://fpl-dashboard-seven-pi.vercel.app/)

## Ambiguous Edges - Review These
- `File Document Icon` → `Globe / Internet Icon`  [AMBIGUOUS]
  public/globe.svg · relation: semantically_similar_to
- `User Initials KL` → `ChatGPT Interface`  [AMBIGUOUS]
  public/branding/Logo - ChatGPT_files/kl.png · relation: conceptually_related_to

## Knowledge Gaps
- **40 isolated node(s):** `Next.js 16 Breaking Changes Warning`, `Technology Stack (Next.js 16 + React 19 + TypeScript + Supabase + Recharts)`, `App Shell (page.tsx + login/page.tsx)`, `League & Sync Routes`, `Player Image Strategy (club shirt assets via playerImage.ts)` (+35 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **Thin community `GW Live Points Component`** (5 nodes): `displayPts()`, `getByPos()`, `notYetPlayed()`, `pointsColor()`, `GwLive.tsx`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Player Image Utilities`** (3 nodes): `getClubShirtUrl()`, `getPlayerPhotoUrl()`, `playerImage.ts`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `CI & Testing Architecture`** (2 nodes): `Testing Strategy (Vitest unit + Playwright E2E + ESLint)`, `CI Pipeline (lint + test + build on push/PR)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Project Scaffolding & Infrastructure`** (2 nodes): `create-next-app CLI Help (project bootstrap options)`, `Implementation Plan — Infrastructure & Core Setup (Next.js App Router bootstrap)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Target Audience Messaging`** (2 nodes): `Target Audience (rank-focused managers, mini-league players, engaged casuals, content creators)`, `Promotion Copy — Audience-Specific Messaging (mini-league, rank chasers, engaged casuals)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Mobile CSS Polish`** (2 nodes): `Mobile Design — Component-Level Responsive Changes (stats grid, FixtureTicker, SquadPitch, HistoryChart)`, `Mobile Plan — CSS Polish (stats grid 2×2, FixtureTicker fade, SquadPitch card shrink, HistoryChart scroll)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Component Code Pattern`** (1 nodes): `Client Component Pattern (use client + useState/useEffect + fetch /api/v1/)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Open Questions`** (1 nodes): `Implementation Plan — Open Questions (Tailwind vs CSS Modules, Supabase vs MongoDB, mock data)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.
- **Thin community `Production URL`** (1 nodes): `Production URL (https://fpl-dashboard-seven-pi.vercel.app/)`
  Too small to be a meaningful cluster - may be noise or needs more connections extracted.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `File Document Icon` and `Globe / Internet Icon`?**
  _Edge tagged AMBIGUOUS (relation: semantically_similar_to) - confidence is low._
- **What is the exact relationship between `User Initials KL` and `ChatGPT Interface`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Live Squad Route (auto-sub projection + status lifecycle)` connect `Dashboard Shell & FPL Data Layer` to `API Routes & Server Architecture`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Are the 6 inferred relationships involving `GET()` (e.g. with `proxy()` and `buildClubFormMap()`) actually correct?**
  _`GET()` has 6 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `Logo Final — Icon Only` (e.g. with `Logo Final — Full Wordmark` and `Logo Concept 1 — Shield + Rank Chart`) actually correct?**
  _`Logo Final — Icon Only` has 4 INFERRED edges - model-reasoned connections that need verification._
- **Are the 3 inferred relationships involving `Logo Concept 1 — Shield + Rank Chart` (e.g. with `Logo Final — Icon Only` and `Logo Concept 2 — Pitch + Bar Chart`) actually correct?**
  _`Logo Concept 1 — Shield + Rank Chart` has 3 INFERRED edges - model-reasoned connections that need verification._
- **Are the 4 inferred relationships involving `Logo Concept 2 — Pitch + Bar Chart` (e.g. with `Logo Concept 2a — Pitch + Bars Minimal Variant` and `Logo Concept 2b — Pitch + Bars Bold Variant`) actually correct?**
  _`Logo Concept 2 — Pitch + Bar Chart` has 4 INFERRED edges - model-reasoned connections that need verification._