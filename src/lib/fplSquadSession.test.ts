import { beforeEach, describe, expect, it } from 'vitest';
import type { FplSquadImport } from './fplSquadImport';
import {
  clearConfirmedFplSquad,
  CONFIRMED_FPL_SQUAD_SESSION_KEY,
  readConfirmedFplSquad,
  saveConfirmedFplSquad,
} from './fplSquadSession';

const payload: FplSquadImport = {
  schemaVersion: 1,
  source: 'fpl-authenticated-my-team',
  entryId: 3_376_378,
  capturedAt: new Date().toISOString(),
  activeChip: null,
  picks: Array.from({ length: 15 }, (_, index) => ({
    elementId: index + 1, lineupPosition: index + 1, sellingPrice: 50, purchasePrice: 50,
    multiplier: index < 11 ? (index === 0 ? 2 : 1) : 0, isCaptain: index === 0, isViceCaptain: index === 1,
  })),
  transfers: { bank: 15, squadValue: 1_015, freeTransfers: null, transfersMade: 0, transferCost: 0, status: 'unlimited' },
};

beforeEach(() => sessionStorage.clear());

describe('confirmed squad tab session', () => {
  it('round-trips a validated squad and can clear it', () => {
    saveConfirmedFplSquad(payload);
    expect(readConfirmedFplSquad()).toEqual(payload);
    clearConfirmedFplSquad();
    expect(readConfirmedFplSquad()).toBeNull();
  });

  it('removes corrupted session data', () => {
    sessionStorage.setItem(CONFIRMED_FPL_SQUAD_SESSION_KEY, 'not-valid');
    expect(readConfirmedFplSquad()).toBeNull();
    expect(sessionStorage.getItem(CONFIRMED_FPL_SQUAD_SESSION_KEY)).toBeNull();
  });
});
