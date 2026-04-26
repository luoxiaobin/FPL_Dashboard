import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import SquadPitch from './SquadPitch';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const makePlayer = (overrides = {}) => ({
  id: 1, name: 'Raya', position: 'GKP', official_pos: 1,
  multiplier: 1, live_points: 0, bps: 0, bonus: 0,
  is_captain: false, is_vice_captain: false, minutes: 0,
  status: 'a', price: 6.0, is_finished: false,
  was_started: true, photo: '12345', teamCode: 3, clubForm: '',
  ...overrides,
});

const mockSquadWith = (players: object[]) =>
  vi.spyOn(global, 'fetch').mockResolvedValue({
    json: () => Promise.resolve({
      gameweek: 30, status: 'live',
      players, projected_points: 0,
    }),
  } as Response);

describe('SquadPitch — unplayed game indicator', () => {
  it('shows — for a starter whose game has not started (0 mins, not finished)', async () => {
    mockSquadWith([makePlayer({ id: 1, was_started: true, minutes: 0, is_finished: false, live_points: 0 })]);
    render(<SquadPitch />);
    await waitFor(() => expect(screen.getByText('—')).toBeTruthy());
  });

  it('shows 0 for a player whose game is finished with 0 points', async () => {
    mockSquadWith([makePlayer({ id: 1, was_started: true, minutes: 0, is_finished: true, live_points: 0 })]);
    render(<SquadPitch />);
    await waitFor(() => {
      const pts = document.querySelector('[data-testid="player-points"]');
      expect(pts?.textContent).toBe('0');
    });
  });

  it('shows actual points for a player who has played', async () => {
    mockSquadWith([makePlayer({ id: 1, was_started: true, minutes: 90, is_finished: true, live_points: 8 })]);
    render(<SquadPitch />);
    await waitFor(() => {
      const pts = document.querySelector('[data-testid="player-points"]');
      expect(pts?.textContent).toBe('8');
    });
  });

  it('shows — for a player in progress with 0 points so far', async () => {
    mockSquadWith([makePlayer({ id: 1, was_started: true, minutes: 0, is_finished: false, live_points: 0 })]);
    render(<SquadPitch />);
    await waitFor(() => {
      const pts = document.querySelector('[data-testid="player-points"]');
      expect(pts?.textContent).toBe('—');
    });
  });

  it('doubles captain points when game is finished', async () => {
    mockSquadWith([makePlayer({ id: 1, was_started: true, minutes: 90, is_finished: true, live_points: 7, is_captain: true, multiplier: 2 })]);
    render(<SquadPitch />);
    await waitFor(() => {
      const pts = document.querySelector('[data-testid="player-points"]');
      expect(pts?.textContent).toBe('14');
    });
  });
});
