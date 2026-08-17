import { describe, expect, it } from 'vitest';
import { projectPlayer } from './model';

describe('projectPlayer', () => {
  it('handles doubles and blanks across the five-gameweek horizon', () => {
    const projection = projectPlayer({
      id: 1, webName: 'Example', teamId: 1, position: 3, price: 75,
      form: 5, officialExpectedNext: 6, status: 'a', chanceOfPlayingNextRound: 100,
    }, [
      { gameweek: 1, difficulty: 2 },
      { gameweek: 1, difficulty: 3 },
      { gameweek: 3, difficulty: 4 },
    ], [1, 2, 3, 4, 5]);

    expect(projection.expectedByGameweek[0]).toBeGreaterThan(projection.expectedByGameweek[2]);
    expect(projection.expectedByGameweek[1]).toBe(0);
    expect(projection.expectedTotal).toBeGreaterThan(0);
    expect(projection.floor).toBeLessThan(projection.expectedTotal);
    expect(projection.ceiling).toBeGreaterThan(projection.expectedTotal);
  });
});

