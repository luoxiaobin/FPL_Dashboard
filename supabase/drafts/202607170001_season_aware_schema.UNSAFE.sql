-- Make every FPL identifier season-scoped before the 2026/27 rollover.
-- Apply to staging first and take a database backup before production.

CREATE TABLE IF NOT EXISTS public.seasons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code TEXT UNIQUE NOT NULL CHECK (code ~ '^\\d{4}-\\d{2}$'),
  starts_at DATE,
  ends_at DATE,
  is_current BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT TIMEZONE('utc', NOW())
);

INSERT INTO public.seasons (code, starts_at, ends_at, is_current)
VALUES ('2025-26', DATE '2025-08-01', DATE '2026-06-30', TRUE)
ON CONFLICT (code) DO NOTHING;

ALTER TABLE public.users ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);
ALTER TABLE public.players ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);
ALTER TABLE public.gameweeks ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);
ALTER TABLE public.squads ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);
ALTER TABLE public.squad_players ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);
ALTER TABLE public.recommendation_logs ADD COLUMN IF NOT EXISTS season_id UUID REFERENCES public.seasons(id);

UPDATE public.users SET season_id = (SELECT id FROM public.seasons WHERE code = '2025-26') WHERE season_id IS NULL;
UPDATE public.players SET season_id = (SELECT id FROM public.seasons WHERE code = '2025-26') WHERE season_id IS NULL;
UPDATE public.gameweeks SET season_id = (SELECT id FROM public.seasons WHERE code = '2025-26') WHERE season_id IS NULL;
UPDATE public.squads SET season_id = (SELECT id FROM public.seasons WHERE code = '2025-26') WHERE season_id IS NULL;
UPDATE public.squad_players sp
SET season_id = s.season_id
FROM public.squads s
WHERE sp.squad_id = s.id AND sp.season_id IS NULL;
UPDATE public.recommendation_logs SET season_id = (SELECT id FROM public.seasons WHERE code = '2025-26') WHERE season_id IS NULL;

ALTER TABLE public.users ALTER COLUMN season_id SET NOT NULL;
ALTER TABLE public.players ALTER COLUMN season_id SET NOT NULL;
ALTER TABLE public.gameweeks ALTER COLUMN season_id SET NOT NULL;
ALTER TABLE public.squads ALTER COLUMN season_id SET NOT NULL;
ALTER TABLE public.squad_players ALTER COLUMN season_id SET NOT NULL;
ALTER TABLE public.recommendation_logs ALTER COLUMN season_id SET NOT NULL;

ALTER TABLE public.squad_players DROP CONSTRAINT IF EXISTS squad_players_player_id_fkey;
ALTER TABLE public.squads DROP CONSTRAINT IF EXISTS squads_gameweek_id_fkey;
ALTER TABLE public.players DROP CONSTRAINT IF EXISTS players_pkey;
ALTER TABLE public.gameweeks DROP CONSTRAINT IF EXISTS gameweeks_pkey;
ALTER TABLE public.players ADD CONSTRAINT players_pkey PRIMARY KEY (season_id, id);
ALTER TABLE public.gameweeks ADD CONSTRAINT gameweeks_pkey PRIMARY KEY (season_id, id);

ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_fpl_entry_id_key;
ALTER TABLE public.users ADD CONSTRAINT users_season_entry_key UNIQUE (season_id, fpl_entry_id);

ALTER TABLE public.squads DROP CONSTRAINT IF EXISTS squads_user_id_gameweek_id_key;
ALTER TABLE public.squads ADD CONSTRAINT squads_user_season_gameweek_key UNIQUE (user_id, season_id, gameweek_id);
ALTER TABLE public.squads ADD CONSTRAINT squads_season_gameweek_fkey
  FOREIGN KEY (season_id, gameweek_id) REFERENCES public.gameweeks(season_id, id) ON DELETE CASCADE;

ALTER TABLE public.squad_players ADD CONSTRAINT squad_players_season_player_fkey
  FOREIGN KEY (season_id, player_id) REFERENCES public.players(season_id, id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_users_season_entry ON public.users(season_id, fpl_entry_id);
CREATE INDEX IF NOT EXISTS idx_squads_season_gameweek ON public.squads(season_id, gameweek_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_season_gameweek ON public.recommendation_logs(season_id, gameweek_id);

ALTER TABLE public.seasons ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow public read access" ON public.seasons;
CREATE POLICY "Allow public read access" ON public.seasons FOR SELECT USING (true);

COMMENT ON TABLE public.seasons IS 'Season boundary for FPL identifiers that are reused every year.';
COMMENT ON COLUMN public.users.fpl_entry_id IS 'Public FPL entry ID, unique only within a season.';
