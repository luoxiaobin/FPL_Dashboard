import type { FplImportedPick, FplSquadImport } from './fplSquadImport';

export type FplPositionCode = 'GKP' | 'DEF' | 'MID' | 'FWD';

export interface FplPlayerCatalogEntry {
  id: number;
  name: string;
  teamId: number;
  teamName: string;
  position: FplPositionCode;
}

export interface FplSquadReviewPlayer extends FplImportedPick, FplPlayerCatalogEntry {}

export interface FplSquadReview {
  startingEleven: FplSquadReviewPlayer[];
  bench: FplSquadReviewPlayer[];
}

const POSITION_CODES = new Set<FplPositionCode>(['GKP', 'DEF', 'MID', 'FWD']);

const isRecord = (value: unknown): value is Record<string, unknown> => (
  typeof value === 'object' && value !== null && !Array.isArray(value)
);

export function parseFplPlayerCatalog(value: unknown): FplPlayerCatalogEntry[] {
  if (!Array.isArray(value) || value.length < 15 || value.length > 1_000) {
    throw new Error('The FPL player catalogue is invalid');
  }
  const ids = new Set<number>();
  const entries = value.map((candidate) => {
    if (
      !isRecord(candidate)
      || !Number.isInteger(candidate.id) || Number(candidate.id) <= 0
      || typeof candidate.name !== 'string' || candidate.name.length < 1 || candidate.name.length > 80
      || !Number.isInteger(candidate.teamId) || Number(candidate.teamId) <= 0
      || typeof candidate.teamName !== 'string' || candidate.teamName.length < 1 || candidate.teamName.length > 80
      || typeof candidate.position !== 'string' || !POSITION_CODES.has(candidate.position as FplPositionCode)
    ) throw new Error('The FPL player catalogue is invalid');
    if (ids.has(Number(candidate.id))) throw new Error('The FPL player catalogue contains duplicate IDs');
    ids.add(Number(candidate.id));
    return candidate as unknown as FplPlayerCatalogEntry;
  });
  return entries;
}

export function resolveFplSquadReview(
  squadImport: FplSquadImport,
  catalog: FplPlayerCatalogEntry[],
): FplSquadReview {
  const byId = new Map(catalog.map(player => [player.id, player]));
  const resolved = squadImport.picks.map((pick) => {
    const player = byId.get(pick.elementId);
    if (!player) throw new Error(`Player #${pick.elementId} is missing from the current FPL catalogue`);
    return { ...pick, ...player };
  }).sort((a, b) => a.lineupPosition - b.lineupPosition);
  return {
    startingEleven: resolved.filter(player => player.lineupPosition <= 11),
    bench: resolved.filter(player => player.lineupPosition > 11),
  };
}
