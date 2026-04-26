import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, cleanup, waitFor } from '@testing-library/react';
import SettingsPage from './page';

afterEach(() => cleanup());

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

const mockPrefsResponse = {
  preferences: {
    captaincyAdviser: true,
    rankProjection: true,
    historyChart: true,
    gameweekHistory: true,
    fixtureTicker: true,
    transferAnalyser: true,
    transferOptimizer: true,
    squadPitch: true,
    livePoints: true,
    leagueStandings: true,
  },
  planning_panel_order: ['livePoints', 'squadPitch'],
  live_panel_order: ['squadPitch', 'livePoints'],
};

function mockFetch(response = mockPrefsResponse) {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(response),
  } as Response);
}

describe('SettingsPage — reorder UI', () => {
  it('renders Planning tab selected by default', async () => {
    mockFetch();
    render(<SettingsPage />);
    await waitFor(() => screen.getByRole('tab', { name: 'Planning' }));
    expect(screen.getByRole('tab', { name: 'Planning' }).getAttribute('aria-selected')).toBe('true');
  });

  it('switches to Live tab on click and sets aria-selected', async () => {
    mockFetch();
    render(<SettingsPage />);
    await waitFor(() => screen.getByRole('tab', { name: 'Live' }));
    fireEvent.click(screen.getByRole('tab', { name: 'Live' }));
    expect(screen.getByRole('tab', { name: 'Live' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Planning' }).getAttribute('aria-selected')).toBe('false');
  });

  it('renders up/down buttons for each panel in the order list', async () => {
    mockFetch();
    render(<SettingsPage />);
    await waitFor(() => screen.getByRole('tab', { name: 'Planning' }));
    const upButtons = screen.getAllByLabelText(/move .* up/i);
    expect(upButtons.length).toBeGreaterThan(0);
  });

  it('first panel up button is disabled', async () => {
    mockFetch();
    render(<SettingsPage />);
    await waitFor(() => screen.getByRole('tab', { name: 'Planning' }));
    const upButtons = screen.getAllByLabelText(/move .* up/i);
    expect((upButtons[0] as HTMLButtonElement).disabled).toBe(true);
  });

  it('last panel down button is disabled', async () => {
    mockFetch();
    render(<SettingsPage />);
    await waitFor(() => screen.getByRole('tab', { name: 'Planning' }));
    const downButtons = screen.getAllByLabelText(/move .* down/i);
    expect((downButtons[downButtons.length - 1] as HTMLButtonElement).disabled).toBe(true);
  });
});
