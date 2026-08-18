import { describe, expect, it } from 'vitest';
import type { FplSquadImport } from '@/lib/fplSquadImport';
import { validateImportedSquadForPlanning, type PlanningPlayerIdentity } from './importedSquad';

const capturedAt = '2026-08-18T12:00:00.000Z';
const identities: PlanningPlayerIdentity[] = [
  ...Array.from({ length: 2 }, (_, i) => ({ id: i + 1, teamId: i + 1, position: 1 as const })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: i + 3, teamId: i + 3, position: 2 as const })),
  ...Array.from({ length: 5 }, (_, i) => ({ id: i + 8, teamId: i + 8, position: 3 as const })),
  ...Array.from({ length: 3 }, (_, i) => ({ id: i + 13, teamId: i + 13, position: 4 as const })),
];
const lineupOrder = [1, 3, 4, 5, 8, 9, 10, 11, 13, 14, 15, 2, 6, 7, 12];
const imported = (): FplSquadImport => ({
  schemaVersion: 1, source: 'fpl-authenticated-my-team', entryId: 42, capturedAt, activeChip: null,
  picks: lineupOrder.map((id, index) => ({
    elementId: id, lineupPosition: index + 1, sellingPrice: 50, purchasePrice: 50,
    multiplier: index < 11 ? (index === 0 ? 2 : 1) : 0, isCaptain: index === 0, isViceCaptain: index === 1,
  })),
  transfers: { bank: 10, squadValue: 1_010, freeTransfers: 1, transfersMade: 0, transferCost: 0, status: 'cost' },
});

describe('imported planning squad validation', () => {
  it('accepts a fresh legal squad belonging to the authenticated entry', () => {
    expect(() => validateImportedSquadForPlanning(imported(), 42, identities, new Date(capturedAt))).not.toThrow();
  });

  it('rejects entry mismatch, stale data, missing players, club excess, and illegal formation', () => {
    expect(() => validateImportedSquadForPlanning(imported(), 43, identities, new Date(capturedAt))).toThrow('different FPL entry');
    expect(() => validateImportedSquadForPlanning(imported(), 42, identities, new Date('2026-08-18T15:00:00Z'))).toThrow('no longer fresh');
    expect(() => validateImportedSquadForPlanning(imported(), 42, identities.slice(1), new Date(capturedAt))).toThrow('unavailable');
    expect(() => validateImportedSquadForPlanning(imported(), 42, identities.map(player => ({ ...player, teamId: 1 })), new Date(capturedAt))).toThrow('club limit');
    const illegal = imported();
    const goalkeeper = illegal.picks.find(pick => pick.elementId === 2)!;
    const forward = illegal.picks.find(pick => pick.elementId === 13)!;
    [goalkeeper.lineupPosition, forward.lineupPosition] = [forward.lineupPosition, goalkeeper.lineupPosition];
    expect(() => validateImportedSquadForPlanning(illegal, 42, identities, new Date(capturedAt))).toThrow('formation');
  });
});
