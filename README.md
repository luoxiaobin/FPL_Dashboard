# FPL Dashboard ⚽

A planning and matchday dashboard for Fantasy Premier League managers looking to improve their overall rank.

[Live demo](https://fpl-dashboard-seven-pi.vercel.app/)

![FPL Dashboard team ID entry screen](docs/screenshot.png)

## Why I built it

I wanted to see what a transfer would mean over the next five Gameweeks, starting from the squad I actually had. I also wanted to compare a safer plan with a higher-upside one and see where the extra risk came from.

## What it does

- Compare five-Gameweek Floor, Balanced, and Upside plans with transfers, hits, lineups, captaincy, and projected points.
- Lock players, exclude transfer targets, cap hits, and reserve money in the bank.
- Import and review your current Pick Team squad before the deadline, then save a plan and evaluate it against finalized results.
- Track live squad points, rank, fixtures, and mini-league standings.

## Tech & design choices

The app uses Next.js, React, TypeScript, Supabase/Postgres, and Recharts. Vercel hosts the production deployment.

- Official FPL endpoints provide the published baseline. A user-invoked bookmarklet can read the pre-deadline squad in a signed-in FPL browser and send only the planning fields. The dashboard never receives the FPL credentials or submits squad changes.
- Supabase stores immutable planning snapshots so a saved recommendation can be evaluated against the inputs that produced it.
- The scenario generator enforces FPL squad and budget rules. When the objectives converge on the same moves, the workspace shows a single recommendation with a range of outcomes.

See the [system documentation](docs/SYSTEM_DOCUMENTATION.md), [user guide](docs/USER_GUIDE.md), and [launch runbook](docs/operations/2026-27-launch-runbook.md) for details. The documents under `docs/redesign/` preserve the original product design and architectural decisions.

## Run locally

```bash
npm ci
npm run dev
```

Open <http://localhost:3000> and enter an FPL team ID. With no Supabase settings, the development server keeps login sessions in memory until it restarts. Public dashboard data is available in this mode.

### Planning with a development database

Squad import, persistent planning scenarios, and **My Plan** require Supabase. For an existing development project, apply [the base schema](supabase/schema.sql) to an empty database, then apply [the migrations](supabase/migrations) in filename order.

To run a fresh Supabase stack locally, start a Docker-compatible runtime and run these commands from the repo root. The generated Supabase project lives outside the checkout.

```bash
mkdir -p ../work/fpl-supabase
npx supabase init --workdir ../work/fpl-supabase
mkdir -p ../work/fpl-supabase/supabase/migrations
cp supabase/schema.sql ../work/fpl-supabase/supabase/migrations/000_base_schema.sql
cp supabase/migrations/*.sql ../work/fpl-supabase/supabase/migrations/
npx supabase start --workdir ../work/fpl-supabase
```

Set `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and the server-only `SUPABASE_SERVICE_ROLE_KEY` in `.env.local` using the development project's API URL, anon key, and service-role key. For a local stack, `npx supabase status -o env --workdir ../work/fpl-supabase` shows these as `API_URL`, `ANON_KEY`, and `SERVICE_ROLE_KEY`. Restart Next.js after changing the settings.

Open `/api/v1/health` and check that the database passes. Sign in, open `/planning`, import and confirm a squad, generate scenarios, save one under **My Plan**, and reload the page to verify the saved choice.

### Optional Sonnet plan explanations

Set the server-only `ANTHROPIC_API_KEY` in `.env.local` and restart Next.js. After saving a scenario in Planning, choose **Explain this plan**. The app requests explanations on demand and caches them for the saved scenario and prompt version. The local Supabase stack needs the planning explanations migration.

### Curated Team News pilot

Planning shows stored news for players in the current squad and suggested transfers. A new batch replaces the displayed batch for that Gameweek, so include earlier reports that are still relevant when publishing an update. The pilot uses Claude Haiku 5.5, the same server-side Anthropic key as plan explanations, and the team-news Supabase migration.

Prepare a JSON batch with the exact FPL deadline, FPL player IDs, and short excerpts from reliable reports. Supply publication times with timezones. The example below is synthetic.

```json
{
  "deadline": "2026-11-21T11:00:00Z",
  "players": [{ "id": 123, "name": "Example Player" }],
  "sources": [{
    "id": "club-briefing",
    "url": "https://club.example/team-news",
    "publishedAt": "2026-11-18T12:00:00Z",
    "excerpt": "The manager said Example Player will miss Saturday's match."
  }]
}
```

```bash
node --env-file=.env.local scripts/publish-team-news.mjs /path/to/batch.json --dry-run
node --env-file=.env.local scripts/publish-team-news.mjs /path/to/batch.json
```

A dry run calls Haiku and prints the verified signals without writing to Supabase. Publish reviewed real evidence only. The panel reports the last processed batch and the time of each source. The pilot is manually curated and displays news alongside the current plan.

## What I'd do next

Calibrate projections against finalized results, automate a reviewed team-news freshness workflow, model the value of rolling a transfer, extend chip planning across the full half-season, and add full Wildcard and Free Hit planning. The current implementation status and limitations are tracked in the [system documentation](docs/SYSTEM_DOCUMENTATION.md#21-known-limitations-and-recommended-next-work).
