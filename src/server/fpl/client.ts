import 'server-only';
import { fplFetch } from '@/lib/upstreamFetch';

const DEFAULT_TIMEOUT_MS = 8_000;

export class FplUpstreamError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly path: string,
  ) {
    super(message);
    this.name = 'FplUpstreamError';
  }
}

interface FplRequestOptions {
  cacheSeconds?: number;
  retries?: number;
  timeoutMs?: number;
}

function assertApiPath(path: string): string {
  if (!path.startsWith('/api/') || path.startsWith('//')) {
    throw new Error(`Invalid FPL API path: ${path}`);
  }
  return path;
}

const wait = (milliseconds: number) =>
  new Promise(resolve => setTimeout(resolve, milliseconds));

export async function fetchFplJson<T>(
  path: string,
  options: FplRequestOptions = {},
): Promise<T> {
  const safePath = assertApiPath(path);
  const retries = Math.max(0, Math.min(options.retries ?? 1, 2));
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fplFetch(safePath, {
        headers: {
          Accept: 'application/json',
          'User-Agent': 'FPL-Dashboard/0.5 (+https://fpl-dashboard-seven-pi.vercel.app)',
        },
        signal: controller.signal,
        ...(options.cacheSeconds
          ? { next: { revalidate: options.cacheSeconds } }
          : { cache: 'no-store' as const }),
      });

      if (!response.ok) {
        if (response.status >= 500 && attempt < retries) {
          await wait(150 * (attempt + 1));
          continue;
        }
        throw new FplUpstreamError(
          `FPL request failed with status ${response.status}`,
          response.status,
          safePath,
        );
      }

      return await response.json() as T;
    } catch (error) {
      if (error instanceof FplUpstreamError) throw error;
      if (attempt >= retries) {
        const reason = error instanceof Error ? error.message : 'Unknown upstream failure';
        throw new FplUpstreamError(`FPL request failed: ${reason}`, 503, safePath);
      }
      await wait(150 * (attempt + 1));
    } finally {
      clearTimeout(timeout);
    }
  }

  throw new FplUpstreamError('FPL request failed', 503, safePath);
}
