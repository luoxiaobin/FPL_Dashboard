import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { FplSquadImport } from '@/lib/fplSquadImport';
import { DEFAULT_PLANNING_CONSTRAINTS } from './types';

const { fetchFplJsonMock } = vi.hoisted(() => ({ fetchFplJsonMock: vi.fn() }));

vi.mock('@/server/fpl/client', () => {
  class FplUpstreamError extends Error {
    constructor(message: string, readonly status: number, readonly path: string) {
      super(message);
      this.name = 'FplUpstreamError';
    }
  }
  return { fetchFplJson: fetchFplJsonMock, FplUpstreamError };
});

import { FplUpstreamError } from '@/server/fpl/client';
import { buildPlanningWorkspace } from './workspace';

const positions = [1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4, 2];
const players = positions.map((elementType, index) => ({
  id: index + 1,
  web_name: `Player ${index + 1}`,
  team: index + 1,
  element_type: elementType,
  now_cost: 50,
  form: index === 15 ? '9.0' : '4.0',
  ep_next: index === 15 ? '9.0' : '4.0',
  status: 'a',
  chance_of_playing_next_round: null,
}));
const lineupOrder = [1, 3, 4, 5, 8, 9, 10, 11, 13, 14, 15, 2, 6, 7, 12];
const capturedAt = new Date().toISOString();
const importedSquad: FplSquadImport = {
  schemaVersion: 1,
  source: 'fpl-authenticated-my-team',
  entryId: 3376378,
  capturedAt,
  activeChip: null,
  picks: lineupOrder.map((id, index) => ({
    elementId: id,
    lineupPosition: index + 1,
    sellingPrice: 50,
    purchasePrice: 50,
    multiplier: index < 11 ? (index === 0 ? 2 : 1) : 0,
    isCaptain: index === 0,
    isViceCaptain: index === 1,
  })),
  transfers: {
    bank: 10,
    squadValue: 760,
    freeTransfers: 0,
    transfersMade: 0,
    transferCost: 0,
    status: 'unlimited',
  },
};

describe('planning workspace confirmed-squad bridge', () => {
  beforeEach(() => {
    fetchFplJsonMock.mockReset();
  });

  it('uses a confirmed import with official fixtures when public picks are unpublished', async () => {
    fetchFplJsonMock.mockImplementation(async (path: string) => {
      if (path === '/api/bootstrap-static/') return {
        events: [{
          id: 1,
          is_current: false,
          is_next: true,
          finished: false,
          deadline_time: new Date(Date.now() + 3_600_000).toISOString(),
        }],
        elements: players,
      };
      if (path === '/api/fixtures/') return Array.from({ length: 8 }, (_, index) => ({
        event: 1,
        team_h: index * 2 + 1,
        team_a: index * 2 + 2,
        team_h_difficulty: 3,
        team_a_difficulty: 3,
      }));
      throw new FplUpstreamError('Picks not published', 404, path);
    });

    const workspace = await buildPlanningWorkspace(
      3376378,
      DEFAULT_PLANNING_CONSTRAINTS,
      importedSquad,
    );

    expect(workspace.squadSource).toBe('authenticated-import');
    expect(workspace.sourceCapturedAt).toBe(capturedAt);
    expect(workspace.transferState).toEqual({ freeTransfers: 0, unlimited: true });
    expect(workspace.scenarios).toHaveLength(3);
    expect(workspace.scenarios.every(scenario => scenario.squad.length === 15)).toBe(true);
    expect(workspace.scenarios.every(scenario => scenario.transferHit === 0)).toBe(true);
    expect(workspace.players['1'].expectedTotal).toBeGreaterThan(0);
    expect(fetchFplJsonMock).toHaveBeenCalledWith(
      '/api/entry/3376378/event/1/picks/',
      { timeoutMs: 8_000 },
    );
  });
});
