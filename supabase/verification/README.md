# 2026/27 season-scope migration runbook

Run this sequence against a staging database before production. Keep the preflight and postflight output with the deployment record.

1. Take a restorable database backup and record the backup identifier.
2. Run `20260717_season_preflight.sql` with read-only credentials. Stop if it reports duplicate season keys, orphaned squad rows, or an unexpected active season.
3. Apply `supabase/migrations/202607170001_add_season_scope.sql` using the project migration runner.
4. Run `20260717_season_postflight.sql`. Stop if any check is non-zero, if `2026-27` is not `preparing`, or if the composite foreign keys are invalid.
5. Deploy the application and run an authenticated smoke test for login, summary, history, fixtures, live squad, suggestions, optimizer, transfers, and sync.
6. Confirm that preseason endpoints return lifecycle metadata/409 responses and do not request unavailable picks. Confirm that the cron evaluator only grades logs for the active season.
7. When the official 2026/27 FPL deadline and bootstrap are available, change the season row to `active` in a controlled migration, then repeat postflight and smoke tests.

Rollback: restore the backup if the migration fails. The migration is additive and intentionally leaves legacy keys in place, so application rollback can be performed before the composite constraints are retired in a later release.