import { describe, expect, it } from 'vitest';
import type { PlayerProjection, Position } from '@/server/planning/types';
import { DEFAULT_PLANNING_CONSTRAINTS } from '@/server/planning/types';
import { generatePlanningScenarios } from './generator';

const player = (id: number, position: Position, teamId: number, score: number): PlayerProjection => ({
  id, name: `P${id}`, teamId, position, price: 50, sellingPrice: 50,
  expectedByGameweek: [score / 5, score / 5, score / 5, score / 5, score / 5],
  expectedTotal: score, floor: score * 0.7, ceiling: score * 1.3,
  uncertainty: 0.1, startProbability: 0.95,
});

const squad = [
  player(1, 1, 1, 20), player(2, 1, 2, 15),
  player(3, 2, 3, 25), player(4, 2, 4, 24), player(5, 2, 5, 23), player(6, 2, 6, 22), player(7, 2, 7, 10),
  player(8, 3, 8, 30), player(9, 3, 9, 29), player(10, 3, 10, 28), player(11, 3, 1, 27), player(12, 3, 2, 12),
  player(13, 4, 3, 26), player(14, 4, 4, 21), player(15, 4, 5, 11),
];

describe('generatePlanningScenarios', () => {
  it('returns three complete legal plans', () => {
    const scenarios = generatePlanningScenarios(
      squad,
      [player(16, 2, 8, 35), player(17, 4, 9, 32)],
      10,
      DEFAULT_PLANNING_CONSTRAINTS,
    );

    expect(scenarios.map(scenario => scenario.strategy)).toEqual(['floor', 'balanced', 'upside']);
    for (const scenario of scenarios) {
      expect(scenario.squad).toHaveLength(15);
      expect(scenario.startingEleven).toHaveLength(11);
      expect(scenario.bench).toHaveLength(4);
      expect(scenario.startingEleven).toContain(scenario.captainId);
      expect(scenario.bankRemaining).toBeGreaterThanOrEqual(0);
    }
  });

  it('respects locked and excluded players', () => {
    const scenarios = generatePlanningScenarios(squad, [player(16, 2, 8, 50)], 10, {
      ...DEFAULT_PLANNING_CONSTRAINTS,
      lockedPlayerIds: [7],
      excludedPlayerIds: [16],
    });
    expect(scenarios.every(scenario => scenario.squad.includes(7))).toBe(true);
    expect(scenarios.every(scenario => !scenario.squad.includes(16))).toBe(true);
  });

  it('never exceeds the configured points-hit ceiling', () => {
    const scenarios = generatePlanningScenarios(
      squad,
      [player(16, 2, 8, 50), player(17, 3, 9, 48), player(18, 4, 10, 46)],
      10,
      { ...DEFAULT_PLANNING_CONSTRAINTS, maxPointsHit: 4 },
    );
    expect(scenarios.every(scenario => scenario.transferHit <= 4)).toBe(true);
    expect(scenarios.every(scenario => scenario.transfers.length <= 2)).toBe(true);
  });
});
