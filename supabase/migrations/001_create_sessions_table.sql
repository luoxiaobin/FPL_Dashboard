-- Migration: Create sessions table for H1 fix
-- Replaces raw entry ID in cookies with a random session token mapped to the entry.
--
-- Only a SHA-256 hash of the session token is stored (token_hash), never the raw
-- token itself. The raw token lives only in the client's httpOnly cookie; the server
-- hashes an incoming cookie value and looks up the hash. This means a leaked copy of
-- this table (backup, misconfigured RLS, etc.) cannot be replayed as valid sessions.
CREATE TABLE IF NOT EXISTS public.fpl_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  token_hash TEXT UNIQUE NOT NULL,
  fpl_entry_id BIGINT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
  revoked_at TIMESTAMP WITH TIME ZONE
);

-- Index for fast token lookups during session validation
CREATE INDEX IF NOT EXISTS idx_fpl_sessions_token_hash ON public.fpl_sessions (token_hash);

-- RLS: Deny anonymous access to the sessions table.
-- All reads/writes happen via the service-role client (login/logout/session checks).
ALTER TABLE public.fpl_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Deny anonymous access to sessions" ON public.fpl_sessions;
CREATE POLICY "Deny anonymous access to sessions"
  ON public.fpl_sessions FOR ALL USING (false);
