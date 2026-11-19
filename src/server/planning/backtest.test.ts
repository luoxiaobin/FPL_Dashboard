import { describe, expect, it, vi } from 'vitest';

const { from, fetchFplJson } = vi.hoisted(() => ({ from: vi.fn(), fetchFplJson: vi.fn() }));
vi.mock('@/lib/supabase', () => ({ supabaseAdmin: { from } }));
vi.mock('@/server/fpl/client', () => ({ fetchFplJson }));

import { loadLatestBacktest } from './backtest';

describe('homepage Planning backtest', () => {
  it('replays the last finalized Gameweek using a recorded pre-deadline recommendation', async () => {
    const deadline = '2026-08-21T17:30:00Z';
    const recorded = '2026-08-20T15:00:00Z';
    const playerIds = Array.from({ length: 15 }, (_, index) => index + 1);
    const positions = [1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 3, 2, 2, 1];
    const stored = {
      created_at: recorded,
      decisions: { squad: playerIds, startingEleven: playerIds.slice(0, 11), bench: playerIds.slice(11),
        captainId: 5, viceCaptainId: 6, transferHit: 4, chip: null, chipAdvice: { recommendation: 'bboost' } },
      projections: { players: Object.fromEntries(playerIds.map(id => [id, { name: `P${id}`, position: positions[id - 1] }])) },
      entry_snapshots: { transfers_payload: { transferCost: 4, activeChip: null } },
    };
    const query = {
      select: vi.fn().mockReturnThis(), eq: vi.fn().mockReturnThis(), lt: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(), limit: vi.fn().mockReturnThis(), maybeSingle: vi.fn().mockReturnThis(),
      returns: vi.fn().mockResolvedValue({ data: stored, error: null }),
    };
    from.mockReturnValue(query);
    fetchFplJson.mockImplementation(async (path: string) => {
      if (path === '/api/bootstrap-static/') return { events: [
        { id: 1, finished: true, data_checked: true, deadline_time: deadline },
        { id: 2, finished: true, data_checked: false, deadline_time: '2026-08-28T17:30:00Z' },
      ] };
      if (path.endsWith('/picks/')) return { entry_history: { points: 62, event_transfers_cost: 4 }, active_chip: '3xc' };
      return { elements: playerIds.map(id => ({
        id, stats: { minutes: id === 5 ? 0 : 90, total_points: id === 5 ? 0 : 5 },
      })) };
    });

    expect(await loadLatestBacktest('42')).toMatchObject({
      status: 'ready', gameweek: 1, recordedAt: recorded,
      actual: { gross: 62, net: 58, transferHit: 4, chip: '3xc' },
      planned: { gross: 60, net: 52, transferHit: 8, captainFallback: true, captainScorer: 'P6' },
      chipComparison: { chip: 'bboost', withoutChip: 52, withChip: 67, gain: 15 },
      difference: -6, grossDifference: -2, transferHitDifference: -4,
    });
    expect(query.eq).toHaveBeenCalledWith('entry_snapshots.fpl_entry_id', '42');
    expect(query.eq).toHaveBeenCalledWith('entry_snapshots.fpl_snapshots.seasons.code', '2026-27');
    expect(query.lt).toHaveBeenCalledWith('created_at', deadline);
    expect(query.lt).toHaveBeenCalledWith('entry_snapshots.captured_at', deadline);
    expect(fetchFplJson).toHaveBeenCalledWith('/api/entry/42/event/1/picks/', { cacheSeconds: 3600 });
  });
});
