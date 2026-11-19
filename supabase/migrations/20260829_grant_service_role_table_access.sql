-- Fresh Supabase projects may omit default grants on public tables.
-- The server's service role needs table privileges even when it bypasses RLS.
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE
  public.users,
  public.players,
  public.gameweeks,
  public.squads,
  public.squad_players,
  public.user_preferences,
  public.recommendation_logs,
  public.fpl_sessions,
  public.seasons,
  public.fpl_snapshots,
  public.entry_snapshots,
  public.planning_scenarios,
  public.plan_selections,
  public.confirmed_squad_imports,
  public.fpl_sync_tokens
TO service_role;
