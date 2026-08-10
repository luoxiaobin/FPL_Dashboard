# Security Review — Status / Parking Lot

Repo: `github.com/luoxiaobin/FPL_Dashboard` — branch `master`
Original review conducted: 2026-08-08, local Claude Code session (`qwen36-27b-64k` via Ollama), session id `3d9f9b94-b73c-4c93-9d92-6d23e688468c`
Fixes applied/reconciled: 2026-08-10, via Claude Cowork
Commits: `d9d1e05` (Critical fixes), `03a38a1` (High/Medium/Low fixes) — both pushed to `origin/master`

Purpose of this doc: full findings list with exact status, so this can be resumed from any tool (Cowork, local Claude Code, or hosted Claude Code) without needing to re-derive context.

---

## Status Summary

| # | Severity | Finding | Status |
|---|---|---|---|
| C1 | Critical | `/api/v1/leagues/compare` has no authentication | ✅ Fixed |
| C2 | Critical | Service-role fallback creates silent auth bypass | ✅ Fixed |
| C3 | Critical | Missing RLS policies on `recommendation_logs` / `user_preferences` | ✅ Fixed |
| H1 | High | Cookie lacks `SameSite` / session-token binding | ⚠️ Partial |
| H2 | High | SSRF via unvalidated upstream fetches | ⚠️ Partial |
| H3 | High | Rate limiting is in-memory only, trivially bypassed | ❌ Open |
| H4 | High | Error responses leak internal messages | ✅ Fixed |
| M1 | Medium | Bootstrap cache is mutable module-level state (race condition) | ❌ Open |
| M2 | Medium | No sanitization on `teamName` before DB upsert | ✅ Fixed |
| M3 | Medium | Service-role key used in sync SSE stream, weak auth gate | ❌ Open |
| M4 | Medium | No CI/pre-commit enforcement of `.env*` exclusion | ❌ Open |
| L1 | Low | User-Agent header spoofing | ❌ Open (operational risk, not code vuln) |
| L2 | Low | No security headers configured | ✅ Fixed |

**7 fully fixed, 2 partial, 5 open** (1 of the open items — H3 — is High severity; the rest are Medium/Low).

---

## Fixed (details)

**C1** — `src/app/api/v1/leagues/compare/route.ts`: added `fpl_entry_id` cookie check (401 if missing) + numeric validation on `myId`/`rivalId`.

**C2** — `src/lib/supabase.ts`: added a production fail-closed guard that logs an error if `SUPABASE_SERVICE_ROLE_KEY` is missing, instead of silently falling back to the anon key.

**C3** — `supabase/schema.sql`: added explicit deny-all RLS policies for `recommendation_logs` and `user_preferences` (defense-in-depth; app writes go through the service-role client anyway).

**H1** — `src/app/api/v1/auth/login/route.ts` + `logout/route.ts`: added `sameSite: 'strict'` to both cookie calls. **Not done:** the review's fuller recommendation to issue a random session token mapped to the entry ID (instead of storing the raw FPL entry ID directly in the cookie) — bigger architectural change, not attempted.

**H4** — Only 3 of the 13 originally-flagged routes actually leaked `error.message` to the client when checked directly: `cron/evaluate`, `fixtures`, `sync`. All 3 fixed — server-side `console.error` logging kept, client response genericized to `'Internal Server Error'`. The other 10 flagged routes already returned generic messages on inspection; left untouched.

**M2** — `src/app/api/v1/auth/login/route.ts`: added an HTML-encoding `sanitize()` function, applied to `teamName` before the Supabase upsert.

**L2** — `next.config.ts`: added `headers()` export with `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-XSS-Protection`.

---

## Partial (what's left)

**H2** — Done: numeric validation on `leagueId` in `leagues/live/route.ts`. **Not done:** the review's broader fix — "maintain an allowlist of upstream hostnames with a runtime assertion on resolved URLs" — covering all 15+ `fetch()` calls to `fantasy.premierleague.com`, plus the `entryId`-in-URL usage in `sync/route.ts` (lines ~69, ~92).

---

## Open — needs decision or follow-up work

**H3 (High) — rate limiter is in-memory, resets on serverless cold starts, trivially bypassed.**
`src/lib/rateLimit.ts:9`. Real fix requires a persistent store — Vercel KV or Upstash Redis — not just a code edit. **Blocked on:** does this project already have Vercel KV or Upstash provisioned? If not, that's a setup decision before the code fix can happen.

**M1 (Medium) — bootstrap cache race condition.**
`src/app/api/v1/squad/live/route.ts:7-8`. Module-level mutable cache (`bootstrapCache`, `lastFetchTime`) can race across concurrent invocations on the same serverless instance. Review itself notes impact is low (stale data for a few seconds, not a breach).

**M3 (Medium) — sync SSE endpoint uses service-role client behind a weak auth gate.**
`src/app/api/v1/sync/route.ts`. Long-running SSE stream uses `supabaseAdmin` (bypasses RLS), gated only by the basic `fpl_entry_id` cookie check (same mechanism as H1). Worth revisiting once H1's fuller session-token fix (if ever done) strengthens that gate.

**M4 (Medium) — no CI enforcement that `.env*` stays out of git.**
Process/tooling gap: add a pre-commit hook or CI step (e.g., `git-secrets` or a simple grep check) rather than relying solely on `.gitignore`.

**L1 (Low) — User-Agent spoofing on FPL API calls.**
Framed by the review as an operational/ToS risk, not a code vulnerability. Lowest priority; a product decision more than a security fix.

---

## Resuming this work

- The full original review write-up (complete text, all findings) is preserved in the local Claude Code session transcript: `~/.claude/projects/-Users-kevinluo/3d9f9b94-b73c-4c93-9d92-6d23e688468c.jsonl` on the Mac mini — search for `"# 🔒 Security Review"` if the raw text is ever needed again. This file is local-machine-only, not synced to the repo.
- The working copy used for these fixes lives at `/tmp/FPL_Dashboard_security_review` on the Mac mini — **not a stable location**, may not survive a reboot. Worth cloning fresh (`git clone https://github.com/luoxiaobin/FPL_Dashboard.git`) into a permanent location for any future session.
- To resume: pick H3 first (only open High-severity item) — needs the Vercel KV/Upstash decision above before code changes. M1/M3/M4/L1 can be tackled independently in any order.
- Works equally well handed to hosted Claude Code, local Claude Code, or continued via Cowork — this doc plus the repo's current `git log` is sufficient context; no need to re-run the original review.
