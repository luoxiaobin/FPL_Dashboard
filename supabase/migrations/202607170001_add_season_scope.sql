-- Phase 1A: add season scope without removing any legacy keys or constraints.
-- Existing releases continue to work while season-aware callers are introduced.
-- Run the preflight verification and take a restorable backup before applying.

BEGIN;

CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL CHECK (code ~ '^[0-9]{4}-[0-9]{2}$'),
  starts_at DATE NOT NULL,
  ends_at DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'preparing'
    CHECK (status IN ('preparing', 'active', 'archived')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW()),
  CHECK (ends_at > starts_at)
);

INSERT INTO public.seasons (code, starts_at, ends_at, status)
VALUES
  ('2025-26', DATE '2025-08-15', DATE '2026-05-24', 'archived'),
  ('2026-27', DATE '2026-08-21', DATE '2027-05-30', 'preparing')
ON CONFLICT (code) DO UPDATE SET
  starts_at = EXCLUDED.starts_at,
  ends_at = EXCLUDED.ends_at;

CREATE UNIQUE INDEX IF NOT EXISTS seasons_one_active_idx
  ON public.seasons ((status))
  WHERE status = 'active';

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);
ALTER TABLE public.gameweeks
  ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);
ALTER TABLE public.squads
  ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);
ALTER TABLE public.squad_players
  ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);
ALTER TABLE public.recommendation_logs
  ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);

-- All rows predating this migration belong to the completed 2025/26 season.
UPDATE public.users
SET season_id = (SELECT id FROM public.seasons WHERE code = '2025-26')
WHERE season_id IS NULL;
UPDATE public.players
SET season_id = (SELECT id FROM public.seasons WHERE code = '2025-26')
WHERE season_id IS NULL;
UPDATE public.gameweeks
SET season_id = (SELECT id FROM public.seasons WHERE code = '2025-26')
WHERE season_id IS NULL;
UPDATE public.squads
SET season_id = (SELECT id FROM public.seasons WHERE code = '2025-26')
WHERE season_id IS NULL;
UPDATE public.squad_players AS squad_player
SET season_id = squad.season_id
FROM public.squads AS squad
WHERE squad_player.squad_id = squad.id
  AND squad_player.season_id IS NULL;
UPDATE public.recommendation_logs
SET season_id = (SELECT id FROM public.seasons WHERE code = '2025-26')
WHERE season_id IS NULL;

-- Add composite uniqueness alongside the legacy global keys. The legacy keys are
-- retired only after every application upsert supplies season_id.
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_season_entry_key;
ALTER TABLE public.users
  ADD CONSTRAINT users_season_entry_key UNIQUE (season_id, fpl_entry_id);
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_season_id_key;
ALTER TABLE public.players
  ADD CONSTRAINT players_season_id_key UNIQUE (season_id, id);
ALTER TABLE public.gameweeks DROP CONSTRAINT IF EXISTS gameweeks_season_id_key;
ALTER TABLE public.gameweeks
  ADD CONSTRAINT gameweeks_season_id_key UNIQUE (season_id, id);
ALTER TABLE public.squads DROP CONSTRAINT IF EXISTS squads_season_id_key;
ALTER TABLE public.squads
  ADD CONSTRAINT squads_season_id_key UNIQUE (season_id, id);
ALTER TABLE public.squads DROP CONSTRAINT IF EXISTS squads_user_season_gameweek_key;
ALTER TABLE public.squads
  ADD CONSTRAINT squads_user_season_gameweek_key
  UNIQUE (user_id, season_id, gameweek_id);

-- NOT VALID exposes historical anomalies in postflight checks without blocking the
-- additive migration. New non-null rows are still checked by PostgreSQL.
ALTER TABLE public.squads DROP CONSTRAINT IF EXISTS squads_season_gameweek_fkey;
ALTER TABLE public.squads
  ADD CONSTRAINT squads_season_gameweek_fkey
  FOREIGN KEY (season_id, gameweek_id)
  REFERENCES public.gameweeks(season_id, id)
  ON DELETE CASCADE NOT VALID;

ALTER TABLE public.squad_players
  DROP CONSTRAINT IF EXISTS squad_players_season_squad_fkey;
ALTER TABLE public.squad_players
  ADD CONSTRAINT squad_players_season_squad_fkey
  FOREIGN KEY (season_id, squad_id)
  REFERENCES public.squads(season_id, id)
  ON DELETE CASCADE NOT VALID;

ALTER TABLE public.squad_players
  DROP CONSTRAINT IF EXISTS squad_players_season_player_fkey;
ALTER TABLE public.squad_players
  ADD CONSTRAINT squad_players_season_player_fkey
  FOREIGN KEY (season_id, player_id)
  REFERENCES public.players(season_id, id)
  ON DELETE CASCADE NOT VALID;

ALTER TABLE public.recommendation_logs
  DROP CONSTRAINT IF EXISTS recommendation_logs_season_gameweek_fkey;
ALTER TABLE public.recommendation_logs
  ADD CONSTRAINT recommendation_logs_season_gameweek_fkey
  FOREIGN KEY (season_id, gameweek_id)
  REFERENCES public.gameweeks(season_id, id)
  ON DELETE RESTRICT NOT VALID;
ALTER TABLE public.recommendation_logs
  DROP CONSTRAINT IF EXISTS recommendation_logs_season_out_player_fkey;
ALTER TABLE public.recommendation_logs
  ADD CONSTRAINT recommendation_logs_season_out_player_fkey
  FOREIGN KEY (season_id, out_player_id)
  REFERENCES public.players(season_id, id)
  ON DELETE RESTRICT NOT VALID;
ALTER TABLE public.recommendation_logs
  DROP CONSTRAINT IF EXISTS recommendation_logs_season_in_player_fkey;
ALTER TABLE public.recommendation_logs
  ADD CONSTRAINT recommendation_logs_season_in_player_fkey
  FOREIGN KEY (season_id, in_player_id)
  REFERENCES public.players(season_id, id)
  ON DELETE RESTRICT NOT VALID;

CREATE INDEX IF NOT EXISTS users_season_entry_idx
  ON public.users(season_id, fpl_entry_id);
CREATE INDEX IF NOT EXISTS players_season_idx ON public.players(season_id);
CREATE INDEX IF NOT EXISTS gameweeks_season_idx ON public.gameweeks(season_id);
CREATE INDEX IF NOT EXISTS squads_season_gameweek_idx
  ON public.squads(season_id, gameweek_id);
CREATE INDEX IF NOT EXISTS squad_players_season_player_idx
  ON public.squad_players(season_id, player_id);
CREATE INDEX IF NOT EXISTS recommendation_logs_season_gameweek_idx
  ON public.recommendation_logs(season_id, gameweek_id);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.seasons;
CREATE POLICY "Allow public read access"
  ON public.seasons FOR SELECT USING (true);

COMMENT ON TABLE public.seasons IS
  'FPL season boundary. A preparing season is not eligible for live writes.';
COMMENT ON COLUMN public.users.season_id IS
  'Season of this legacy FPL entry profile; users is not a durable account table.';
COMMENT ON COLUMN public.users.fpl_entry_id IS
  'Public FPL entry ID, unique within a season after application cutover.';

COMMIT;
