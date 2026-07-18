import { describe, expect, it } from 'vitest';
import { scoreSquad, type FplPosition, type ScoringPlayer } from './scoring';

const player = (
  id: number,
  position: FplPosition,
  pickPosition: number,
  values: Partial<ScoringPlayer> = {},
): ScoringPlayer => ({
  id,
  position,
  pickPosition,
  multiplier: pickPosition <= 11 ? 1 : 0,
  isCaptain: false,
  isViceCaptain: false,
  points: 2,
  minutes: 90,
  fixtureFinished: true,
  ...values,
});

const baseSquad = (): ScoringPlayer[] => [
  player(1, 'GKP', 1),
  player(2, 'DEF', 2), player(3, 'DEF', 3), player(4, 'DEF', 4), player(5, 'DEF', 5),
  player(6, 'MID', 6), player(7, 'MID', 7), player(8, 'MID', 8), player(9, 'MID', 9),
  player(10, 'FWD', 10), player(11, 'FWD', 11),
  player(12, 'GKP', 12, { multiplier: 0 }),
  player(13, 'DEF', 13, { multiplier: 0 }),
  player(14, 'MID', 14, { multiplier: 0 }),
  player(15, 'FWD', 15, { multiplier: 0 }),
];

describe('scoreSquad', () => {
  it('applies captaincy and transfer costs', () => {
    const squad = baseSquad();
    squad[5] = { ...squad[5], isCaptain: true, multiplier: 2, points: 8 };
    expect(scoreSquad(squad, { transferCost: 4 })).toMatchObject({ grossTotal: 36, total: 32 });
  });

  it('passes captaincy to the vice-captain after a confirmed no-show', () => {
    const squad = baseSquad();
    squad[5] = { ...squad[5], isCaptain: true, multiplier: 2, points: 0, minutes: 0 };
    squad[6] = { ...squad[6], isViceCaptain: true, points: 7 };
    const result = scoreSquad(squad);
    expect(result.players.find(item => item.id === 7)?.effectiveMultiplier).toBe(2);
  });

  it('only substitutes a goalkeeper for a goalkeeper', () => {
    const squad = baseSquad();
    squad[0] = { ...squad[0], minutes: 0, points: 0 };
    const result = scoreSquad(squad);
    expect(result.substitutions).toContainEqual({ out: 1, in: 12 });
  });

  it('does not make an outfield substitution that breaks the minimum formation', () => {
    const squad = baseSquad();
    squad[4] = { ...squad[4], position: 'MID' };
    squad[1] = { ...squad[1], minutes: 0, points: 0 };
    squad[12] = { ...squad[12], minutes: 0, points: 0 };
    const result = scoreSquad(squad);
    expect(result.substitutions.some(sub => sub.out === 2)).toBe(false);
  });

  it('uses outfield bench order when more than one substitute is eligible', () => {
    const squad = baseSquad();
    squad[5] = { ...squad[5], minutes: 0, points: 0 };
    const result = scoreSquad(squad);
    expect(result.substitutions).toContainEqual({ out: 6, in: 13 });
  });

  it('counts the full bench during bench boost', () => {
    const result = scoreSquad(baseSquad(), { activeChip: 'bboost' });
    expect(result.players.filter(item => item.pickPosition > 11).every(item => item.effectiveMultiplier === 1)).toBe(true);
    expect(result.grossTotal).toBe(30);
  });

  it('retains the triple-captain multiplier', () => {
    const squad = baseSquad();
    squad[5] = { ...squad[5], isCaptain: true, multiplier: 3, points: 5 };
    expect(scoreSquad(squad).players.find(item => item.id === 6)?.countedPoints).toBe(15);
  });
});
