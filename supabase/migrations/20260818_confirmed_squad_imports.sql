-- Durable, user-confirmed fallback for pre-deadline planning.
-- Service-role API routes are the only access path; browser clients have no RLS policy.

CREATE TABLE IF NOT EXISTS public.confirmed_squad_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpl_entry_id BIGINT UNIQUE NOT NULL CHECK (fpl_entry_id > 0),
  schema_version INT NOT NULL CHECK (schema_version = 1),
  source TEXT NOT NULL CHECK (source = 'fpl-authenticated-my-team'),
  payload JSONB NOT NULL,
  captured_at TIMESTAMPTZ NOT NULL,
  confirmed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CHECK (expires_at > captured_at)
);

CREATE INDEX IF NOT EXISTS confirmed_squad_imports_expiry
  ON public.confirmed_squad_imports (expires_at);

ALTER TABLE public.confirmed_squad_imports ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No anonymous access to confirmed squad imports"
  ON public.confirmed_squad_imports;
CREATE POLICY "No anonymous access to confirmed squad imports"
  ON public.confirmed_squad_imports FOR ALL USING (FALSE) WITH CHECK (FALSE);
