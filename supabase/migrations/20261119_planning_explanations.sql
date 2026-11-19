CREATE TABLE IF NOT EXISTS public.planning_explanations (
  scenario_id UUID NOT NULL REFERENCES public.planning_scenarios(id) ON DELETE CASCADE,
  version TEXT NOT NULL,
  explanation TEXT NOT NULL,
  PRIMARY KEY (scenario_id, version)
);

ALTER TABLE public.planning_explanations ENABLE ROW LEVEL SECURITY;
GRANT SELECT, INSERT ON public.planning_explanations TO service_role;
