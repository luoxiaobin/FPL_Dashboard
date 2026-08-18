import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { encodeFplSquadImport, type FplSquadImport } from '@/lib/fplSquadImport';
import FplSquadImportPage from './page';
import { readConfirmedFplSquad } from '@/lib/fplSquadSession';

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  sessionStorage.clear();
  window.history.replaceState(null, '', '/');
});

const payload: FplSquadImport = {
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
  transfers: { bank: 10, squadValue: 1_005, freeTransfers: null, transfersMade: 0, transferCost: 0, status: 'unlimited' },
};

describe('FPL squad import setup', () => {
  it('offers a complete bookmark code and Safari installation instructions', async () => {
    window.history.replaceState(null, '', '/planning/import');
    render(<FplSquadImportPage />);
    const button = screen.getByRole('button', { name: 'Copy complete bookmark code' });
    await waitFor(() => expect((button as HTMLButtonElement).disabled).toBe(false));
    expect(screen.getByText(/Bookmarks → Edit Bookmarks/)).toBeTruthy();
  });

  it('validates transported data and immediately clears the URL fragment', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => ({
      ok: true,
      json: async () => ({ players: Array.from({ length: 15 }, (_, index) => ({
        id: index + 101,
        name: `Player ${index + 1}`,
        teamId: (index % 5) + 1,
        teamName: `Club ${(index % 5) + 1}`,
        position: index === 0 || index === 11 ? 'GKP' : index < 6 ? 'DEF' : index < 11 ? 'MID' : 'FWD',
      })) }),
    })));
    window.history.replaceState(null, '', `/planning/import#data=${encodeFplSquadImport(payload)}`);
    render(<FplSquadImportPage />);
    expect(await screen.findByText('Complete squad transport passed')).toBeTruthy();
    expect(screen.getByText('3376378')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
    expect(window.location.hash).toBe('');
    expect(await screen.findByText('Player 1')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Confirm this squad' }));
    expect(screen.getByText('Squad confirmed for this tab')).toBeTruthy();
    expect(readConfirmedFplSquad()?.entryId).toBe(3_376_378);
    expect(screen.getByRole('link', { name: /Continue to Planning/ })).toBeTruthy();
  });
});
