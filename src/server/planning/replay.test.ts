import { describe, expect, it } from 'vitest';
import { replayPlan, type ReplayPlayer } from './replay';
import type { Position } from './types';

const plan = {
  startingEleven: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  bench: [12, 13, 14, 15],
  captainId: 5,
  viceCaptainId: 6,
  transferHit: 4,
};

const positions: Position[] = [1, 2, 2, 2, 3, 3, 3, 3, 4, 4, 4, 3, 2, 2, 1];

function playersFor(noShows: number[] = []): ReplayPlayer[] {
  return positions.map((position, index) => {
    const id = index + 1;
    return { id, name: `P${id}`, position, points: noShows.includes(id) ? 0 : id, appeared: !noShows.includes(id) };
  });
}

describe('replayPlan', () => {
  it('limits a three-defender lineup to a defender replacement and uses the vice captain', () => {
    const result = replayPlan(plan, playersFor([1, 2, 5]));
    expect(result.substitutions).toEqual([
      { outgoing: 'P5', incoming: 'P12', points: 12 },
      { outgoing: 'P2', incoming: 'P13', points: 13 },
      { outgoing: 'P1', incoming: 'P15', points: 15 },
    ]);
    expect(result.captainBonus).toBe(6);
    expect(result.captainFallback).toBe(true);
    expect(result.net).toBe(66 - 1 - 2 - 5 + 12 + 13 + 15 + 6 - 4);
  });

  it('skips an illegal first substitute when no other starter can be replaced', () => {
    const result = replayPlan(plan, playersFor([2]));
    expect(result.substitutions).toEqual([{ outgoing: 'P2', incoming: 'P13', points: 13 }]);
  });

  it('counts an appearing player on zero points and gives no captain bonus when both captains miss out', () => {
    const players = playersFor([5, 6]).map(player => player.id === 2 ? { ...player, points: 0 } : player);
    const result = replayPlan(plan, players);
    expect(result.substitutions.every(swap => swap.outgoing !== 'P2')).toBe(true);
    expect(result.captainScorer).toBeNull();
    expect(result.captainBonus).toBe(0);
  });

  it('replays a recorded Bench Boost or Triple Captain with the appropriate points', () => {
    expect(replayPlan({ ...plan, chip: 'bboost' }, playersFor()).net).toBe(120 + 5 - 4);
    expect(replayPlan({ ...plan, chip: '3xc' }, playersFor([5])).captainBonus).toBe(12);
  });
});
