import { beforeEach, describe, expect, it, vi } from 'vitest';
import { NextRequest } from 'next/server';
import type { FplSquadImport } from '@/lib/fplSquadImport';

const { buildPlanningWorkspaceMock, loadConfirmedSquadImportMock } = vi.hoisted(() => ({
  buildPlanningWorkspaceMock: vi.fn(),
  loadConfirmedSquadImportMock: vi.fn(),
}));

vi.mock('@/lib/session', () => ({
  getEntryIdFromSession: vi.fn().mockResolvedValue(3376378),
}));
vi.mock('@/lib/upstreamFetch', () => ({
  toSafeId: (value: string | number) => String(value),
}));
vi.mock('@/server/planning/workspace', () => ({
  buildPlanningWorkspace: buildPlanningWorkspaceMock,
}));
vi.mock('@/server/planning/importStore', () => ({
  loadConfirmedSquadImport: loadConfirmedSquadImportMock,
}));

import { POST } from './route';

const importedSquad: FplSquadImport = {
  schemaVersion: 1,
  source: 'fpl-authenticated-my-team',
  entryId: 3376378,
  capturedAt: '2026-08-18T12:00:00.000Z',
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
  transfers: {
    bank: 10,
    squadValue: 1010,
    freeTransfers: 1,
    transfersMade: 0,
    transferCost: 0,
    status: 'cost',
  },
};

describe('planning scenarios route', () => {
  beforeEach(() => {
    buildPlanningWorkspaceMock.mockReset();
    loadConfirmedSquadImportMock.mockReset();
  });

  it('loads the server-confirmed squad when the browser sends only constraints', async () => {
    loadConfirmedSquadImportMock.mockResolvedValue({
      payload: importedSquad,
      confirmedAt: '2026-08-18T12:01:00.000Z',
      expiresAt: '2026-08-21T19:30:00.000Z',
    });
    buildPlanningWorkspaceMock.mockResolvedValue({ squadSource: 'authenticated-import', scenarios: [] });

    const response = await POST(new NextRequest('http://localhost/api/v1/planning/scenarios', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ constraints: { maxPointsHit: 4 } }),
    }));

    expect(response.status).toBe(200);
    expect(loadConfirmedSquadImportMock).toHaveBeenCalledWith(3376378);
    expect(buildPlanningWorkspaceMock).toHaveBeenCalledWith(
      3376378,
      expect.objectContaining({ maxPointsHit: 4 }),
      importedSquad,
    );
  });
});
