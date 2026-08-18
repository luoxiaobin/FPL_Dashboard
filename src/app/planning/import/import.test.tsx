import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import { encodeFplSquadImport, type FplSquadImport } from '@/lib/fplSquadImport';
import FplSquadImportPage from './page';

afterEach(() => {
  cleanup();
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
    window.history.replaceState(null, '', `/planning/import#data=${encodeFplSquadImport(payload)}`);
    render(<FplSquadImportPage />);
    expect(await screen.findByText('Complete squad transport passed')).toBeTruthy();
    expect(screen.getByText('3376378')).toBeTruthy();
    expect(screen.getByText('15')).toBeTruthy();
    expect(window.location.hash).toBe('');
  });
});
