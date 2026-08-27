-- Allow immutable entry snapshots whenever a manager's private squad changes
-- while the global FPL snapshot remains unchanged.

ALTER TABLE public.entry_snapshots
  ADD COLUMN IF NOT EXISTS source_version TEXT;

UPDATE public.entry_snapshots
SET source_version = id::TEXT
WHERE source_version IS NULL;

ALTER TABLE public.entry_snapshots
  ALTER COLUMN source_version SET NOT NULL;

ALTER TABLE public.entry_snapshots
  DROP CONSTRAINT IF EXISTS entry_snapshots_fpl_snapshot_id_fpl_entry_id_gameweek_id_key;

ALTER TABLE public.entry_snapshots
  DROP CONSTRAINT IF EXISTS entry_snapshots_source_identity_key;

ALTER TABLE public.entry_snapshots
  ADD CONSTRAINT entry_snapshots_source_identity_key
  UNIQUE (fpl_snapshot_id, fpl_entry_id, gameweek_id, source_version);

CREATE INDEX IF NOT EXISTS plan_selections_entry_latest
  ON public.plan_selections (fpl_entry_id, selected_at DESC);
