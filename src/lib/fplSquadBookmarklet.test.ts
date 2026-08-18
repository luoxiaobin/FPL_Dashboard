import { describe, expect, it } from 'vitest';
import { buildFplSquadBookmarklet } from './fplSquadBookmarklet';
import { decodeFplSquadImport } from './fplSquadImport';

describe('complete FPL squad bookmarklet', () => {
  const bookmarklet = buildFplSquadBookmarklet('https://dashboard.example/');

  it('is valid JavaScript and targets the fragment-only import route', () => {
    expect(() => new Function(bookmarklet.slice('javascript:'.length))).not.toThrow();
    expect(bookmarklet).toContain('https://dashboard.example/planning/import#data=');
  });

  it('reads the authenticated endpoints and normalizes contract version 1', () => {
    expect(bookmarklet).toContain("fetch('/api/me/'");
    expect(bookmarklet).toContain("fetch('/api/my-team/'");
    expect(bookmarklet).toContain('schemaVersion:1');
    expect(bookmarklet).toContain("source:'fpl-authenticated-my-team'");
    expect(bookmarklet).toContain('sellingPrice');
    expect(bookmarklet).toContain('freeTransfers');
  });

  it('does not read or transfer browser credentials', () => {
    expect(bookmarklet).toContain("credentials:'include'");
    expect(bookmarklet).not.toMatch(/document\.cookie|localStorage|sessionStorage|password|access_token/i);
  });

  it('normalizes a realistic my-team response into a decodable contract', async () => {
    const popup = { location: { href: '' }, close: () => undefined };
    const fetch = async (url: string) => ({
      ok: true,
      json: async () => url === '/api/me/' ? { player: { entry: 3_376_378 } } : {
        active_chip: null,
        picks: Array.from({ length: 15 }, (_, index) => ({
          element: index + 101,
          position: index + 1,
          selling_price: 50 + index,
          purchase_price: 49 + index,
          multiplier: index < 11 ? (index === 0 ? 2 : 1) : 0,
          is_captain: index === 0,
          is_vice_captain: index === 1,
        })),
        transfers: { bank: 10, value: 1_005, limit: null, made: 0, cost: 0, status: 'unlimited' },
      },
    });
    const execute = new Function(
      'window', 'fetch', 'TextEncoder', 'btoa', 'alert',
      `return ${bookmarklet.slice('javascript:'.length)}`,
    );

    await execute(
      { open: () => popup },
      fetch,
      TextEncoder,
      btoa,
      () => undefined,
    );

    const encoded = popup.location.href.split('#data=')[1];
    const payload = decodeFplSquadImport(encoded);
    expect(payload.entryId).toBe(3_376_378);
    expect(payload.picks).toHaveLength(15);
    expect(payload.transfers).toMatchObject({ bank: 10, freeTransfers: null, status: 'unlimited' });
  });
});
