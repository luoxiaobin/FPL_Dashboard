-- Revocable pairing tokens for browser-side FPL squad auto-sync.
-- Only SHA-256 token hashes are stored. Service-role API routes are the sole access path.

CREATE TABLE IF NOT EXISTS public.fpl_sync_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  fpl_entry_id BIGINT NOT NULL CHECK (fpl_entry_id > 0),
  token_hash TEXT UNIQUE NOT NULL CHECK (length(token_hash) = 64),
  label TEXT NOT NULL DEFAULT 'FPL browser auto-sync',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_used_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  CHECK (expires_at > created_at)
);

CREATE INDEX IF NOT EXISTS fpl_sync_tokens_entry_active
  ON public.fpl_sync_tokens (fpl_entry_id, expires_at)
  WHERE revoked_at IS NULL;

ALTER TABLE public.fpl_sync_tokens ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "No anonymous access to FPL sync tokens"
  ON public.fpl_sync_tokens;
CREATE POLICY "No anonymous access to FPL sync tokens"
  ON public.fpl_sync_tokens FOR ALL USING (FALSE) WITH CHECK (FALSE);

