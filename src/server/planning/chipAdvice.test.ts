import { describe, expect, it } from 'vitest';
import { buildChipAdvice } from './chipAdvice';
import type { PlayerProjection, Position } from './types';

const positions: Position[] = [1, 1, 2, 2, 2, 2, 2, 3, 3, 3, 3, 3, 4, 4, 4];
const squad: PlayerProjection[] = positions.map((position, index) => ({
  id: index + 1, name: `P${index + 1}`, teamId: index + 1, position, price: 5, sellingPrice: 5,
  expectedByGameweek: [index + 1, (index + 1) * 3, index + 1], expectedTotal: (index + 1) * 5,
  floor: 0, ceiling: 0, startProbability: 1, uncertainty: 0,
}));
const events = [{ id: 19, deadline_time: '2027-01-01T18:30:00Z' }, { id: 38, deadline_time: '2027-05-30T13:30:00Z' }];

describe('chip opportunities', () => {
  it('excludes weeks after the first copy expires and recommends at most one chip', () => {
    const advice = buildChipAdvice(squad, [19, 20, 21], events, [], null)!;
    expect(advice).toMatchObject({ expiresGameweek: 19, deadline: events[0].deadline_time, throughGameweek: 19 });
    expect(advice.options.every(option => option.best.gameweek === 19 && option.later === null)).toBe(true);
    expect(advice.recommendation).toBe('bboost');
  });

  it('resets chip usage in the second half but honors any chip already active', () => {
    const advice = buildChipAdvice(squad, [20, 21, 22], events, [
      { name: 'bboost', event: 19 }, { name: '3xc', event: 20 },
    ], 'wildcard')!;
    expect(advice.options.map(option => option.used)).toEqual([false, true]);
    expect(advice.options[0].later?.gameweek).toBe(21);
    expect(advice.recommendation).toBeNull();
  });

  it('waits when both scoring chips have a better opportunity in the current forecast', () => {
    const advice = buildChipAdvice(squad, [16, 17, 18], events, [], null)!;
    expect(advice.options.every(option => option.best.gameweek === 17)).toBe(true);
    expect(advice.recommendation).toBeNull();
  });

  it('withholds advice if FPL chip history is unavailable', () => {
    expect(buildChipAdvice(squad, [18, 19], events, null, null)).toBeUndefined();
  });
});
