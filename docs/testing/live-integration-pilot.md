# Live FPL integration pilot

## Purpose

This pilot contains one bounded authenticated browser check against a deployed FPL Dashboard. It verifies the real path from public FPL entry verification through Supabase-backed session creation and official FPL data retrieval to the rendered 15-player squad.

It deliberately does not assert exact rank, player names, fixtures, or points because those values change outside the application.

## Safety boundary

The live project is absent from ordinary Playwright runs. It is enabled only when all of the following are explicitly configured:

- `RUN_LIVE_FPL_E2E=true`;
- `PLAYWRIGHT_LIVE_BASE_URL` is an absolute HTTPS deployment URL;
- `LIVE_FPL_ENTRY_ID` is a numeric, non-sensitive public FPL entry designated for testing.

The test logs out in a `finally` block after successful authentication. Logout revokes the created session, but the application may retain the normal user upsert and revoked session record in its configured Supabase database. Do not point this test at an environment where that bounded write is unacceptable.

## Assertions

The test verifies only stable relationships:

1. the designated public entry can authenticate;
2. the browser reaches the dashboard;
3. a manager identity is rendered;
4. when current picks are available, exactly 15 UI player-point slots, a lifecycle score label, and the substitutes section are rendered;
5. when public picks are not yet available and the squad endpoint returns 404, the dashboard explicitly reports the upcoming Gameweek (or a true no-active-Gameweek state) instead of presenting stale squad data.

## Local execution

Provide values without committing them:

```bash
RUN_LIVE_FPL_E2E=true \
PLAYWRIGHT_LIVE_BASE_URL=https://your-test-deployment.example \
LIVE_FPL_ENTRY_ID=123456 \
npm run test:e2e
```

The HTTPS and numeric-entry guards fail before browser startup if the configuration is incomplete or malformed.

## Failure interpretation

- Login rejection: `API_FAILURE`, `TEST_DATA`, or `ENVIRONMENT` depending on the response and entry validity.
- Missing 15-player squad after successful login: accept only a 404 paired with an explicit upcoming-Gameweek or true no-active-Gameweek state. Any other response or UI state remains `API_FAILURE`, `DATA_CHANGE`, or `APPLICATION_REGRESSION` and requires evidence review.
- Changed exact football values are not failures because the test does not hard-code them.
- Locator changes are eligible for healing only when the rendered business outcome remains correct.
