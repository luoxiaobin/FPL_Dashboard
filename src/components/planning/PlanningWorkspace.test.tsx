import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import PlanningWorkspace from './PlanningWorkspaceV2';

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
        return { ok: true, status: 200, json: async () => ({ plan: { scenarioId: payload.scenarios[1].scenarioId, strategy: 'balanced', selectedAt: '2026-08-27T12:00:00Z', frozenAt: null, outcome: null } }) } as Response;
      }
      if (String(input) === '/api/v1/planning/plans') {
        return { ok: true, status: 200, json: async () => ({ plan: null }) } as Response;
      }
      return { ok: true, status: 200, json: async () => payload } as Response;
    });
    render(<PlanningWorkspace />);
    const save = await screen.findByRole('button', { name: 'Mark as My Plan' });
    fireEvent.click(save);
    await waitFor(() => expect(screen.getByRole('button', { name: 'Saved as My Plan' })).toBeTruthy());
    const explain = screen.getByRole('button', { name: 'Explain this plan' });
    const attribution = screen.getByText('Powered by Claude Sonnet 5.5');
    expect(explain.getAttribute('aria-describedby')).toBe(attribution.id);
    fetchMock.mockResolvedValueOnce({ ok: true, json: async () => ({ explanation: 'The lineup uses this week’s projections.' }) } as Response);
    fireEvent.click(explain);
    await screen.findByRole('heading', { name: 'Plan explanation' });
    expect(screen.getByText('Powered by Claude Sonnet 5.5')).toBeTruthy();
    const saveRequest = fetchMock.mock.calls.find(([input, init]) => String(input) === '/api/v1/planning/plans' && init?.method === 'POST');
    expect(JSON.parse(String(saveRequest?.[1]?.body)).scenarioId).toBe(payload.scenarios[1].scenarioId);
  });

  it.each([
    { transfers: true, hit: 0, closed: false },
    { transfers: false, hit: 0, closed: false },
    { transfers: true, hit: 4, closed: false },
    { transfers: true, hit: 0, closed: true },
  ])('reviews the saved plan ($transfers transfers, $hit hit, $closed closed)', async ({ transfers, hit, closed }) => {
    const plan = {
      id: 'saved-plan',
      scenarioId: payload.scenarios[1].scenarioId,
      strategy: 'balanced',
      gameweek: 1,
      selectedAt: '2026-08-20T12:00:00Z',
      frozenAt: null,
      outcome: null,
      playerNames: { '1': 'Saved outgoing', '2': 'Saved captain', '3': 'Saved incoming' },
      decisions: {
        ...payload.scenarios[1],
        deadline: new Date(Date.now() + (closed ? -60_000 : 60_000)).toISOString(),
        transferHit: hit,
        transfers: transfers ? [{ outPlayerId: 1, inPlayerId: 3 }] : [],
      },
    };
    vi.spyOn(global, 'fetch').mockImplementation(async input => ({
      ok: true,
      status: 200,
      json: async () => String(input) === '/api/v1/planning/plans' ? { plan } : payload,
    }) as Response);
    const writeText = vi.fn().mockResolvedValue(undefined);
    vi.stubGlobal('navigator', Object.assign(Object.create(window.navigator), { clipboard: { writeText } }));
    try {
      render(<PlanningWorkspace />);
      fireEvent.click(await screen.findByRole('button', { name: /Upside/i }));
      fireEvent.click(await screen.findByText('Review on FPL'));
      const review = within(screen.getByRole('region', { name: 'My Plan' }));
      expect(review.getByRole('heading', { name: 'GW1 · Balanced' })).toBeTruthy();
      expect(review.getByText('Captain: Saved captain')).toBeTruthy();
      expect(review.getByText(transfers ? 'Saved outgoing → Saved incoming' : 'No transfers planned')).toBeTruthy();
      expect(review.getByText(hit ? 'Expected hit: −4 pts' : 'No points hit expected', { exact: false })).toBeTruthy();
      expect(review.queryByRole('link', { name: 'Open Transfers' })?.getAttribute('href'))
        .toBe(transfers && !closed ? 'https://fantasy.premierleague.com/transfers' : undefined);
      expect(review.queryByRole('link', { name: 'Open Pick Team' })?.getAttribute('href'))
        .toBe(closed ? undefined : 'https://fantasy.premierleague.com/my-team');
      if (closed) expect(review.getByText(/Gameweek closed/)).toBeTruthy();
      fireEvent.click(review.getByRole('button', { name: 'Copy checklist' }));
      await review.findByText('Checklist copied.');
      expect(writeText).toHaveBeenCalledWith(expect.stringContaining('Captain: Saved captain'));
      expect(writeText.mock.calls[0][0]).not.toContain('250');
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('checks a fresh FPL squad against the saved transfer and reports lineup differences', async () => {
    const saved = payload.scenarios[1];
    const plan = {
      id: 'verification-plan',
      scenarioId: saved.scenarioId,
      strategy: 'balanced',
      gameweek: 1,
      selectedAt: new Date(Date.now() - 60_000).toISOString(),
      frozenAt: null,
      playerNames: { '1': 'Incoming', '16': 'Outgoing' },
      decisions: {
        ...saved,
        viceCaptainId: 3,
        deadline: new Date(Date.now() + 60_000).toISOString(),
        transfers: [{ outPlayerId: 16, inPlayerId: 1 }],
      },
    };
    const picks = [...saved.startingEleven, 15, 12, 13, 14].map((elementId, index) => ({
      elementId, lineupPosition: index + 1, isCaptain: elementId === 1, isViceCaptain: elementId === 3,
    }));
    let capturedAt = new Date(Date.now() - 120_000).toISOString();
    vi.spyOn(global, 'fetch').mockImplementation(async input => ({
      ok: true,
      json: async () => {
        if (String(input) === '/api/v1/planning/plans') return { plan };
        if (String(input) === '/api/v1/planning/import') return { capturedAt, picks };
        return payload;
      },
    }) as Response);
    render(<PlanningWorkspace />);
    fireEvent.click(await screen.findByText('Review on FPL'));
    const verification = within(screen.getByRole('region', { name: 'FPL verification' }));
    await verification.findByText(/Refresh your squad from FPL Pick Team/);
    expect(verification.queryByText(/Squad reflects transfer/)).toBeNull();
    capturedAt = new Date().toISOString();
    fireEvent.click(verification.getByRole('button', { name: 'Check latest sync' }));
    await verification.findByText('Outgoing → Incoming · Squad reflects transfer');
    expect(verification.getByText('Squad · Matches plan')).toBeTruthy();
    expect(verification.getByText('Starting XI · Matches plan')).toBeTruthy();
    expect(verification.getByText('Captain · Pending')).toBeTruthy();
    expect(verification.getByText('Vice captain · Matches plan')).toBeTruthy();
    expect(verification.getByText('Bench order · Matches plan')).toBeTruthy();
  });

  it('shows sourced Haiku news for relevant players and rechecks the existing batch on focus', async () => {
    const endpoint = '/api/v1/planning/team-news?deadline=';
    let batch: unknown = null;
    const fetchMock = vi.spyOn(global, 'fetch').mockImplementation(async input => ({
      ok: true,
      json: async () => {
        if (String(input).startsWith(endpoint)) return { batch };
        if (String(input) === '/api/v1/planning/plans') return { plan: null };
        return payload;
      },
    }) as Response);
    render(<PlanningWorkspace />);
    const news = within(await screen.findByRole('region', { name: 'GW1 Team News' }));
    await news.findByText(/No curated batch/);
    batch = {
      processed_at: '2026-08-20T13:00:00Z',
      model_name: 'Claude Haiku 5.5',
      signals: [
        { playerId: 1, signal: 'managed_minutes',
          evidence: [{ url: 'https://club.example/news', publishedAt: '2026-08-20T12:00:00Z', quote: 'We will manage his minutes.' }] },
        { playerId: 200, signal: 'out', evidence: [] },
      ],
    };
    fireEvent.focus(window);
    await news.findByText('Player 1 · Minutes may be managed');
    expect(news.getByText('Powered by Claude Haiku 5.5')).toBeTruthy();
    expect(news.getByRole('link', { name: 'View source' }).getAttribute('href')).toBe('https://club.example/news');
    expect(news.queryByText(/Ruled out/)).toBeNull();
    expect(fetchMock.mock.calls.filter(([input]) => String(input).startsWith(endpoint))).toHaveLength(2);
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
      if (String(input) === '/api/v1/planning/plans') {
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
