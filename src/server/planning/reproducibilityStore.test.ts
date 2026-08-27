import { describe, expect, it } from 'vitest';
import { evaluatePlanOutcome, seasonIdentity } from './reproducibilityStore';

describe('planning reproducibility identity', () => {
  it('maps an August deadline to the season starting that year', () => {
    expect(seasonIdentity('2026-08-28T17:30:00Z')).toEqual({
      code: '2026-27',
      startsOn: '2026-07-01',
      endsOn: '2027-06-30',
    });
  });

  it('maps a January deadline to the season starting the previous year', () => {
    expect(seasonIdentity('2027-01-02T12:00:00Z').code).toBe('2026-27');
  });
});

describe('My Plan outcome evaluation', () => {
  it('compares the frozen decision with official points and picks', () => {
    const outcome = evaluatePlanOutcome({
      projectedGameweekPoints: 50,
      squad: Array.from({ length: 15 }, (_, index) => index + 1),
      startingEleven: Array.from({ length: 11 }, (_, index) => index + 1),
      captainId: 1,
    }, {
      picks: Array.from({ length: 15 }, (_, index) => ({
        element: index + 1,
        is_captain: index === 0,
        multiplier: index < 11 ? (index === 0 ? 2 : 1) : 0,
      })),
      entry_history: { points: 60, event_transfers_cost: 4, points_on_bench: 8 },
    }, {
      elements: Array.from({ length: 15 }, (_, index) => ({ id: index + 1, stats: { total_points: 5 } })),
    });

    expect(outcome).toMatchObject({
      projectedPoints: 50,
      actualPoints: 60,
      projectionError: 10,
      transferCost: 4,
      plannedRawPointsBeforeAutosubs: 60,
      captainMatched: true,
      squadMatched: true,
    });
  });
});
