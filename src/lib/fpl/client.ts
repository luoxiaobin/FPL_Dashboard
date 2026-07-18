import type { FplBootstrap, FplPicksResponse } from './types';

const FPL_API_BASE = 'https://fantasy.premierleague.com/api';
const DEFAULT_TIMEOUT_MS = 10_000;

type CacheEntry = {
  expiresAt: number;
  value: Promise<unknown>;
};

const responseCache = new Map<string, CacheEntry>();

export type FplErrorCode =
  | 'not_found'
  | 'picks_unavailable'
  | 'rate_limited'
  | 'upstream_error'
  | 'timeout'
  | 'invalid_response';

export class FplApiError extends Error {
  constructor(
    message: string,
    public readonly code: FplErrorCode,
    public readonly status: number,
    public readonly path: string,
  ) {
    super(message);
    this.name = 'FplApiError';
  }
}

interface FplFetchOptions {
  cacheTtlMs?: number;
  retries?: number;
  timeoutMs?: number;
}

const errorForStatus = (status: number, path: string) => {
  if (status === 404 && path.includes('/picks/')) {
    return new FplApiError('Squad picks are not public for this gameweek yet.', 'picks_unavailable', 404, path);
  }
  if (status === 404) return new FplApiError('FPL resource not found.', 'not_found', 404, path);
  if (status === 429) return new FplApiError('FPL rate limit reached.', 'rate_limited', 429, path);
  return new FplApiError(`FPL request failed with status ${status}.`, 'upstream_error', 502, path);
};

async function requestJson<T>(path: string, options: FplFetchOptions): Promise<T> {
  const retries = options.retries ?? 1;
  let lastError: unknown;

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), options.timeoutMs ?? DEFAULT_TIMEOUT_MS);
    const startedAt = Date.now();

    try {
      const response = await fetch(`${FPL_API_BASE}${path}`, {
        headers: { 'User-Agent': 'FPL-Dashboard/0.5' },
        signal: controller.signal,
        cache: 'no-store',
      });

      if (!response.ok) throw errorForStatus(response.status, path);

      const contentType = response.headers.get('content-type') || '';
      if (!contentType.includes('application/json')) {
        throw new FplApiError('FPL returned a non-JSON response.', 'invalid_response', 502, path);
      }

      const payload = await response.json() as T;
      console.info('FPL request', { path, status: response.status, durationMs: Date.now() - startedAt });
      return payload;
    } catch (error) {
      lastError = error;
      const retryable = !(error instanceof FplApiError) || error.status >= 500 || error.status === 429;
      if (!retryable || attempt === retries) break;
    } finally {
      clearTimeout(timeout);
    }
  }

  if (lastError instanceof FplApiError) throw lastError;
  if (lastError instanceof Error && lastError.name === 'AbortError') {
    throw new FplApiError('FPL request timed out.', 'timeout', 504, path);
  }
  throw new FplApiError('FPL request failed.', 'upstream_error', 502, path);
}

export async function fplFetch<T>(path: string, options: FplFetchOptions = {}): Promise<T> {
  const ttl = options.cacheTtlMs ?? 0;
  const cached = responseCache.get(path);
  if (ttl > 0 && cached && cached.expiresAt > Date.now()) return cached.value as Promise<T>;

  const value = requestJson<T>(path, options);
  if (ttl > 0) {
    responseCache.set(path, { expiresAt: Date.now() + ttl, value });
    value.catch(() => responseCache.delete(path));
  }
  return value;
}

export async function getBootstrap(): Promise<FplBootstrap> {
  const bootstrap = await fplFetch<FplBootstrap>('/bootstrap-static/', { cacheTtlMs: 15 * 60_000 });
  if (!Array.isArray(bootstrap.events) || !Array.isArray(bootstrap.elements) || !Array.isArray(bootstrap.teams)) {
    throw new FplApiError('FPL bootstrap payload is missing required collections.', 'invalid_response', 502, '/bootstrap-static/');
  }
  return bootstrap;
}

export const getFixtures = (gameweek?: number) => fplFetch<Array<Record<string, unknown>>>(
  gameweek ? `/fixtures/?event=${gameweek}` : '/fixtures/',
  { cacheTtlMs: 15 * 60_000 },
);
export const getEntry = <T = Record<string, unknown>>(entryId: string | number) => fplFetch<T>(`/entry/${entryId}/`, { cacheTtlMs: 60_000 });
export const getEntryHistory = <T = Record<string, unknown>>(entryId: string | number) => fplFetch<T>(`/entry/${entryId}/history/`, { cacheTtlMs: 60_000 });
export const getEntryTransfers = <T = Array<Record<string, unknown>>>(entryId: string | number) => fplFetch<T>(`/entry/${entryId}/transfers/`, { cacheTtlMs: 60_000 });
export const getElementSummary = <T = Record<string, unknown>>(playerId: string | number) => fplFetch<T>(`/element-summary/${playerId}/`, { cacheTtlMs: 15 * 60_000 });
export const getPicks = (entryId: string | number, gameweek: number) => fplFetch<FplPicksResponse>(`/entry/${entryId}/event/${gameweek}/picks/`, { cacheTtlMs: 30_000 });
export const getLiveEvent = <T = Record<string, unknown>>(gameweek: number) => fplFetch<T>(`/event/${gameweek}/live/`, { cacheTtlMs: 30_000 });

export const getClassicLeagueStandings = <T = Record<string, unknown>>(leagueId: string | number) => fplFetch<T>(`/leagues-classic/${leagueId}/standings/`, { cacheTtlMs: 30_000 });
export function clearFplCache() {
  responseCache.clear();
}
