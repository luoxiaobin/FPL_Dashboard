import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

// H3 fix: the previous implementation was a plain in-memory Map. On Vercel's
// serverless/Edge platform that state doesn't survive cold starts and isn't
// shared across concurrent instances, so the "30 req/min" limit was only
// ever enforced per-instance, per-lifetime — trivially bypassed just by the
// normal churn of serverless invocations, no attacker effort required.
//
// Upstash Redis is accessed over HTTP/REST, so — unlike `ioredis`, which
// needs a raw TCP connection Vercel Edge doesn't support — it works there,
// and every instance reads/writes the same shared counter.

const hasRedisConfig = Boolean(process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN);

if (!hasRedisConfig) {
  console.error(
    '[rateLimit] KV_REST_API_URL / KV_REST_API_TOKEN are not set. ' +
    'Rate limiting is disabled (failing open) until these are configured.'
  );
}

const ratelimit = hasRedisConfig
  ? new Ratelimit({
      redis: new Redis({
        url: process.env.KV_REST_API_URL!,
        token: process.env.KV_REST_API_TOKEN!,
      }),
      limiter: Ratelimit.slidingWindow(30, '60 s'), // 30 requests per rolling 60s window
      analytics: true,
      prefix: 'fpl-dashboard-ratelimit',
    })
  : null;

export default async function rateLimit(ip: string): Promise<boolean> {
  if (!ratelimit) {
    // No Redis configured — fail open rather than block every request.
    // The startup error above makes this loud in logs/monitoring.
    return true;
  }

  try {
    const { success } = await ratelimit.limit(ip);
    return success;
  } catch (error) {
    // Fail open on transient Upstash errors too: a Redis outage shouldn't
    // 503 the whole app. Logged so the outage itself stays visible.
    console.error('[rateLimit] Upstash request failed, failing open:', error);
    return true;
  }
}
