# Security Review — Status / Parking Lot

Repo: `github.com/luoxiaobin/FPL_Dashboard` — branch `master`
Original review conducted: 2026-08-08, local Claude Code session (`qwen36-27b-64k` via Ollama), session id `3d9f9b94-b73c-4c93-9d92-6d23e688468c`
Fixes applied/reconciled: 2026-08-10, via Claude Cowork
Commits: `d9d1e05` (Critical fixes), `03a38a1` (High/Medium/Low fixes) — both pushed to `origin/master`

Purpose of this doc: full findings list with exact status, so this can be resumed from any tool (Cowork, local Claude Code, or hosted Claude Code) without needing to re-derive context.

**Deployment note (H1/H2 full fixes, 2026-08-12):** before deploying these changes, run `supabase/migrations/001_create_sessions_table.sql` against the Supabase project (or re-run `supabase/schema.sql` §10, which now includes the same table). Deploying without running the migration will make every authenticated route fail closed (session lookups will error). This is also a breaking cookie-format change — every currently logged-in user will be signed out and need to log back in once the new build is live.

---

## Status Summary

| # | Severity | Finding | Status |
|---|---|---|---|
| C1 | Critical | `/api/v1/leagues/compare` has no authentication | ✅ Fixed |
| C2 | Critical | Service-role fallback creates silent auth bypass | ✅ Fixed |
| C3 | Critical | Missing RLS policies on `recommendation_logs` / `user_preferences` | ✅ Fixed |
| H1 | High | Cookie lacks `SameSite` / session-token binding | ✅ Fixed |
| H2 | High | SSRF via unvalidated upstream fetches | ✅ Fixed |
| H3 | High | Rate limiting is in-memory only, trivially bypassed | ✅ Fixed |
| H4 | High | Error responses leak internal messages | ✅ Fixed |
| M1 | Medium | Bootstrap cache is mutable module-level state (race condition) | ❌ Open |
| M2 | Medium | No sanitization on `teamName` before DB upsert | ✅ Fixed |
| M3 | Medium | Service-role key used in sync SSE stream, weak auth gate | ❌ Open |
| M4 | Medium | No CI/pre-commit enforcement of `.env*` exclusion | ❌ Open |
| L1 | Low | User-Agent header spoofing | ❌ Open (operational risk, not code vuln) |
| L2 | Low | No security headers configured | ✅ Fixed |

**10 fully fixed, 3 open** (all remaining open items are Medium/Low — no High severity items remain open).

---

## Fixed (details)

**C1** — `src/app/api/v1/leagues/compare/route.ts`: added `fpl_entry_id` cookie check (401 if missing) + numeric validation on `myId`/`rivalId`.

**C2** — `src/lib/supabase.ts`: added a production fail-closed guard that logs an error if `SUPABASE_SERVICE_ROLE_KEY` is missing, instead of silently falling back to the anon key.

**C3** — `supabase/schema.sql`: added explicit deny-all RLS policies for `recommendation_logs` and `user_preferences` (defense-in-depth; app writes go through the service-role client anyway).

**H1** — Full fix applied (2026-08-12). New `src/lib/session.ts`: login now generates a random 32-byte token via `crypto.randomBytes`, stores only its SHA-256 hash in a new `fpl_sessions` table (`token_hash`, `fpl_entry_id`, `expires_at`, `revoked_at`), and sets the raw token in an `fpl_session` httpOnly/sameSite=strict cookie. Logout revokes the session server-side (`revoked_at`), not just clearing the cookie. All 13 previously cookie-reading routes (`user/*`, `squad/*`, `leagues/*`, `fixtures`, `rank-projection`, `sync`) were migrated from `req.cookies.get('fpl_entry_id')` to `getEntryIdFromSession(req)`, which looks up the hashed token and returns the DB-backed entry ID (or `null` if missing/expired/revoked). Migration SQL: `supabase/migrations/001_create_sessions_table.sql` (also folded into `supabase/schema.sql` §10) — **must be run against Supabase before deploying**, and this is a breaking cookie-format change: all existing logged-in users will be signed out and need to log back in once deployed.

**H2** — Full fix applied (2026-08-12). New `src/lib/upstreamFetch.ts`: `fplFetch(path, init)` always appends `path` to a hardcoded `https://fantasy.premierleague.com` origin (never accepts a full URL) and re-verifies the constructed URL's origin before fetching — defense-in-depth against any future refactor that might assemble a URL from a variable. `toSafeId(value, label)` validates a path segment is a plain non-negative integer, throwing otherwise. All ~40 `fetch()` call sites across 14 route files (`auth/login`, `cron/evaluate`, `fixtures`, `leagues/*`, `rank-projection`, `squad/*`, `sync`, `user/*`) now go through `fplFetch`, and every interpolated ID (entryId, leagueId, myId/rivalId, gameweek, playerId) is wrapped in `toSafeId` at the point of use. `src/lib/playerImage.ts` (static shirt-image URLs, not request proxying) was intentionally left untouched.

**H4** — Only 3 of the 13 originally-flagged routes actually leaked `error.message` to the client when checked directly: `cron/evaluate`, `fixtures`, `sync`. All 3 fixed — server-side `console.error` logging kept, client response genericized to `'Internal Server Error'`. The other 10 flagged routes already returned generic messages on inspection; left untouched.

**M2** — `src/app/api/v1/auth/login/route.ts`: added an HTML-encoding `sanitize()` function, applied to `teamName` before the Supabase upsert.

**L2** — `next.config.ts`: added `headers()` export with `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`, `X-XSS-Protection`.

**H3** — Full fix applied (2026-08-29), commit `7fe8566`. `src/lib/rateLimit.ts` rewritten around `@upstash/ratelimit`'s `Ratelimit.slidingWindow(30, '60 s')`, backed by Upstash Redis accessed over HTTP/REST (Edge-runtime compatible — unlike `ioredis`, which needs a raw TCP connection Vercel Edge doesn't support). Fails open (logs loudly, allows the request) if `KV_REST_API_URL`/`KV_REST_API_TOKEN` are missing or an Upstash call errors at runtime, so a Redis outage degrades to "no rate limiting" rather than a full outage. `src/proxy.ts`'s `proxy()` handler is now `async` to await the check. Infra: Upstash Redis provisioned via the Vercel Marketplace integration (`upstash-kv-teal-canvas`, Free plan), explicitly scoped to Production **and** Development (Preview was already covered by default; Development had to be added manually after the initial marketplace connection defaulted to Production+Preview only — worth checking this scope explicitly if the integration is ever recreated). **Note:** the Upstash REST credentials were briefly pasted in plaintext during setup troubleshooting and were rotated immediately after via Upstash's dashboard; current credentials were never exposed. Verified: `tsc --noEmit` clean (excl. 1 pre-existing unrelated test-file error), `eslint` 0 errors, `vitest` 165/165 passing. **Not independently verified:** a real `npm run build` / deployed smoke test — the sandbox used for this fix can't reach the network for Next.js's Google Fonts fetch, so build success is inferred from the type-check/lint/test results, not a completed build. Run `npm run build` for real before/during your next deploy to confirm.

---

## Open — needs decision or follow-up work

**M1 (Medium) — bootstrap cache race condition.**
`src/app/api/v1/squad/live/route.ts:7-8`. Module-level mutable cache (`bootstrapCache`, `lastFetchTime`) can race across concurrent invocations on the same serverless instance. Review itself notes impact is low (stale data for a few seconds, not a breach).

**M3 (Medium) — sync SSE endpoint uses service-role client behind a weak auth gate.**
`src/app/api/v1/sync/route.ts`. Long-running SSE stream uses `supabaseAdmin` (bypasses RLS). The auth gate is now the H1 session-token check (`getEntryIdFromSession`) rather than a raw cookie read, which is a meaningfully stronger gate than before — but the endpoint still authorizes by "any valid session" with no additional scoping, so this is left open rather than marked fixed.

**M4 (Medium) — no CI enforcement that `.env*` stays out of git.**
Process/tooling gap: add a pre-commit hook or CI step (e.g., `git-secrets` or a simple grep check) rather than relying solely on `.gitignore`.

**L1 (Low) — User-Agent spoofing on FPL API calls.**
Framed by the review as an operational/ToS risk, not a code vulnerability. Lowest priority; a product decision more than a security fix.

---

## Resuming this work

**Model note:** use **Qwen3.6-35B-A3B (quantized, MoE — 35B total / ~3B active params per token)** as the local model for the remaining fixes, not the 27B dense model used for the original review/first fix pass. Set up as `qwen3.6-35b-a3b-32k` (custom Modelfile, `num_ctx 32768` — the base Ollama-library pull defaults to Ollama's small built-in context, which is not enough for agentic tool-schema overhead). Confirmed measured performance on this Mac mini M2 Pro / 32GB vs. the old 27B model's `--think=false` baseline:
- Prefill: 85.58 tok/s (vs 37.21 tok/s) — ~2.3x faster
- Generation: 37.46 tok/s (vs 10.40 tok/s) — ~3.6x faster

**Update:** Hermes Agent hard-requires a minimum 64K context window — the 32K variant above was rejected at launch. Switched to a more aggressive quantization to keep 64K safely within memory: **`qwen3.6-35b-iq3-64k`**, built from `batiai/qwen3.6-35b:iq3` (IQ3_XXS, imatrix-calibrated) with `num_ctx 65536`. Reported weights size: 14GB (vs ~18GB at IQ4_XS).

Confirmed via a genuine large-prompt stress test (~32.8K tokens, matching the original model's earlier test for direct comparison — note: run this test only once per session, since a second identical call hits KV-cache reuse and gives a misleadingly fast, non-representative number):
- Original 27B dense model: 7m21s (441s) total, fresh prefill
- Qwen3.6-35B-A3B IQ3 (64K): **1m52s (112s) total, fresh prefill** — ~3.9x faster end-to-end
- Live prefill rate observed: 480-670 tok/s (vs ~46-92 tok/s on the original model)
- Small-prompt generation rate: ~38-44 tok/s (vs ~10 tok/s on the original model, `--think=false`)
- No memory errors in the server log at any point during setup or the large-context test — genuinely stable at 64K on this 32GB machine with this quantization.

Memory: ~14GB weights (IQ3_XXS) + KV cache at 64K context — confirmed stable in practice, meaningfully safer margin than IQ4_XS would have given at the same context size. Do not go up to Q6_K quant (needs 36GB+) — no longer relevant now that 64K is required anyway.

Harness: wired up via `ollama launch hermes --model qwen3.6-35b-iq3-64k` (Hermes Agent, a different local coding harness than Claude Code — confirm tool-calling actually works with a real test prompt before trusting it, not just a chat reply). Quality caveat: IQ3 is a more aggressive quantization than IQ4_XS — test on a low-stakes item (M1 or M4) before trusting it with H3, given H3 already needed extra scrutiny even at higher quantization.

Exception: for H3 specifically (Redis/KV rate limiter, must be Edge-runtime compatible), either double-check its output carefully or consider a stronger model — it's the one remaining item with real correctness nuance (e.g., must use a fetch/REST-based Redis client like Upstash's, not `ioredis`, which doesn't work on Vercel Edge).

- The full original review write-up (complete text, all findings) is preserved in the local Claude Code session transcript: `~/.claude/projects/-Users-kevinluo/3d9f9b94-b73c-4c93-9d92-6d23e688468c.jsonl` on the Mac mini — search for `"# 🔒 Security Review"` if the raw text is ever needed again. This file is local-machine-only, not synced to the repo.
- **Working copy location (updated 2026-08-28):** the old `/tmp/FPL_Dashboard_security_review` copy is gone, confirming the risk flagged above — it did not survive. The permanent working copy now lives at `/Users/kevinluo/Documents/FPL_Dashboard` (confirmed clean, up to date with `origin/master`, H1/H2 commit `ac4efaf` present in history). Use this path going forward; the `/tmp` path above is stale and should be ignored.
- To resume: H1, H2, and H3 are all fixed now (2026-08-29, via Claude Cowork). No High-severity items remain open. M1/M4/L1 can be tackled independently in any order; M3 is worth a second look now that its auth gate has changed (see note above) but isn't closed. Before deploying H3, run a real `npm run build` — it was only verified via tsc/lint/test in the fixing session, not a completed build.
- Works equally well handed to hosted Claude Code, local Claude Code, or continued via Cowork — this doc plus the repo's current `git log` is sufficient context; no need to re-run the original review.

### Model/harness update (2026-08-28) — local model abandoned mid-evaluation, pivoting to cloud

The `qwen3.6-35b-iq3-64k` setup above got slow again at high context fill (~91% full, generation degraded to ~11 tok/s) during actual use. Two follow-up attempts since, neither yet validated on a real fix:

**Attempt 1 — Muse Glimmer 30B (Meta, released 2026-08-10).** Dense 30B model (not MoE — full params active per token, unlike Qwen3.6-35B-A3B's ~3B active), pulled via `ollama run muse-glimmer:30b-mlx` for Ollama's new MLX backend + DFlash speculative decoding. Explicitly lists Hermes Agent as a supported scaffold. Hit a real bottleneck on the first test message: Hermes's own tool-schema/MCP-catalog system prompt is ~22K tokens, and this dense model's prefill rate measured at only ~55 tok/s (vs. 480-670 tok/s prefill on the old Qwen3.6 MoE setup) — meaning a ~6-7 minute cold-start tax before every fresh session's first response, before generation even begins. Built a `muse-glimmer-64k` custom Modelfile (`num_ctx 65536`, matching Hermes's minimum) to fix a separate context-ceiling problem (default pull only allocates 32768 context, most of which the 22K-token prefix alone would consume) — **but this was never actually run on a real task.** `hermes insights --days 7` (see below) confirms `muse-glimmer` doesn't appear anywhere in real usage. Status: built, not validated — don't assume it works.

**Attempt 2 — pivot to cloud providers via existing subscriptions.** Rather than keep fighting local prefill speed, switched direction entirely: Hermes supports routing through subscriptions already paid for (ChatGPT via `openai-codex` provider, GitHub Copilot via `copilot` provider, Claude via `anthropic` provider — Max-tier only, Pro doesn't work) instead of local inference or a separate metered API key. Set up so far:
- Hermes updated to v0.20.6 (was already current at the time — this wasn't the issue).
- GitHub Copilot configured via `hermes model` → OAuth device-code login, targeting `gpt-5-mini` as the fast/cheap default (with `gpt-5.4` as a fallback for harder tasks via `/model copilot:gpt-5.4`).
- ChatGPT/Codex (`openai-codex` provider, `gpt-5-codex`) was recommended as the primary pick but **not confirmed set up** — only Copilot was actually walked through.
- Real usage check (`hermes insights --days 7`, run 2026-08-28): still >95% local Ollama traffic (`qwen3.6-35b-a3b-64k` dominant at 39 sessions / 3.2M tokens). Copilot's `gpt-5-mini` shows exactly 1 session / 34K tokens — a smoke test, not real work. **No fix in this doc has actually been attempted on Copilot or any cloud model yet.**

**Built along the way:** a Hermes skill (`~/.hermes/skills/finops/provider-spend-report/`) wrapping `hermes insights --days N` to check token usage/model mix on demand. Confirmed working against the real CLI (an earlier version assumed a `hermes usage --by-provider --json` command that doesn't exist — corrected). Known limits, documented in the skill itself: groups by model name only (can't separate "Copilot's gpt-5-mini" from another account's), and cost shows "Unknown / no pricing data" for every cloud model used so far — Hermes has no rate table for them, so **this skill cannot answer "how much have I spent," only "how many tokens on which models."** GitHub's own Billing Overview page remains the only authoritative dollar figure for Copilot.

**Update (2026-08-29): H3 is done.** Fixed directly via Claude Cowork (not any of the local/cloud models discussed above — this pivot conversation predated actually running H3 through one). So the "no model/harness combination has been proven yet" caution below no longer blocks anything security-related; it's still relevant if you pick up M1/M3/M4/L1 with a local or Copilot-routed model, but there's no more open High-severity work waiting on it.

**Original bottom line (kept for context):** no model/harness combination had been proven on a real fix since the Qwen3.6 IQ3 setup degraded. Before trusting any model with correctness-sensitive work, first confirm tool-calling actually works end-to-end on that model/provider with a low-stakes test, the same caution flagged for the local models above — that caution applies equally to `gpt-5-mini` via Copilot, since it's had exactly one smoke-test message so far.
