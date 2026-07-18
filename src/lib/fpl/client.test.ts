import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearFplCache, FplApiError, fplFetch, getBootstrap, getPicks } from './client';

afterEach(() => {
  clearFplCache();
  vi.restoreAllMocks();
});

describe('FPL client contract boundary', () => {
  it('maps unavailable picks to a typed error', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(getPicks(123, 1)).rejects.toMatchObject({
      code: 'picks_unavailable',
      status: 404,
      path: '/entry/123/event/1/picks/',
    });
  });

  it('rejects non-JSON upstream responses', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html>maintenance</html>', {
      status: 200,
      headers: { 'content-type': 'text/html' },
    })));
    await expect(fplFetch('/bootstrap-static/', { retries: 0 })).rejects.toBeInstanceOf(FplApiError);
    await expect(fplFetch('/bootstrap-static/', { retries: 0 })).rejects.toMatchObject({ code: 'invalid_response' });
  });

  it('coalesces cached requests within the TTL', async () => {
    const fetchMock = vi.fn().mockResolvedValue(new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    }));
    vi.stubGlobal('fetch', fetchMock);
    await Promise.all([
      fplFetch('/fixtures/', { cacheTtlMs: 60_000 }),
      fplFetch('/fixtures/', { cacheTtlMs: 60_000 }),
    ]);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('validates required bootstrap collections', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(JSON.stringify({ events: [], elements: [] }), {
      status: 200,
      headers: { 'content-type': 'application/json' },
    })));
    await expect(getBootstrap()).rejects.toMatchObject({ code: 'invalid_response' });
  });
});