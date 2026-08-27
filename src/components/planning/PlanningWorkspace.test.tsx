import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import PlanningWorkspace from './PlanningWorkspace';

vi.mock('next/navigation', () => ({ useRouter: () => ({ push: vi.fn() }) }));

const scenario = (strategy: 'floor' | 'balanced' | 'upside', captainId: number) => ({
  scenarioId: `${strategy === 'floor' ? '11111111' : strategy === 'balanced' ? '22222222' : '33333333'}-2222-4222-8222-222222222222`,
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
  squadSource: 'public-gameweek',
  squadGameweek: 1,
  sourceCapturedAt: '2026-08-17T12:00:00Z',
  transferState: { freeTransfers: 1, unlimited: false },
  reproducibility: 'persisted',
  scenarios: [scenario('floor', 1), scenario('balanced', 2), scenario('upside', 3)],
  players: Object.fromEntries(Array.from({ length: 15 }, (_, index) => {
    const id = index + 1;
    return [String(id), { id, name: `Player ${id}`, position: 3, teamId: id, price: 5,
      expectedTotal: 20, floor: 14, ceiling: 26, uncertainty: 0.1 }];
  })),
};

let storage: Record<string, string>;
beforeEach(() => {
  sessionStorage.clear();
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
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async (input, init) => {
      if (String(input) === '/api/v1/planning/plans' && init?.method === 'POST') {
        return { ok: true, status: 200, json: async () => ({ plan: { strategy: 'balanced', selectedAt: '2026-08-27T12:00:00Z', frozenAt: null, outcome: null } }) } as Response;
      }
      if (String(input).startsWith('/api/v1/planning/plans?')) {
        return { ok: true, status: 200, json: async () => ({ plan: null }) } as Response;
      }
      return { ok: true, status: 200, json: async () => payload } as Response;
    });
    render(<PlanningWorkspace />);
    const save = await screen.findByRole('button', { name: 'Mark as My Plan' });
    fireEvent.click(save);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Saved as My Plan' })).toBeTruthy());
    const saveRequest = fetchMock.mock.calls.find(([input, init]) => String(input) === '/api/v1/planning/plans' && init?.method === 'POST');
    expect(JSON.parse(String(saveRequest?.[1]?.body)).scenarioId).toBe(payload.scenarios[1].scenarioId);
  });

  it('uses the server-confirmed squad without resending it from browser storage', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ...payload, squadSource: 'authenticated-import', transferState: { freeTransfers: null, unlimited: true } }),
    } as Response);
    render(<PlanningWorkspace />);
    await screen.findByText('Confirmed squad connected');
    const request = JSON.parse(String(fetchMock.mock.calls[0][1]?.body));
    expect(request).not.toHaveProperty('importedSquad');
    expect(request.constraints).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Clear saved squad' }));
    expect(await screen.findByText(/Saved squad cleared/)).toBeTruthy();
  });

  it('renders a safe placeholder instead of crashing on an invalid numeric metric', async () => {
    vi.spyOn(global, 'fetch').mockImplementation(async (input) => {
      if (String(input).startsWith('/api/v1/planning/plans?')) {
        return { ok: true, status: 200, json: async () => ({ plan: null }) } as Response;
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          ...payload,
          scenarios: payload.scenarios.map((item, index) => index === 0
            ? { ...item, bankRemaining: null }
            : item),
        }),
      } as Response;
    });
    render(<PlanningWorkspace />);
    fireEvent.click(await screen.findByRole('button', { name: /Floor/i }));
    expect(screen.getByText('£—m')).toBeTruthy();
  });
});
