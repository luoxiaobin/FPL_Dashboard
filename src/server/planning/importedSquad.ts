import type { FplSquadImport } from '@/lib/fplSquadImport';
import type { Position } from '@/server/planning/types';

export interface PlanningPlayerIdentity {
  id: number;
  teamId: number;
  position: Position;
}

export class PlanningSquadValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'PlanningSquadValidationError';
  }
}

const countPositions = (players: PlanningPlayerIdentity[]) => {
  const counts = new Map<Position, number>();
  for (const player of players) counts.set(player.position, (counts.get(player.position) ?? 0) + 1);
  return counts;
};

export function validateImportedSquadForPlanning(
  imported: FplSquadImport,
  authenticatedEntryId: number,
  availablePlayers: PlanningPlayerIdentity[],
  now = new Date(),
): void {
  if (imported.entryId !== authenticatedEntryId) {
    throw new PlanningSquadValidationError('The imported squad belongs to a different FPL entry');
  }
  const ageMs = now.getTime() - Date.parse(imported.capturedAt);
  if (ageMs < -5 * 60_000 || ageMs > 2 * 60 * 60_000) {
    throw new PlanningSquadValidationError('The imported squad is no longer fresh; run the bookmark again');
  }

  const byId = new Map(availablePlayers.map(player => [player.id, player]));
  const squad = imported.picks.map((pick) => {
    const player = byId.get(pick.elementId);
    if (!player) throw new PlanningSquadValidationError(`Player #${pick.elementId} is unavailable in the current FPL catalogue`);
    return player;
  });

  const positions = countPositions(squad);
  if (positions.get(1) !== 2 || positions.get(2) !== 5 || positions.get(3) !== 5 || positions.get(4) !== 3) {
    throw new PlanningSquadValidationError('The imported squad has an invalid positional composition');
  }
  const clubs = new Map<number, number>();
  for (const player of squad) {
    const count = (clubs.get(player.teamId) ?? 0) + 1;
    if (count > 3) throw new PlanningSquadValidationError('The imported squad exceeds the three-player club limit');
    clubs.set(player.teamId, count);
  }

  const startingIds = new Set(imported.picks.filter(pick => pick.lineupPosition <= 11).map(pick => pick.elementId));
  const starters = squad.filter(player => startingIds.has(player.id));
  const formation = countPositions(starters);
  if (
    starters.length !== 11
    || formation.get(1) !== 1
    || (formation.get(2) ?? 0) < 3 || (formation.get(2) ?? 0) > 5
    || (formation.get(3) ?? 0) < 2 || (formation.get(3) ?? 0) > 5
    || (formation.get(4) ?? 0) < 1 || (formation.get(4) ?? 0) > 3
  ) throw new PlanningSquadValidationError('The imported starting XI has an invalid formation');
}
