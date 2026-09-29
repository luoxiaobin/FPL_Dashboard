import { beforeEach, describe, expect, it, vi } from 'vitest';

const { fplFetchMock } = vi.hoisted(() => ({
  fplFetchMock: vi.fn(),
}));

vi.mock('@/lib/upstreamFetch', () => ({ fplFetch: fplFetchMock }));

import { fetchFplJson, FplUpstreamError } from './client';

const okResponse = (data: unknown) =>
  new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'content-type': 'application/json' },
  });

const errorResponse = (status: number) => new Response('upstream error', { status });

beforeEach(() => {
  fplFetchMock.mockReset();
});

describe('fetchFplJson retries', () => {
  it('returns data on the first successful attempt', async () => {
    fplFetchMock.mockResolvedValueOnce(okResponse({ ok: true }));

    await expect(
      fetchFplJson('/api/bootstrap-static/', { retries: 2, retryDelayMs: 1 }),
    ).resolves.toEqual({ ok: true });
    expect(fplFetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries a transient 503 and succeeds', async () => {
    fplFetchMock
      .mockResolvedValueOnce(errorResponse(503))
      .mockResolvedValueOnce(okResponse({ ok: true }));

    await expect(
      fetchFplJson('/api/bootstrap-static/', { retries: 2, retryDelayMs: 1 }),
    ).resolves.toEqual({ ok: true });
    expect(fplFetchMock).toHaveBeenCalledTimes(2);
  });

  it('throws FplUpstreamError after exhausting retries on persistent 503s', async () => {
    fplFetchMock.mockResolvedValue(errorResponse(503));

    await expect(
      fetchFplJson('/api/bootstrap-static/', { retries: 2, retryDelayMs: 1 }),
    ).rejects.toBeInstanceOf(FplUpstreamError);
    expect(fplFetchMock).toHaveBeenCalledTimes(3);
  });

  it('does not retry client errors', async () => {
    fplFetchMock.mockResolvedValue(errorResponse(404));

    await expect(
      fetchFplJson('/api/bootstrap-static/', { retries: 2, retryDelayMs: 1 }),
    ).rejects.toThrow('status 404');
    expect(fplFetchMock).toHaveBeenCalledTimes(1);
  });

  it('retries network errors', async () => {
    fplFetchMock
      .mockRejectedValueOnce(new Error('socket hang up'))
      .mockResolvedValueOnce(okResponse({ ok: true }));

    await expect(
      fetchFplJson('/api/bootstrap-static/', { retries: 1, retryDelayMs: 1 }),
    ).resolves.toEqual({ ok: true });
    expect(fplFetchMock).toHaveBeenCalledTimes(2);
  });

  it('rejects paths outside the FPL API', async () => {
    await expect(fetchFplJson('https://example.com/x')).rejects.toThrow(
      'Invalid FPL API path',
    );
    expect(fplFetchMock).not.toHaveBeenCalled();
  });
});
