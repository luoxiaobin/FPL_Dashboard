import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlanningWorkspace from './PlanningWorkspace';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const scenario = (strategy: 'floor' | 'balanced' | 'upside', captainId: number) => ({
  strategy,
  label: strategy[0].toUpperCase() + strategy.slice(1),
  transfers: [], transferHit: 0, squad: Array.from({ length: 15 }, (_, index) => index + 1),
  startingEleven: Array.from({ length: 11 }, (_, index) => index + 1),
  bench: [12, 13, 14, 15], captainId, viceCaptainId: 2, chip: null,
  bankRemaining: 1.5, projectedGameweekPoints: 55, projectedFiveGameweekPoints: 250,
  uncertainty: 0.12, tradeoff: `${strategy} tradeoff`, modelVersion: 'test-v1',
});

const payload = {
  gameweek: 1,
  deadline: '2026-08-21T17:30:00Z',
  capturedAt: '2026-08-17T12:00:00Z',
  freshUntil: '2026-08-17T12:05:00Z',
  scenarios: [scenario('floor', 1), scenario('balanced', 2), scenario('upside', 3)],
  players: Object.fromEntries(Array.from({ length: 15 }, (_, index) => {
    const id = index + 1;
    return [String(id), { id, name: `Player ${id}`, position: 3, teamId: id, price: 5,
      expectedTotal: 20, floor: 14, ceiling: 26, uncertainty: 0.1 }];
  })),
};

let storage: Record<string, string>;
beforeEach(() => {
  storage = {};
  Object.defineProperty(window, 'localStorage', {
    configurable: true,
    value: {
      getItem: (key: string) => storage[key] ?? null,
      setItem: (key: string, value: string) => { storage[key] = value; },
      removeItem: (key: string) => { delete storage[key]; },
      clear: () => { storage = {}; },
    },
  });
});

afterEach(() => {
  cleanup();
  window.localStorage.clear();
  vi.restoreAllMocks();
});

describe('PlanningWorkspace', () => {
  it('loads and switches between complete scenarios', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => payload } as Response);
    render(<PlanningWorkspace />);
    await waitFor(() => expect(screen.getByRole('button', { name: /Upside/i })).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Upside/i }));
    expect(screen.getByRole('heading', { name: 'Upside' })).toBeTruthy();
    expect(screen.getAllByText('Player 3').length).toBeGreaterThan(0);
  });

  it('stores an explicit My Plan snapshot', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({ ok: true, status: 200, json: async () => payload } as Response);
    render(<PlanningWorkspace />);
    const save = await screen.findByRole('button', { name: 'Mark as My Plan' });
    fireEvent.click(save);
    const stored = JSON.parse(window.localStorage.getItem('fpl-plan-gw-1') ?? '{}');
    expect(stored.scenario.strategy).toBe('balanced');
    expect(screen.getByRole('button', { name: 'Saved as My Plan' })).toBeTruthy();
  });
});
