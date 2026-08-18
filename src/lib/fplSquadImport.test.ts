import { describe, expect, it } from 'vitest';
import {
  FPL_SQUAD_IMPORT_SCHEMA_VERSION,
  FPL_SQUAD_IMPORT_SOURCE,
  FplSquadImportValidationError,
  parseFplSquadImport,
  type FplSquadImport,
} from './fplSquadImport';

const validImport = (): FplSquadImport => ({
  schemaVersion: FPL_SQUAD_IMPORT_SCHEMA_VERSION,
  source: FPL_SQUAD_IMPORT_SOURCE,
  entryId: 3_376_378,
  capturedAt: '2026-08-18T12:00:00.000Z',
  activeChip: null,
  picks: Array.from({ length: 15 }, (_, index) => ({
    elementId: index + 101,
    lineupPosition: index + 1,
    sellingPrice: 45 + index,
    purchasePrice: 44 + index,
    multiplier: index < 11 ? (index === 0 ? 2 : 1) : 0,
    isCaptain: index === 0,
    isViceCaptain: index === 1,
  })),
  transfers: {
    bank: 10,
    squadValue: 1_005,
    freeTransfers: null,
    transfersMade: 0,
    transferCost: 0,
    status: 'unlimited',
  },
});

describe('FPL squad import contract', () => {
  it('accepts a complete pre-season squad with unlimited transfers', () => {
    expect(parseFplSquadImport(validImport())).toEqual(validImport());
  });

  it('accepts a bounded in-season transfer allowance', () => {
    const payload = validImport();
    payload.transfers.freeTransfers = 5;
    payload.transfers.status = 'cost';
    expect(parseFplSquadImport(payload).transfers.freeTransfers).toBe(5);
  });

  it.each([
    ['fewer than 15 picks', (payload: FplSquadImport) => { payload.picks.pop(); }],
    ['duplicate players', (payload: FplSquadImport) => { payload.picks[1].elementId = payload.picks[0].elementId; }],
    ['duplicate positions', (payload: FplSquadImport) => { payload.picks[1].lineupPosition = payload.picks[0].lineupPosition; }],
    ['missing captain', (payload: FplSquadImport) => { payload.picks[0].isCaptain = false; }],
    ['invalid money', (payload: FplSquadImport) => { payload.transfers.bank = -1; }],
  ])('rejects %s', (_name, mutate) => {
    const payload = validImport();
    mutate(payload);
    expect(() => parseFplSquadImport(payload)).toThrow(FplSquadImportValidationError);
  });

  it('rejects unexpected fields so secrets cannot enter the contract', () => {
    const payload = { ...validImport(), accessToken: 'must-not-pass' };
    expect(() => parseFplSquadImport(payload)).toThrow('fields do not match schema');
  });

  it('rejects unexpected fields inside player records', () => {
    const payload = validImport() as FplSquadImport & { picks: Array<FplSquadImport['picks'][number] & { email?: string }> };
    payload.picks[0].email = 'private@example.com';
    expect(() => parseFplSquadImport(payload)).toThrow('fields do not match schema');
  });
});
