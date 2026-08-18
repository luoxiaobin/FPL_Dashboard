import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, waitFor } from '@testing-library/react';
import DashboardShell from './page';

const replace = vi.fn();

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn(), replace }),
}));

vi.mock('@/hooks/useGwMode', () => ({
  useGwMode: () => 'planning',
  getStoredModeOverride: () => null,
  setStoredModeOverride: vi.fn(),
}));

vi.mock('../components/GwLive', () => ({ default: () => null }));
vi.mock('../components/LeagueStandings', () => ({ default: () => null }));
vi.mock('../components/LeagueLive', () => ({ default: () => null }));
vi.mock('../components/HistoryChart', () => ({ default: () => null }));
vi.mock('../components/GameweekHistory', () => ({ default: () => null }));
vi.mock('../components/SyncStatus', () => ({ default: () => null }));
vi.mock('../components/RankProjection', () => ({ default: () => null }));
vi.mock('../components/FixtureTicker', () => ({ default: () => null }));
vi.mock('../components/TransferAnalyser', () => ({ default: () => null }));
vi.mock('../components/CaptaincyAdviser', () => ({ default: () => null }));
vi.mock('../components/TransferOptimizer', () => ({ default: () => null }));
vi.mock('../components/GwModeIndicator', () => ({ default: () => null }));

afterEach(() => {
  cleanup();
  replace.mockReset();
  vi.restoreAllMocks();
});

describe('DashboardShell authentication gate', () => {
  it('redirects without mounting authenticated widget requests', async () => {
    const fetchMock = vi.spyOn(global, 'fetch').mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Unauthorized' }),
    } as Response);

    render(<DashboardShell />);

    await waitFor(() => expect(replace).toHaveBeenCalledWith('/login'));
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/user/summary', expect.any(Object));
    expect(screen.getByText('Loading dashboard…')).toBeTruthy();
  });

  it('loads authenticated resources only after the summary succeeds', async () => {
    const fetchMock = vi.spyOn(global, 'fetch')
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({
          manager_name: 'Test Manager', team_name: 'Test Team', overall_rank: 1,
          total_players: 10, bank_balance: 1, total_value: 100, transfers_available: 1,
        }),
      } as Response)
      .mockResolvedValue({ ok: true, status: 200, json: async () => ({}) } as Response);

    render(<DashboardShell />);

    await screen.findByText('FPL Manager: Test Manager');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/v1/user/summary');
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/v1/squad/live')).toBe(true);
    expect(fetchMock.mock.calls.some(([url]) => url === '/api/v1/user/preferences')).toBe(true);
  });
});
