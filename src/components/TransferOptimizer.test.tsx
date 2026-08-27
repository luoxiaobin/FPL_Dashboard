import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import type { PlanningScenario } from '@/server/planning/types';
import TransferOptimizer from './TransferOptimizer';

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

const scenario = (transfers: PlanningScenario['transfers']): PlanningScenario => ({
  strategy: 'balanced',
  label: 'Balanced',
  transfers,
  transferHit: 0,
  squad: [],
  startingEleven: [],
  bench: [],
  captainId: 3,
  viceCaptainId: 4,
  chip: null,
  bankRemaining: 0.9,
  projectedGameweekPoints: 30.6,
  projectedFiveGameweekPoints: 312.2,
  uncertainty: 0.11,
  tradeoff: 'Maximizes the base five-Gameweek projection under current assumptions.',
  modelVersion: 'fpl-internal-v2',
});

const payload = (transfers: PlanningScenario['transfers']) => ({
  gameweek: 2,
  capturedAt: '2026-08-27T04:00:00.000Z',
  squadSource: 'public-gameweek',
  squadGameweek: 1,
  scenarios: [scenario(transfers)],
  players: {
    '1': { id: 1, name: 'Muñoz' },
    '2': { id: 2, name: 'De Cuyper' },
  },
});

function mockResponse(body: unknown, ok = true) {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok,
    json: () => Promise.resolve(body),
  } as Response);
}

describe('TransferOptimizer planning recommendation', () => {
  it('uses the shared Planning scenarios endpoint', async () => {
    mockResponse(payload([{ outPlayerId: 1, inPlayerId: 2, cost: 0.4, expectedGain: 8.3 }]));
    render(<TransferOptimizer />);

    await waitFor(() => expect(screen.getByText('Make the move')).toBeTruthy());
    expect(global.fetch).toHaveBeenCalledWith('/api/v1/planning/scenarios', expect.objectContaining({
      method: 'POST',
    }));
  });

  it('shows the recommended transfer and supporting metrics', async () => {
    mockResponse(payload([{ outPlayerId: 1, inPlayerId: 2, cost: 0.4, expectedGain: 8.3 }]));
    render(<TransferOptimizer />);

    await waitFor(() => expect(screen.getByText('Muñoz')).toBeTruthy());
    expect(screen.getByText('De Cuyper')).toBeTruthy();
    expect(screen.getByText('+8.3 pts')).toBeTruthy();
    expect(screen.getByText('312.2 pts')).toBeTruthy();
    expect(screen.getByText('Using your published GW1 squad', { exact: false })).toBeTruthy();
  });

  it('explains a hold recommendation instead of claiming the squad is optimal', async () => {
    mockResponse(payload([]));
    render(<TransferOptimizer />);

    await waitFor(() => expect(screen.getByText('Roll the transfer')).toBeTruthy());
    expect(screen.getByText('Hold is the recommendation—not an empty result')).toBeTruthy();
    expect(screen.queryByText(/squad is looking optimal/i)).toBeNull();
  });

  it('shows a recoverable error instead of silently hiding the widget', async () => {
    mockResponse({ error: 'Unable to generate planning scenarios right now.' }, false);
    render(<TransferOptimizer />);

    await waitFor(() => expect(screen.getByRole('alert')).toBeTruthy());
    expect(screen.getByText('Unable to generate planning scenarios right now.')).toBeTruthy();
    expect(screen.getByText('Open Planning to retry')).toBeTruthy();
  });
});
