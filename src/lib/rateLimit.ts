import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

interface RateLimitProvider {
  limit(identifier: string): Promise<{ success: boolean }>;
}

type ReportFailure = (message: string, error?: unknown) => void;

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

export function createRateLimit(provider: RateLimitProvider | null, reportFailure: ReportFailure = console.error) {
  return async (identifier: string): Promise<boolean> => {
    if (!provider) return true;

    try {
      const { success } = await provider.limit(identifier);
      return success;
    } catch (error) {
      // Fail open on transient Upstash errors: a Redis outage should not take
      // down every API route. Reporting keeps the protection loss visible.
      reportFailure('[rateLimit] Upstash request failed, failing open:', error);
      return true;
    }
  };
}

const rateLimit = createRateLimit(ratelimit);

export default rateLimit;
