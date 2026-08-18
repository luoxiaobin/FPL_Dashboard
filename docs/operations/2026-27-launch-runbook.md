# FPL 2026–27 launch runbook

## Release identity

Production is `https://fpl-dashboard-seven-pi.vercel.app`. Treat the release shown by `/api/v1/health` and the footer badge as authoritative. The semantic version and short commit SHA must match the intended release.

## Automated readiness

GitHub Actions runs lint, unit tests, and the optimized production build on every push. The production smoke workflow runs hourly and verifies:

- configuration, Supabase, and the official FPL bootstrap endpoint;
- the Planning page and authenticated-import contract;
- authentication protection on scenario and import lifecycle APIs;
- required security headers and release identity.

Manually run the same check with:

```bash
npm run test:smoke -- https://fpl-dashboard-seven-pi.vercel.app
```

## Deadline-day check

Run these checks once Friday morning and again 30 minutes before the 13:30 America/Toronto deadline:

1. Open `/api/v1/health`; require `status: ready` and all checks `pass`.
2. Confirm the displayed release is the expected version and commit.
3. Run the Safari bookmark from FPL's signed-in Pick Team page.
4. Review all 15 players, captain, vice captain, and bank, then confirm the squad.
5. Open `/planning` in a new tab and require `Confirmed squad connected`.
6. Regenerate scenarios and confirm Floor, Balanced, and Upside render without an error.

Do not deploy non-critical changes inside the final 60 minutes before the deadline.

## Recovery

- **FPL upstream degraded:** Keep the last confirmed import. Retry after five minutes; do not clear a valid saved squad.
- **Saved squad is stale or wrong:** Select **Refresh squad**, rerun the bookmark, review, and confirm. The latest confirmation replaces the previous record.
- **Import is unrecoverable:** Select **Clear saved squad**, then import again. Clearing is deliberate and cannot be undone.
- **Supabase degraded:** A same-tab confirmed payload can still be submitted directly. After the deadline, public FPL picks remain usable without the saved-import store.
- **Public picks released:** No action is required. Planning automatically makes the official public Gameweek squad authoritative.

## Rollback

If a release regression blocks Planning, redeploy the last known-good Vercel production deployment. Database migrations are additive; do not delete the confirmed-import table during rollback. Verify the rollback with `/api/v1/health` and the production smoke command, then record the active version and commit.

## Privacy boundary

The bookmark never transports the FPL password, cookies, or session token. The stored contract contains only entry ID, squad/player IDs, lineup and captaincy state, FPL price fields, bank, chip, and transfer state. Browser access to the persistence table is blocked by row-level security.
