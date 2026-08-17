-- Additive foundation for the scenario-based planning workspace.
-- Legacy tables remain untouched until the new workflow has been validated.

CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL CHECK (code ~ '^20[0-9]{2}-[0-9]{2}$'),
  starts_on DATE NOT NULL,
  ends_on DATE NOT NULL,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (ends_on > starts_on)
);

CREATE UNIQUE INDEX IF NOT EXISTS one_current_season
  ON public.seasons (is_current)
  WHERE is_current;

CREATE TABLE IF NOT EXISTS public.fpl_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  season_id UUID NOT NULL REFERENCES public.seasons(id) ON DELETE RESTRICT,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fresh_until TIMESTAMPTZ NOT NULL,
  source_version TEXT NOT NULL,
  bootstrap JSONB NOT NULL,
  fixtures JSONB NOT NULL,
  UNIQUE (season_id, source_version)
);

CREATE INDEX IF NOT EXISTS fpl_snapshots_latest
  ON public.fpl_snapshots (season_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS public.entry_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpl_snapshot_id UUID NOT NULL REFERENCES public.fpl_snapshots(id) ON DELETE RESTRICT,
  fpl_entry_id BIGINT NOT NULL,
  gameweek_id INT NOT NULL CHECK (gameweek_id BETWEEN 1 AND 38),
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  fresh_until TIMESTAMPTZ NOT NULL,
  entry_payload JSONB NOT NULL,
  picks_payload JSONB NOT NULL,
  transfers_payload JSONB,
  UNIQUE (fpl_snapshot_id, fpl_entry_id, gameweek_id)
);

CREATE INDEX IF NOT EXISTS entry_snapshots_latest
  ON public.entry_snapshots (fpl_entry_id, captured_at DESC);

CREATE TABLE IF NOT EXISTS public.planning_scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entry_snapshot_id UUID NOT NULL REFERENCES public.entry_snapshots(id) ON DELETE RESTRICT,
  strategy TEXT NOT NULL CHECK (strategy IN ('floor', 'balanced', 'upside')),
  horizon_gameweeks INT NOT NULL DEFAULT 5 CHECK (horizon_gameweeks BETWEEN 1 AND 8),
  model_version TEXT NOT NULL,
  constraints JSONB NOT NULL DEFAULT '{}'::JSONB,
  projections JSONB NOT NULL,
  decisions JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (entry_snapshot_id, strategy, model_version, constraints)
);

CREATE TABLE IF NOT EXISTS public.plan_selections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID NOT NULL REFERENCES public.planning_scenarios(id) ON DELETE RESTRICT,
  fpl_entry_id BIGINT NOT NULL,
  selected_decisions JSONB NOT NULL,
  selected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  frozen_at TIMESTAMPTZ,
  outcome JSONB
);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fpl_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.entry_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planning_scenarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.plan_selections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No anonymous access to seasons" ON public.seasons;
CREATE POLICY "No anonymous access to seasons" ON public.seasons FOR ALL USING (FALSE);
DROP POLICY IF EXISTS "No anonymous access to fpl snapshots" ON public.fpl_snapshots;
CREATE POLICY "No anonymous access to fpl snapshots" ON public.fpl_snapshots FOR ALL USING (FALSE);
DROP POLICY IF EXISTS "No anonymous access to entry snapshots" ON public.entry_snapshots;
CREATE POLICY "No anonymous access to entry snapshots" ON public.entry_snapshots FOR ALL USING (FALSE);
DROP POLICY IF EXISTS "No anonymous access to planning scenarios" ON public.planning_scenarios;
CREATE POLICY "No anonymous access to planning scenarios" ON public.planning_scenarios FOR ALL USING (FALSE);
DROP POLICY IF EXISTS "No anonymous access to plan selections" ON public.plan_selections;
CREATE POLICY "No anonymous access to plan selections" ON public.plan_selections FOR ALL USING (FALSE);

