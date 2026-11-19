CREATE TABLE IF NOT EXISTS public.planning_team_news (
  input_hash TEXT PRIMARY KEY,
  deadline TIMESTAMPTZ NOT NULL,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  model TEXT NOT NULL,
  model_name TEXT NOT NULL,
  signals JSONB NOT NULL CHECK (jsonb_typeof(signals) = 'array')
);

CREATE INDEX IF NOT EXISTS planning_team_news_deadline_idx
  ON public.planning_team_news (deadline, processed_at DESC);

ALTER TABLE public.planning_team_news ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.planning_team_news TO service_role;
