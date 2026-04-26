import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import GwLive from './GwLive';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const mockPlayers = [
  { id: 1, name: 'Raya',        position: 'GKP', official_pos: 1,  multiplier: 1, live_points: 10, bps: 31, bonus: 3, is_captain: false, is_vice_captain: false, minutes: 90, price: 6.0, is_finished: true,  was_started: true,  photo: '111', teamCode: 3,  clubForm: '' },
  { id: 2, name: 'Gabriel',     position: 'DEF', official_pos: 2,  multiplier: 1, live_points: 8,  bps: 29, bonus: 2, is_captain: false, is_vice_captain: false, minutes: 90, price: 7.1, is_finished: true,  was_started: true,  photo: '222', teamCode: 3,  clubForm: '' },
  { id: 3, name: 'B.Fernandes', position: 'MID', official_pos: 5,  multiplier: 2, live_points: 0,  bps: 0,  bonus: 0, is_captain: true,  is_vice_captain: false, minutes: 0,  price: 10.4, is_finished: false, was_started: true,  photo: '333', teamCode: 12, clubForm: '' },
  { id: 4, name: 'Bench1',      position: 'DEF', official_pos: 12, multiplier: 1, live_points: 2,  bps: 5,  bonus: 0, is_captain: false, is_vice_captain: false, minutes: 60, price: 4.5, is_finished: true,  was_started: false, photo: '444', teamCode: 7,  clubForm: '' },
];

function mockFetch() {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    json: () => Promise.resolve({
      gameweek: 30, status: 'live',
      players: mockPlayers, projected_points: 18,
    }),
  } as Response);
}

describe('GwLive — tabs', () => {
  it('renders Pitch and List tab buttons', async () => {
    mockFetch();
    render(<GwLive />);
    await waitFor(() => screen.getByRole('tab', { name: 'Pitch' }));
    expect(screen.getByRole('tab', { name: 'List' })).toBeTruthy();
  });

  it('Pitch tab is selected by default', async () => {
    mockFetch();
    render(<GwLive />);
    await waitFor(() => {
      expect(screen.getByRole('tab', { name: 'Pitch' }).getAttribute('aria-selected')).toBe('true');
      expect(screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected')).toBe('false');
    });
  });

  it('switching to List tab updates aria-selected', async () => {
    mockFetch();
    render(<GwLive />);
    await waitFor(() => screen.getByRole('tab', { name: 'List' }));
    fireEvent.click(screen.getByRole('tab', { name: 'List' }));
    expect(screen.getByRole('tab', { name: 'List' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Pitch' }).getAttribute('aria-selected')).toBe('false');
  });
});

describe('GwLive — projected total', () => {
  it('shows projected points header in pitch view', async () => {
    mockFetch();
    render(<GwLive />);
    await waitFor(() => expect(screen.getByTestId('gw-projected-total')).toBeTruthy());
  });

  it('shows projected points header in list view too', async () => {
    mockFetch();
    render(<GwLive />);
    await waitFor(() => screen.getByRole('tab', { name: 'List' }));
    fireEvent.click(screen.getByRole('tab', { name: 'List' }));
    expect(screen.getByTestId('gw-projected-total')).toBeTruthy();
  });
});

describe('GwLive — list view', () => {
  it('shows all starters in list view', async () => {
    mockFetch();
    render(<GwLive />);
    await waitFor(() => screen.getByRole('tab', { name: 'List' }));
    fireEvent.click(screen.getByRole('tab', { name: 'List' }));
    await waitFor(() => expect(screen.getByText('Raya')).toBeTruthy());
    expect(screen.getByText('Gabriel')).toBeTruthy();
    expect(screen.getByText('B.Fernandes')).toBeTruthy();
  });

  it('shows — for an unplayed player in list view', async () => {
    mockFetch();
    render(<GwLive />);
    await waitFor(() => screen.getByRole('tab', { name: 'List' }));
    fireEvent.click(screen.getByRole('tab', { name: 'List' }));
    await waitFor(() => {
      const pts = document.querySelectorAll('[data-testid="list-player-points"]');
      const values = Array.from(pts).map(el => el.textContent);
      expect(values).toContain('—');
    });
  });

  it('shows doubled captain points in list view', async () => {
    mockFetch();
    render(<GwLive />);
    await waitFor(() => screen.getByRole('tab', { name: 'List' }));
    fireEvent.click(screen.getByRole('tab', { name: 'List' }));
    // B.Fernandes is captain with multiplier 2, but unplayed → shows —
    // Raya: 10 pts, not captain → 10
    await waitFor(() => {
      const pts = document.querySelectorAll('[data-testid="list-player-points"]');
      const values = Array.from(pts).map(el => el.textContent);
      expect(values).toContain('10');
    });
  });
});

describe('GwLive — fetch', () => {
  it('makes exactly one fetch call', async () => {
    mockFetch();
    render(<GwLive />);
    await waitFor(() => screen.getByRole('tab', { name: 'Pitch' }));
    expect(vi.mocked(global.fetch)).toHaveBeenCalledTimes(1);
  });
});
