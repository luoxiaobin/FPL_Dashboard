-- Read-only checks to run before 202607170001_add_season_scope.sql.
-- Save the results with the deployment record.

SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'users', 'players', 'gameweeks', 'squads', 'squad_players',
    'user_preferences', 'recommendation_logs'
  )
ORDER BY table_name;

SELECT 'users' AS table_name, COUNT(*) AS row_count FROM public.users
UNION ALL SELECT 'players', COUNT(*) FROM public.players
UNION ALL SELECT 'gameweeks', COUNT(*) FROM public.gameweeks
UNION ALL SELECT 'squads', COUNT(*) FROM public.squads
UNION ALL SELECT 'squad_players', COUNT(*) FROM public.squad_players
UNION ALL SELECT 'user_preferences', COUNT(*) FROM public.user_preferences
UNION ALL SELECT 'recommendation_logs', COUNT(*) FROM public.recommendation_logs
ORDER BY table_name;

SELECT fpl_entry_id, COUNT(*) AS duplicate_count
FROM public.users
GROUP BY fpl_entry_id
HAVING COUNT(*) > 1;

SELECT squad_id, player_id, COUNT(*) AS duplicate_count
FROM public.squad_players
GROUP BY squad_id, player_id
HAVING COUNT(*) > 1;

SELECT squad.id AS squad_id
FROM public.squads AS squad
LEFT JOIN public.users AS entry_profile ON entry_profile.id = squad.user_id
LEFT JOIN public.gameweeks AS gameweek ON gameweek.id = squad.gameweek_id
WHERE entry_profile.id IS NULL OR gameweek.id IS NULL;

SELECT squad_player.squad_id, squad_player.player_id
FROM public.squad_players AS squad_player
LEFT JOIN public.squads AS squad ON squad.id = squad_player.squad_id
LEFT JOIN public.players AS player ON player.id = squad_player.player_id
WHERE squad.id IS NULL OR player.id IS NULL;
