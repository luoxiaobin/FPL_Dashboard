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
- The working copy used for these fixes lives at `/tmp/FPL_Dashboard_security_review` on the Mac mini — **not a stable location**, may not survive a reboot. Worth cloning fresh (`git clone https://github.com/luoxiaobin/FPL_Dashboard.git`) into a permanent location for any future session.
- To resume: pick H3 first (only open High-severity item) — needs the Vercel KV/Upstash decision above before code changes. M1/M3/M4/L1 can be tackled independently in any order.
- Works equally well handed to hosted Claude Code, local Claude Code, or continued via Cowork — this doc plus the repo's current `git log` is sufficient context; no need to re-run the original review.
