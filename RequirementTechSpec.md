FPL Dashboard: Product Requirements & Technical Specification

1. Product Vision and MVP Scope

The FPL Dashboard is designed to provide a high-performance, centralized interface for managing Fantasy Premier League (FPL) data. As the provided Source Context is limited to the term "FPL dashboard," the features and technical specifications outlined herein are derived from industry-standard requirements for competitive fantasy sports platforms. The vision is to consolidate live match data, squad management, and long-term planning into a single, low-latency entry point.

Data Assumptions: In the absence of specific source constraints, it is assumed the system must integrate with the official Premier League API, which lacks a public-facing developer sandbox and utilizes session-based authentication rather than standard OAuth flows.

MVP Requirements

* Real-time Point Tracking: Live calculation of gameweek points including provisional bonus points.
* League Standings & Movement: Dynamic updates of classic and head-to-head league ranks with "live" rank projections.
* Squad Management View: A comprehensive 15-player roster display indicating injury status, price, and upcoming fixtures.
* Basic Transfer Analytics: Tracking of remaining bank balance and gameweek transfer costs.

2. Functional Requirements

The following requirements define the core operational capabilities of the dashboard.

Feature ID	Requirement Description	Priority
FR-01	Secure synchronization with official FPL user data via session-based authentication.	Must (Done)
FR-02	Real-time "Live Points" display during active Premier League matches.	Must (Done)
FR-03	Automated visual logic for bench substitutions and captaincy multipliers.	Must (Done)
FR-04	Season Trajectory 2.0 with Dual-Axis Log Rank and Chip Markers.	Must (Done)
FR-05	Fixture Ticker with 5-GW heat-mapped intensity and player metadata.	Must (Done)
FR-06	Mini-League "Rival Gaps Analysis" comparison engine.	Must (Done)
FR-07	Transfer Analyser tracking historical performance vs. point hits.	Should (Done)
FR-08	Optimization engine for transfer suggestions based on projected points.	Could

3. Security and Access Controls

Given the sensitive nature of user credentials and the non-standard nature of the FPL API, the following protocols are mandatory:

1. Session-Based Proxy Authentication: Since the official FPL API does not support OAuth 2.0 for third-party apps, the system must implement a secure proxy that handles session cookies. Credentials must never be stored in plain text; the system should facilitate a "pass-through" login to the official endpoint.
2. HTTPS Encryption: Mandatory implementation of TLS 1.3 for all data in transit to protect session cookies and team identifiers.
3. Cross-Site Request Forgery (CSRF) Protection: Implement robust anti-CSRF tokens for any state-changing actions (e.g., making transfers or changing captaincy via the dashboard).
4. Data Minimization & Privacy: No Personally Identifiable Information (PII) should be persisted. Only the FPL entry_id and non-sensitive squad metadata should be cached.

4. Logical Data Model

The system utilizes a relational structure to manage the high volume of temporal data (gameweeks) and many-to-many relationships (players in squads).

* User
  * id: Internal UUID (Primary Key)
  * fpl_entry_id: Official FPL identifier
  * team_name: String
  * Relationship: 1 : N with Squad (A user has one squad state per gameweek).
* Squad
  * id: Internal UUID (Primary Key)
  * user_id: Foreign Key
  * gameweek_id: Foreign Key
  * bank_balance: Decimal
  * Relationship: M : N with Player (A squad contains 15 players; a player belongs to millions of squads).
* Player
  * id: Official FPL Player ID (Primary Key)
  * web_name: String
  * position: Enum (GKP, DEF, MID, FWD)
  * current_price: Decimal
  * status: Enum (Available, Injured, Suspended, Unavailable)
  * Relationship: 1 : N with Gameweek_Stats.
* Gameweek
  * id: Integer (1-38)
  * deadline_time: Timestamp
  * is_current: Boolean
* League
  * id: Official FPL League ID
  * name: String
  * Relationship: M : N with User (Users participate in multiple leagues).

5. API Contract Specification

The backend service follows a RESTful architecture. Responses are structured as JSON.

* Method: GET
* Endpoint Path: /api/v1/user/summary
* Description: Retrieves team overview and rank.
* Expected Response: {"user_id": 12345, "team_name": "FC Technical", "overall_rank": 500, "total_points": 1250}
* Method: GET
* Endpoint Path: /api/v1/squad/live
* Description: Live point data for the current active squad.
* Expected Response: {"gameweek": 25, "players": [{"id": 101, "name": "Salah", "live_points": 7, "is_captain": true, "minutes": 90}]}
* Method: GET
* Endpoint Path: /api/v1/leagues
* Description: Returns status of all joined leagues.
* Expected Response: {"leagues": [{"league_id": 555, "name": "Global", "rank": 500, "movement": "up"}]}
* Method: POST
* Endpoint Path: /api/v1/squad/optimize
* Description: Computes transfer recommendations.
* Expected Response: {"suggestions": [{"out_id": 202, "in_id": 303, "expected_gain": 4.5}]}

6. Low-Cost Deployment & Infrastructure Plan

To adhere to the "low-cost" mandate, the architecture leverages serverless tiers and aggressive caching.

Deployment Roadmap

1. Frontend & Routing: Deploy a React/Next.js frontend with its API proxy routes to Vercel (Hobby Tier). We are intentionally utilizing Vercel's free default `.app` domain suffix (`https://fpl-dashboard-luoxiaobins-projects.vercel.app`) to strictly adhere to the $0.00 MVP startup costs.
2. Custom Domain Scaling: If the dashboard expands heavily past Phase 3 or requires a distinct brand (e.g., `fpl-dashboard.com`), a custom top-level domain can be purchased for ~$15/year through a registrar and seamlessly connected within the Vercel Dashboard -> Settings -> Domains portal for no added hosting charge.
3. Persistence: Use Supabase (Hobby Tier) for the PostgreSQL database managing user settings, tracking the `fpl_entry_id` securely.
4. CI/CD Pipeline: Utilize GitHub Actions (Free Tier) to run Vitest and Playwright regressions simultaneously on every merge to the main branch. Vercel automatically deploys the application.

Data Freshness & Caching Strategy

* API Rate Limiting: The FPL API is subject to strict rate limits. The architecture must include an In-Memory Cache (TTL: 60s).
* Implementation: Use a serverless-side cache or a free-tier Redis (Upstash) instance to store "General Info" player data, ensuring the backend only calls the official API once per minute regardless of concurrent user volume.

7. Non-Functional Requirements

* Latency: Critical dashboard components must render in under 2.0 seconds on standard 4G connections.
* Uptime: Target 99.9% availability during the "Deadline Hour" (the 60 minutes preceding a gameweek deadline).
* Mobile Responsiveness: Design must prioritize Mobile-First breakpoints, as 80%+ of traffic occurs via mobile during live matches.
* Scalability: System must support a 10x surge in concurrent users during live Saturday afternoon kick-offs without performance degradation.
* Data Consistency: Real-time point updates should synchronize across all user views within 30 seconds of an official API update.

8. Database Sync Architecture (Supabase)

The sync process is triggered automatically after every successful login via a background call to `/api/v1/sync`. 

Sync Pipeline

1. Bootstrap Sync — Fetches `https://fantasy.premierleague.com/api/bootstrap-static/` and upserts:
   - All 38 `gameweeks` (id, deadline_time, is_current)
   - All Premier League `players` (id, name, position, current_price, status)
2. Squad History Sync — Fetches `/api/entry/{id}/history/` and persists:
   - One `squads` row per gameweek (bank_balance, user_id)
   - 15 `squad_players` rows per squad (player_id, multiplier, pitch_position)
3. Idempotency — All writes use `upsert` with `ON CONFLICT` guards. Re-running sync refreshes stale data without creating duplicates.

Data Persisted Per Login

| Table         | Data Stored                                           |
|---------------|-------------------------------------------------------|
| users         | fpl_entry_id, team_name, created_at                   |
| gameweeks     | id, deadline_time, is_current, is_next                |
| players       | id, web_name, position, current_price, status         |
| squads        | user_id, gameweek_id, bank_balance                    |
| squad_players | squad_id, player_id, multiplier, pitch_position       |
