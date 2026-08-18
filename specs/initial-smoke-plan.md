# Initial Playwright smoke plan

## Scope

This first slice covers the public, unauthenticated entry path. It is intentionally independent of a real FPL manager account, Supabase credentials, and mutable upstream data.

### 1. Unauthenticated entry

**Seed:** `seed.spec.ts`

#### 1.1 Show the Team ID login form

1. Open `/login`.
2. Verify the `FPL Public Dashboard` heading is visible.
3. Verify the numeric Team ID field is visible.
4. Verify `Load Dashboard` is disabled while the field is empty.

#### 1.2 Reject a non-numeric Team ID locally

1. Open `/login`.
2. Enter `not-a-team-id` in the Team ID field.
3. Submit the form.
4. Verify the numeric-integer validation message is visible.
5. Verify the browser remains on `/login`.

### 2. Public health contract

#### 2.1 Return a structured readiness response

1. Request `/api/v1/health` without authentication.
2. Verify the status is either `200` (ready) or `503` (degraded by design).
3. Verify the response contains `status`, `checks.configuration`, `checks.database`, `checks.fpl`, `release`, and `timestamp`.

## Deferred follow-up

- Successful login and dashboard rendering with a known, non-sensitive test Team ID.
- Authenticated planning workspace flows backed by deterministic fixtures or a dedicated test environment.
- Cross-browser and mobile projects after the critical Chromium path is stable.
