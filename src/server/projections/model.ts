import type { PlayerProjection, Position } from '@/server/planning/types';

export const PROJECTION_MODEL_VERSION = 'fpl-internal-v1';

export interface ProjectionPlayerInput {
  id: number;
  webName: string;
  teamId: number;
  position: Position;
  price: number;
  sellingPrice?: number;
  form: number;
  officialExpectedNext: number;
  status: string;
  chanceOfPlayingNextRound: number | null;
}

export interface ProjectionFixtureInput {
  gameweek: number;
  difficulty: number;
}

function startProbability(player: ProjectionPlayerInput): number {
  if (player.chanceOfPlayingNextRound !== null) {
    return Math.max(0, Math.min(1, player.chanceOfPlayingNextRound / 100));
  }
  if (player.status === 'a') return 0.94;
  if (player.status === 'd') return 0.7;
  return 0.1;
}

export function projectPlayer(
  player: ProjectionPlayerInput,
  fixtures: ProjectionFixtureInput[],
  gameweeks: number[],
): PlayerProjection {
  const probability = startProbability(player);
  const expectedByGameweek = gameweeks.map((gameweek, index) => {
    const gameweekFixtures = fixtures.filter(fixture => fixture.gameweek === gameweek);
    if (gameweekFixtures.length === 0) return 0;

    const fixtureFactor = gameweekFixtures.reduce(
      (total, fixture) => total + Math.max(0.55, (6 - fixture.difficulty) / 3),
      0,
    );
    const formBaseline = 2 + (player.form * 0.65);
    const base = index === 0 && player.officialExpectedNext > 0
      ? player.officialExpectedNext
      : formBaseline;
    return Number((base * fixtureFactor * probability).toFixed(2));
  });

  const expectedTotal = Number(expectedByGameweek.reduce((sum, value) => sum + value, 0).toFixed(2));
  const uncertainty = Number(Math.min(1, (1 - probability) + (player.form === 0 ? 0.15 : 0.05)).toFixed(2));

  return {
    id: player.id,
    name: player.webName,
    teamId: player.teamId,
    position: player.position,
    price: player.price,
    sellingPrice: player.sellingPrice ?? player.price,
    expectedByGameweek,
    expectedTotal,
    floor: Number((expectedTotal * (0.72 - uncertainty * 0.2)).toFixed(2)),
    ceiling: Number((expectedTotal * (1.25 + uncertainty * 0.45)).toFixed(2)),
    uncertainty,
    startProbability: probability,
  };
}

