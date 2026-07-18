-- Read-only checks to run immediately after the additive season migration.
-- Null/orphan/mismatch queries must return zero rows before constraints are
-- validated or legacy uniqueness is retired.

SELECT code, starts_at, ends_at, status
FROM public.seasons
ORDER BY starts_at;

SELECT 'users' AS table_name, COUNT(*) FILTER (WHERE season_id IS NULL) AS null_seasons FROM public.users
UNION ALL SELECT 'players', COUNT(*) FILTER (WHERE season_id IS NULL) FROM public.players
UNION ALL SELECT 'gameweeks', COUNT(*) FILTER (WHERE season_id IS NULL) FROM public.gameweeks
UNION ALL SELECT 'squads', COUNT(*) FILTER (WHERE season_id IS NULL) FROM public.squads
UNION ALL SELECT 'squad_players', COUNT(*) FILTER (WHERE season_id IS NULL) FROM public.squad_players
UNION ALL SELECT 'recommendation_logs', COUNT(*) FILTER (WHERE season_id IS NULL) FROM public.recommendation_logs
ORDER BY table_name;

SELECT squad.id AS squad_id, squad.season_id, gameweek.season_id AS gameweek_season_id
FROM public.squads AS squad
LEFT JOIN public.gameweeks AS gameweek
  ON gameweek.season_id = squad.season_id
 AND gameweek.id = squad.gameweek_id
WHERE gameweek.id IS NULL;

SELECT squad_player.squad_id, squad_player.player_id, squad_player.season_id
FROM public.squad_players AS squad_player
LEFT JOIN public.squads AS squad
  ON squad.season_id = squad_player.season_id
 AND squad.id = squad_player.squad_id
LEFT JOIN public.players AS player
  ON player.season_id = squad_player.season_id
 AND player.id = squad_player.player_id
WHERE squad.id IS NULL OR player.id IS NULL;

SELECT recommendation.id, recommendation.season_id, recommendation.gameweek_id,
       recommendation.out_player_id, recommendation.in_player_id
FROM public.recommendation_logs AS recommendation
LEFT JOIN public.gameweeks AS gameweek
  ON gameweek.season_id = recommendation.season_id
 AND gameweek.id = recommendation.gameweek_id
LEFT JOIN public.players AS out_player
  ON out_player.season_id = recommendation.season_id
 AND out_player.id = recommendation.out_player_id
LEFT JOIN public.players AS in_player
  ON in_player.season_id = recommendation.season_id
 AND in_player.id = recommendation.in_player_id
WHERE gameweek.id IS NULL OR out_player.id IS NULL OR in_player.id IS NULL;

SELECT constraint_name, table_name
FROM information_schema.table_constraints
WHERE constraint_schema = 'public'
  AND constraint_name LIKE '%season%'
ORDER BY table_name, constraint_name;
