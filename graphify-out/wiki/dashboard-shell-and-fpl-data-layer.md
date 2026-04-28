# Dashboard Shell & FPL Data Layer

*Community 2 · 24 nodes*

[← Back to index](index.md)

## Nodes

### Mobile Design — Panel Ordering (planning mode vs live mode default orders, user customization)
- **Source:** `docs/mobile-first-design.md`
- **Type:** document
- **Connections:** 5
- **Edges:**
  - `references` [EXTRACTED] → **Supabase Database Tables (users, players, gameweeks, squads, squad_players, user_preferences, recommendation_logs)**
  - `references` [EXTRACTED] → **Mobile Design — GW Mode Detection (planning vs live, useGwMode hook)**
  - `references` [EXTRACTED] → **Mobile Plan — panelOrder.ts (ALL_PANEL_KEYS, PLANNING_DEFAULT_ORDER, LIVE_DEFAULT_ORDER, mergeOrder)**
  - `references` [EXTRACTED] → **Mobile Plan — preferences route edit (planning_panel_order + live_panel_order in JSONB)**
  - `references` [EXTRACTED] → **Mobile Plan — settings/page.tsx edit (per-mode panel reorder UI with up/down arrows)**

### Live Squad Route (auto-sub projection + status lifecycle)
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 4
- **Edges:**
  - `references` [EXTRACTED] → **User & Squad API Routes** *(cross-community)*
  - `references` [EXTRACTED] → **FPL Public API Data Sources**
  - `implements` [EXTRACTED] → **Auto-Sub Projection Concept (simulate injured/0-min starters swapped for bench)** *(cross-community)*
  - `implements` [EXTRACTED] → **Gameweek Status Lifecycle (live / provisional / official)**

### Repository Structure (src/app, src/components, src/lib, supabase)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 4
- **Edges:**
  - `references` [INFERRED] → **Technology Stack (Next.js 16 + React 19 + TypeScript + Supabase + Recharts)**
  - `references` [EXTRACTED] → **App Shell (page.tsx + login/page.tsx)**
  - `references` [EXTRACTED] → **Player Image Strategy (club shirt assets via playerImage.ts)**
  - `references` [EXTRACTED] → **Mobile Plan — sectionPreferences.ts edit (add transferOptimizer to SECTION_KEYS)**

### FPL Public API Data Sources
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Live Squad Route (auto-sub projection + status lifecycle)**
  - `references` [EXTRACTED] → **Bootstrap-Static In-Process Cache (15 min TTL)** *(cross-community)*
  - `references` [EXTRACTED] → **Requirements Spec — Database Sync Architecture (bootstrap sync + squad history sync, upsert idempotency)**

### Supabase Persistence Layer
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `rationale_for` [EXTRACTED] → **Rationale: Supabase over MongoDB (relational model maps to 1:N, M:N FPL data relationships)**
  - `references` [EXTRACTED] → **Supabase Database Tables (users, players, gameweeks, squads, squad_players, user_preferences, recommendation_logs)**
  - `references` [EXTRACTED] → **Requirements Spec — Database Sync Architecture (bootstrap sync + squad history sync, upsert idempotency)**

### Supabase Database Tables (users, players, gameweeks, squads, squad_players, user_preferences, recommendation_logs)
- **Source:** `CLAUDE.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Supabase Persistence Layer**
  - `references` [EXTRACTED] → **Requirements Spec — Logical Data Model (User, Squad, Player, Gameweek, League)**
  - `references` [EXTRACTED] → **Mobile Design — Panel Ordering (planning mode vs live mode default orders, user customization)**

### Mobile Design — GW Mode Detection (planning vs live, useGwMode hook)
- **Source:** `docs/mobile-first-design.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Mobile Plan — useGwMode.ts hook (statusToMode, polling every 60s)**
  - `references` [INFERRED] → **Gameweek Status Lifecycle (live / provisional / official)**
  - `references` [EXTRACTED] → **Mobile Design — Panel Ordering (planning mode vs live mode default orders, user customization)**

### Mobile Plan — panelOrder.ts (ALL_PANEL_KEYS, PLANNING_DEFAULT_ORDER, LIVE_DEFAULT_ORDER, mergeOrder)
- **Source:** `docs/superpowers/plans/2026-04-26-mobile-first-ui.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Mobile Design — Panel Ordering (planning mode vs live mode default orders, user customization)**
  - `references` [EXTRACTED] → **Mobile Plan — page.tsx edit (renderPanel switch + dynamic ordering + GwModeIndicator)**
  - `references` [EXTRACTED] → **Mobile Plan — sectionPreferences.ts edit (add transferOptimizer to SECTION_KEYS)**

### Mobile Plan — useGwMode.ts hook (statusToMode, polling every 60s)
- **Source:** `docs/superpowers/plans/2026-04-26-mobile-first-ui.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Mobile Design — GW Mode Detection (planning vs live, useGwMode hook)**
  - `rationale_for` [EXTRACTED] → **Rationale: useGwMode sessionStorage Override (clears on reload — intentional, avoids stale live data)**
  - `references` [EXTRACTED] → **Mobile Plan — page.tsx edit (renderPanel switch + dynamic ordering + GwModeIndicator)**

### Mobile Plan — page.tsx edit (renderPanel switch + dynamic ordering + GwModeIndicator)
- **Source:** `docs/superpowers/plans/2026-04-26-mobile-first-ui.md`
- **Type:** document
- **Connections:** 3
- **Edges:**
  - `references` [EXTRACTED] → **Mobile Plan — panelOrder.ts (ALL_PANEL_KEYS, PLANNING_DEFAULT_ORDER, LIVE_DEFAULT_ORDER, mergeOrder)**
  - `references` [EXTRACTED] → **Mobile Plan — useGwMode.ts hook (statusToMode, polling every 60s)**
  - `references` [EXTRACTED] → **Mobile Plan — GwModeIndicator component (toggle pill, sessionStorage override)**

### Requirements Spec — Database Sync Architecture (bootstrap sync + squad history sync, upsert idempotency)
- **Source:** `RequirementTechSpec.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **FPL Public API Data Sources**
  - `references` [EXTRACTED] → **Supabase Persistence Layer**

### Mobile Plan — sectionPreferences.ts edit (add transferOptimizer to SECTION_KEYS)
- **Source:** `docs/superpowers/plans/2026-04-26-mobile-first-ui.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Repository Structure (src/app, src/components, src/lib, supabase)**
  - `references` [EXTRACTED] → **Mobile Plan — panelOrder.ts (ALL_PANEL_KEYS, PLANNING_DEFAULT_ORDER, LIVE_DEFAULT_ORDER, mergeOrder)**

### Mobile Plan — GwModeIndicator component (toggle pill, sessionStorage override)
- **Source:** `docs/superpowers/plans/2026-04-26-mobile-first-ui.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Mobile Design — GwModeIndicator Component (pill badge, override dropdown)**
  - `references` [EXTRACTED] → **Mobile Plan — page.tsx edit (renderPanel switch + dynamic ordering + GwModeIndicator)**

### Gameweek Status Lifecycle (live / provisional / official)
- **Source:** `PRODUCT_OVERVIEW.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `implements` [EXTRACTED] → **Live Squad Route (auto-sub projection + status lifecycle)**
  - `references` [INFERRED] → **Mobile Design — GW Mode Detection (planning vs live, useGwMode hook)**

### Rationale: useGwMode sessionStorage Override (clears on reload — intentional, avoids stale live data)
- **Source:** `docs/mobile-first-design.md`
- **Type:** document
- **Connections:** 2
- **Edges:**
  - `references` [EXTRACTED] → **Mobile Design — Error Handling & Edge Cases (mode detection failure, override edge cases, panel order edge cases)**
  - `rationale_for` [EXTRACTED] → **Mobile Plan — useGwMode.ts hook (statusToMode, polling every 60s)**

### Technology Stack (Next.js 16 + React 19 + TypeScript + Supabase + Recharts)
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [INFERRED] → **Repository Structure (src/app, src/components, src/lib, supabase)**

### App Shell (page.tsx + login/page.tsx)
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Repository Structure (src/app, src/components, src/lib, supabase)**

### Player Image Strategy (club shirt assets via playerImage.ts)
- **Source:** `ARCHITECTURE.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Repository Structure (src/app, src/components, src/lib, supabase)**

### Requirements Spec — Logical Data Model (User, Squad, Player, Gameweek, League)
- **Source:** `RequirementTechSpec.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Supabase Database Tables (users, players, gameweeks, squads, squad_players, user_preferences, recommendation_logs)**

### Mobile Design — GwModeIndicator Component (pill badge, override dropdown)
- **Source:** `docs/mobile-first-design.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Mobile Plan — GwModeIndicator component (toggle pill, sessionStorage override)**

### Mobile Design — Error Handling & Edge Cases (mode detection failure, override edge cases, panel order edge cases)
- **Source:** `docs/mobile-first-design.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Rationale: useGwMode sessionStorage Override (clears on reload — intentional, avoids stale live data)**

### Mobile Plan — preferences route edit (planning_panel_order + live_panel_order in JSONB)
- **Source:** `docs/superpowers/plans/2026-04-26-mobile-first-ui.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Mobile Design — Panel Ordering (planning mode vs live mode default orders, user customization)**

### Mobile Plan — settings/page.tsx edit (per-mode panel reorder UI with up/down arrows)
- **Source:** `docs/superpowers/plans/2026-04-26-mobile-first-ui.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `references` [EXTRACTED] → **Mobile Design — Panel Ordering (planning mode vs live mode default orders, user customization)**

### Rationale: Supabase over MongoDB (relational model maps to 1:N, M:N FPL data relationships)
- **Source:** `implementation_plan.md`
- **Type:** document
- **Connections:** 1
- **Edges:**
  - `rationale_for` [EXTRACTED] → **Supabase Persistence Layer**

## Cross-Community Connections

- **FPL Public API Data Sources** `references` [EXTRACTED] → **Bootstrap-Static In-Process Cache (15 min TTL)** *(in API Routes & Server Architecture)*
- **Live Squad Route (auto-sub projection + status lifecycle)** `references` [EXTRACTED] → **User & Squad API Routes** *(in API Routes & Server Architecture)*
- **Live Squad Route (auto-sub projection + status lifecycle)** `implements` [EXTRACTED] → **Auto-Sub Projection Concept (simulate injured/0-min starters swapped for bench)** *(in API Routes & Server Architecture)*
