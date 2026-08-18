import { describe, expect, it } from 'vitest';
import { resolveFplSquadReview, parseFplPlayerCatalog, type FplPlayerCatalogEntry } from './fplSquadReview';
import type { FplSquadImport } from './fplSquadImport';

const catalog: FplPlayerCatalogEntry[] = Array.from({ length: 15 }, (_, index) => ({
  id: index + 101,
  name: `Player ${index + 1}`,
  teamId: (index % 5) + 1,
  teamName: `Club ${(index % 5) + 1}`,
  position: index === 0 || index === 11 ? 'GKP' : index < 6 ? 'DEF' : index < 11 ? 'MID' : 'FWD',
}));

const squadImport: FplSquadImport = {
  schemaVersion: 1,
  source: 'fpl-authenticated-my-team',
  entryId: 3_376_378,
  capturedAt: '2026-08-18T12:00:00.000Z',
  activeChip: null,
  picks: Array.from({ length: 15 }, (_, index) => ({
    elementId: index + 101,
    lineupPosition: index + 1,
    sellingPrice: 50,
    purchasePrice: 50,
    multiplier: index < 11 ? (index === 0 ? 2 : 1) : 0,
    isCaptain: index === 0,
    isViceCaptain: index === 1,
  })),
  transfers: { bank: 15, squadValue: 1_010, freeTransfers: null, transfersMade: 0, transferCost: 0, status: 'unlimited' },
};

describe('FPL squad review', () => {
  it('parses a bounded public catalogue and resolves lineup order locally', () => {
    const review = resolveFplSquadReview(squadImport, parseFplPlayerCatalog(catalog));
    expect(review.startingEleven).toHaveLength(11);
    expect(review.bench).toHaveLength(4);
    expect(review.startingEleven[0]).toMatchObject({ name: 'Player 1', isCaptain: true });
    expect(review.bench[0].lineupPosition).toBe(12);
  });

  it('fails when an imported player cannot be resolved', () => {
    expect(() => resolveFplSquadReview(squadImport, catalog.slice(1))).toThrow('Player #101');
  });

  it('rejects duplicate or malformed catalogue entries', () => {
    expect(() => parseFplPlayerCatalog([...catalog, catalog[0]])).toThrow('duplicate IDs');
    expect(() => parseFplPlayerCatalog(catalog.map((player, index) => index === 0 ? { ...player, position: 'COACH' } : player))).toThrow('invalid');
  });
});
