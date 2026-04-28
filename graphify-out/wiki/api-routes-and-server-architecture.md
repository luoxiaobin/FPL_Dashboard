# API Routes & Server Architecture

*Community 0 · 37 nodes*

[← Back to index](index.md)

## Nodes

### Next.js API Proxy & Transformation Layer
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 9
- **Edges:**
  - `implements` [EXTRACTED] → **Design Decision — No Client-Side FPL Requests (all proxied through /api/v1/ to avoid CORS)**
  - `references` [EXTRACTED] → **Auth API Routes (login + logout)**
  - `references` [EXTRACTED] → **User & Squad API Routes**
  - `references` [EXTRACTED] → **Cron Evaluate Route (retroactive recommendation grading)**
  - `references` [EXTRACTED] → **Fixture & Rank Intelligence Routes**
  - `references` [EXTRACTED] → **League & Sync Routes**
  - `references` [EXTRACTED] → **Requirements Spec — API Contract Specification (REST JSON endpoints)**
  - `references` [EXTRACTED] → **Implementation Plan — API Proxy Layer (initial 4 routes)**

### Key Architectural Decisions (no client FPL calls, bootstrap cache, auto-sub, DGW/BGW, recommendation grading, Vercel serverless)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 6
- **Edges:**
  - `references` [EXTRACTED] → **Bootstrap-Static In-Process Cache (15 min TTL)**
  - `references` [EXTRACTED] → **Design Decision — No Client-Side FPL Requests (all proxied through /api/v1/ to avoid CORS)**
  - `references` [EXTRACTED] → **Auto-Sub Projection Concept (simulate injured/0-min starters swapped for bench)**
  - `references` [EXTRACTED] → **DGW/BGW Detection Concept (count matches per team per event, 2+=DGW, 0=BGW)**
  - `references` [EXTRACTED] → **Recommendation Grading Concept (Hit/Miss/Neutral via cron retroactive evaluation)**
  - `references` [EXTRACTED] → **Vercel Serverless Deployment Target**

### Auto-Sub Projection Concept (simulate injured/0-min starters swapped for bench)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 5
- **Edges:**
  - `implements` [EXTRACTED] → **Live Squad Route (auto-sub projection + status lifecycle)** *(cross-community)*
  - `references` [EXTRACTED] → **Key Architectural Decisions (no client FPL calls, bootstrap cache, auto-sub, DGW/BGW, recommendation grading, Vercel serverless)**
  - `conceptually_related_to` [INFERRED] → **Core Value — Live Clarity (GW lifecycle, rank/score awareness, auto-sub logic)**
  - `references` [EXTRACTED] → **Requirements Spec — Functional Requirements FR-01 to FR-09**
  - `semantically_similar_to` [INFERRED] → **DGW/BGW Detection Concept (count matches per team per event, 2+=DGW, 0=BGW)**

### Recommendation Grading Concept (Hit/Miss/Neutral via cron retroactive evaluation)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 5
- **Edges:**
  - `implements` [EXTRACTED] → **Cron Evaluate Route (retroactive recommendation grading)**
  - `references` [EXTRACTED] → **Suggestions & Optimization Route (xP heuristics + captaincy + transfer)**
  - `references` [EXTRACTED] → **Key Architectural Decisions (no client FPL calls, bootstrap cache, auto-sub, DGW/BGW, recommendation grading, Vercel serverless)**
  - `conceptually_related_to` [INFERRED] → **Core Value — Decision Review (transfer analyser, history, season trajectory)**
  - `references` [EXTRACTED] → **Requirements Spec — Functional Requirements FR-01 to FR-09**

### Product Overview — All-in-One FPL Decision Cockpit
- **Source:** `PRODUCT_OVERVIEW.md`
- **Type:** document
- **Connections:** 4
- **Edges:**
  - `semantically_similar_to` [INFERRED] → **Promotion Copy — One-Line Pitches & Launch Posts**
  - `references` [INFERRED] → **README Roadmap (rival-watch, mobile optimization, exportable reports, transfer logic, launch collateral)**
  - `semantically_similar_to` [INFERRED] → **Requirements Spec — MVP Requirements (live points, league standings, squad view, transfer analytics)**
  - `conceptually_related_to` [INFERRED] → **FPL Dashboard Logo (ChatGPT-generated SVG branding asset)**

### Problems Solved (fragmented matchday tracking, lack of planning context, weak decision review)
- **Source:** `PRODUCT_OVERVIEW.md`
- **Type:** document
- **Connections:** 4
- **Edges:**
  - `references` [EXTRACTED] → **Core Value — Live Clarity (GW lifecycle, rank/score awareness, auto-sub logic)**
  - `references` [EXTRACTED] → **Core Value — Planning Intelligence (fixture ticker, DGW/BGW, captaincy adviser, Transfer Optimizer)**
  - `references` [EXTRACTED] → **Core Value — Decision Review (transfer analyser, history, season trajectory)**
  - `references` [INFERRED] → **Product Differentiation vs Official FPL Interface**

### Core Value — Planning Intelligence (fixture ticker, DGW/BGW, captaincy adviser, Transfer Optimizer)
- **Source:** `PRODUCT_OVERVIEW.md`
- **Type:** document
- **Connections:** 4
- **Edges:**
  - `implements` [INFERRED] → **Suggestions & Optimization Route (xP heuristics + captaincy + transfer)**
  - `references` [EXTRACTED] → **Problems Solved (fragmented matchday tracking, lack of planning context, weak decision review)**
  - `references` [EXTRACTED] → **README Key Features (Public Team ID Auth, Season Trajectory, BPS Radar, Transfer Analyser)**
  - `conceptually_related_to` [INFERRED] → **DGW/BGW Detection Concept (count matches per team per event, 2+=DGW, 0=BGW)**

### DGW/BGW Detection Concept (count matches per team per event, 2+=DGW, 0=BGW)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 4
- **Edges:**
  - `implements` [EXTRACTED] → **Fixture Route (DGW/BGW detection + 5-GW ticker payload)**
  - `references` [EXTRACTED] → **Key Architectural Decisions (no client FPL calls, bootstrap cache, auto-sub, DGW/BGW, recommendation grading, Vercel serverless)**
  - `conceptually_related_to` [INFERRED] → **Core Value — Planning Intelligence (fixture ticker, DGW/BGW, captaincy adviser, Transfer Optimizer)**
  - `semantically_similar_to` [INFERRED] → **Auto-Sub Projection Concept (simulate injured/0-min starters swapped for bench)**

### Session Authentication via HTTP-only Cookie (fpl_entry_id, public FPL Team ID only)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 4
- **Edges:**
  - `implements` [INFERRED] → **Auth API Routes (login + logout)**
  - `implements` [EXTRACTED] → **API Route Pattern (cookie auth + FPL proxy + reshape)**
  - `references` [EXTRACTED] → **Requirements Spec — Security & Access Controls (session proxy, TLS 1.3, CSRF, data minimization)**
  - `rationale_for` [EXTRACTED] → **Rationale: Session-Based Proxy Auth (FPL API lacks OAuth 2.0, credentials never stored in plain text)**

### User & Squad API Routes
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Next.js API Proxy & Transformation Layer**
  - `references` [EXTRACTED] → **Live Squad Route (auto-sub projection + status lifecycle)** *(cross-community)*
  - `references` [EXTRACTED] → **Suggestions & Optimization Route (xP heuristics + captaincy + transfer)**

### Bootstrap-Static In-Process Cache (15 min TTL)
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **FPL Public API Data Sources** *(cross-community)*
  - `rationale_for` [EXTRACTED] → **Rationale: Bootstrap Cache (expensive endpoint, 15-min in-process cache)**
  - `references` [EXTRACTED] → **Key Architectural Decisions (no client FPL calls, bootstrap cache, auto-sub, DGW/BGW, recommendation grading, Vercel serverless)**

### Suggestions & Optimization Route (xP heuristics + captaincy + transfer)
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **User & Squad API Routes**
  - `references` [EXTRACTED] → **Recommendation Grading Concept (Hit/Miss/Neutral via cron retroactive evaluation)**
  - `implements` [INFERRED] → **Core Value — Planning Intelligence (fixture ticker, DGW/BGW, captaincy adviser, Transfer Optimizer)**

### Core Value — Live Clarity (GW lifecycle, rank/score awareness, auto-sub logic)
- **Source:** `PRODUCT_OVERVIEW.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Problems Solved (fragmented matchday tracking, lack of planning context, weak decision review)**
  - `references` [EXTRACTED] → **README Key Features (Public Team ID Auth, Season Trajectory, BPS Radar, Transfer Analyser)**
  - `conceptually_related_to` [INFERRED] → **Auto-Sub Projection Concept (simulate injured/0-min starters swapped for bench)**

### Core Value — Decision Review (transfer analyser, history, season trajectory)
- **Source:** `PRODUCT_OVERVIEW.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Problems Solved (fragmented matchday tracking, lack of planning context, weak decision review)**
  - `references` [EXTRACTED] → **README Key Features (Public Team ID Auth, Season Trajectory, BPS Radar, Transfer Analyser)**
  - `conceptually_related_to` [INFERRED] → **Recommendation Grading Concept (Hit/Miss/Neutral via cron retroactive evaluation)**

### README Key Features (Public Team ID Auth, Season Trajectory, BPS Radar, Transfer Analyser)
- **Source:** `README.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Core Value — Live Clarity (GW lifecycle, rank/score awareness, auto-sub logic)**
  - `references` [EXTRACTED] → **Core Value — Planning Intelligence (fixture ticker, DGW/BGW, captaincy adviser, Transfer Optimizer)**
  - `references` [EXTRACTED] → **Core Value — Decision Review (transfer analyser, history, season trajectory)**

### Requirements Spec — Functional Requirements FR-01 to FR-09
- **Source:** `RequirementTechSpec.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Requirements Spec — MVP Requirements (live points, league standings, squad view, transfer analytics)**
  - `references` [EXTRACTED] → **Recommendation Grading Concept (Hit/Miss/Neutral via cron retroactive evaluation)**
  - `references` [EXTRACTED] → **Auto-Sub Projection Concept (simulate injured/0-min starters swapped for bench)**

### Design Decision — No Client-Side FPL Requests (all proxied through /api/v1/ to avoid CORS)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `implements` [EXTRACTED] → **Next.js API Proxy & Transformation Layer**
  - `references` [EXTRACTED] → **Key Architectural Decisions (no client FPL calls, bootstrap cache, auto-sub, DGW/BGW, recommendation grading, Vercel serverless)**
  - `rationale_for` [EXTRACTED] → **Rationale: No Client-Side FPL Calls (CORS avoidance + server-side transformation)**

### Vercel Serverless Deployment Target
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Key Architectural Decisions (no client FPL calls, bootstrap cache, auto-sub, DGW/BGW, recommendation grading, Vercel serverless)**
  - `references` [EXTRACTED] → **Requirements Spec — Low-Cost Deployment (Vercel Hobby + Supabase Hobby + GitHub Actions free tier)**
  - `rationale_for` [EXTRACTED] → **Rationale: Vercel Serverless (no persistent state beyond 15-min cache, free tier)**

### Auth API Routes (login + logout)
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Next.js API Proxy & Transformation Layer**
  - `implements` [INFERRED] → **Session Authentication via HTTP-only Cookie (fpl_entry_id, public FPL Team ID only)**

### Cron Evaluate Route (retroactive recommendation grading)
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Next.js API Proxy & Transformation Layer**
  - `implements` [EXTRACTED] → **Recommendation Grading Concept (Hit/Miss/Neutral via cron retroactive evaluation)**

### Fixture & Rank Intelligence Routes
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Next.js API Proxy & Transformation Layer**
  - `references` [EXTRACTED] → **Fixture Route (DGW/BGW detection + 5-GW ticker payload)**

### Fixture Route (DGW/BGW detection + 5-GW ticker payload)
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Fixture & Rank Intelligence Routes**
  - `implements` [EXTRACTED] → **DGW/BGW Detection Concept (count matches per team per event, 2+=DGW, 0=BGW)**

### API Route Pattern (cookie auth + FPL proxy + reshape)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Next.js API Proxy & Transformation Layer**
  - `implements` [EXTRACTED] → **Session Authentication via HTTP-only Cookie (fpl_entry_id, public FPL Team ID only)**

### Requirements Spec — MVP Requirements (live points, league standings, squad view, transfer analytics)
- **Source:** `RequirementTechSpec.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `semantically_similar_to` [INFERRED] → **Product Overview — All-in-One FPL Decision Cockpit**
  - `references` [EXTRACTED] → **Requirements Spec — Functional Requirements FR-01 to FR-09**

### League & Sync Routes
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Next.js API Proxy & Transformation Layer**

### Implementation Plan — API Proxy Layer (initial 4 routes)
- **Source:** `implementation_plan.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Next.js API Proxy & Transformation Layer**

### Product Differentiation vs Official FPL Interface
- **Source:** `PRODUCT_OVERVIEW.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [INFERRED] → **Problems Solved (fragmented matchday tracking, lack of planning context, weak decision review)**

### Promotion Copy — One-Line Pitches & Launch Posts
- **Source:** `PROMOTION_COPY.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `semantically_similar_to` [INFERRED] → **Product Overview — All-in-One FPL Decision Cockpit**

### README Roadmap (rival-watch, mobile optimization, exportable reports, transfer logic, launch collateral)
- **Source:** `README.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [INFERRED] → **Product Overview — All-in-One FPL Decision Cockpit**

### Requirements Spec — Security & Access Controls (session proxy, TLS 1.3, CSRF, data minimization)
- **Source:** `RequirementTechSpec.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Session Authentication via HTTP-only Cookie (fpl_entry_id, public FPL Team ID only)**

### Requirements Spec — API Contract Specification (REST JSON endpoints)
- **Source:** `RequirementTechSpec.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Next.js API Proxy & Transformation Layer**

### Requirements Spec — Low-Cost Deployment (Vercel Hobby + Supabase Hobby + GitHub Actions free tier)
- **Source:** `RequirementTechSpec.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Vercel Serverless Deployment Target**

### FPL Dashboard Logo (ChatGPT-generated SVG branding asset)
- **Source:** `public/branding/Logo - ChatGPT.html`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `conceptually_related_to` [INFERRED] → **Product Overview — All-in-One FPL Decision Cockpit**

### Rationale: No Client-Side FPL Calls (CORS avoidance + server-side transformation)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `rationale_for` [EXTRACTED] → **Design Decision — No Client-Side FPL Requests (all proxied through /api/v1/ to avoid CORS)**

### Rationale: Bootstrap Cache (expensive endpoint, 15-min in-process cache)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `rationale_for` [EXTRACTED] → **Bootstrap-Static In-Process Cache (15 min TTL)**

### Rationale: Vercel Serverless (no persistent state beyond 15-min cache, free tier)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `rationale_for` [EXTRACTED] → **Vercel Serverless Deployment Target**

### Rationale: Session-Based Proxy Auth (FPL API lacks OAuth 2.0, credentials never stored in plain text)
- **Source:** `RequirementTechSpec.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `rationale_for` [EXTRACTED] → **Session Authentication via HTTP-only Cookie (fpl_entry_id, public FPL Team ID only)**

## Cross-Community Connections

- **User & Squad API Routes** `references` [EXTRACTED] → **Live Squad Route (auto-sub projection + status lifecycle)** *(in Dashboard Shell & FPL Data Layer)*
- **Bootstrap-Static In-Process Cache (15 min TTL)** `references` [EXTRACTED] → **FPL Public API Data Sources** *(in Dashboard Shell & FPL Data Layer)*
- **Auto-Sub Projection Concept (simulate injured/0-min starters swapped for bench)** `implements` [EXTRACTED] → **Live Squad Route (auto-sub projection + status lifecycle)** *(in Dashboard Shell & FPL Data Layer)*
