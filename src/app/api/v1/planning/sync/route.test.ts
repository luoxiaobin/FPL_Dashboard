import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { FplSquadImport } from '@/lib/fplSquadImport';

const { resolveTokenMock, fetchFplJsonMock, saveImportMock } = vi.hoisted(() => ({
  resolveTokenMock: vi.fn(),
  fetchFplJsonMock: vi.fn(),
  saveImportMock: vi.fn(),
}));

vi.mock('@/server/planning/syncTokenStore', () => ({ resolveFplSyncToken: resolveTokenMock }));
vi.mock('@/server/fpl/client', () => ({ fetchFplJson: fetchFplJsonMock }));
vi.mock('@/server/planning/importStore', () => ({ saveConfirmedSquadImport: saveImportMock }));
vi.mock('@/server/planning/importedSquad', async importOriginal => {
  const actual = await importOriginal<typeof import('@/server/planning/importedSquad')>();
  return { ...actual, validateImportedSquadForPlanning: vi.fn() };
});

import { OPTIONS, POST } from './route';

const importedSquad: FplSquadImport = {
  schemaVersion: 1,
  source: 'fpl-authenticated-my-team',
  entryId: 3376378,
  capturedAt: '2026-08-27T12:00:00.000Z',
  activeChip: null,
  picks: Array.from({ length: 15 }, (_, index) => ({
    elementId: index + 1,
    lineupPosition: index + 1,
    sellingPrice: 50,
    purchasePrice: 50,
    multiplier: index < 11 ? 1 : 0,
    isCaptain: index === 0,
    isViceCaptain: index === 1,
  })),
  transfers: { bank: 10, squadValue: 1000, freeTransfers: 1, transfersMade: 0, transferCost: 0, status: 'cost' },
};

const request = (origin = 'https://fantasy.premierleague.com') => new NextRequest('http://localhost/api/v1/planning/sync', {
  method: 'POST',
  headers: { origin, authorization: 'Bearer paired-token', 'content-type': 'application/json' },
  body: JSON.stringify({ importedSquad }),
});

describe('FPL auto-sync route', () => {
  beforeEach(() => {
    resolveTokenMock.mockReset();
    fetchFplJsonMock.mockReset();
    saveImportMock.mockReset();
  });

  it('supports a narrow FPL-only CORS preflight', () => {
    const response = OPTIONS();
    expect(response.status).toBe(204);
    expect(response.headers.get('access-control-allow-origin')).toBe('https://fantasy.premierleague.com');
  });

  it('rejects submissions from any other browser origin', async () => {
    const response = await POST(request('https://example.com'));
    expect(response.status).toBe(403);
    expect(resolveTokenMock).not.toHaveBeenCalled();
  });

  it('rejects an invalid or expired pairing token', async () => {
    resolveTokenMock.mockResolvedValue(null);
    const response = await POST(request());
    expect(response.status).toBe(401);
  });

  it('validates and saves a paired squad without a dashboard cookie', async () => {
    resolveTokenMock.mockResolvedValue(3376378);
    fetchFplJsonMock.mockResolvedValue({
      events: [{ id: 2, is_current: false, is_next: true, finished: false, deadline_time: '2026-08-28T17:30:00.000Z' }],
      elements: [],
    });
    saveImportMock.mockResolvedValue({
      payload: importedSquad,
      expiresAt: '2026-08-28T19:30:00.000Z',
    });

    const response = await POST(request());
    expect(response.status).toBe(200);
    expect(saveImportMock).toHaveBeenCalled();
    expect(await response.json()).toMatchObject({ synced: true, gameweek: 2 });
  });
});
