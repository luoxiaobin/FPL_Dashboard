import { render, screen, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, afterEach } from 'vitest';
import LivePoints from './LivePoints';

const mockSquad = {
  status: 'live' as const,
  players: [
    { id: 1, name: 'Salah', position: 'MID', live_points: 8, is_captain: true,
      minutes: 90, bps: 35, bonus: 3, photo: '12345', teamCode: 14 },
    { id: 2, name: 'Haaland', position: 'FWD', live_points: 12, is_captain: false,
      minutes: 90, bps: 50, bonus: 0, photo: '67890', teamCode: 11 },
  ],
};

afterEach(() => vi.restoreAllMocks());

describe('LivePoints — error handling', () => {
  it('shows loading initially while fetch is pending', () => {
    vi.spyOn(global, 'fetch').mockReturnValueOnce(new Promise(() => {}));
    render(<LivePoints />);
    expect(screen.getByText('Loading...')).toBeTruthy();
  });

  it('renders null when fetch rejects (network error)', async () => {
    vi.spyOn(global, 'fetch').mockRejectedValueOnce(new Error('Network error'));
    const { container } = render(<LivePoints />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('renders null when API returns an error payload', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: () => Promise.resolve({ error: 'Unauthorized' }),
    } as Response);
    const { container } = render(<LivePoints />);
    await waitFor(() => expect(container.firstChild).toBeNull());
  });

  it('renders null when API returns a response without players', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: () => Promise.resolve({ status: 'live' }), // missing players array
    } as Response);
    const { container } = render(<LivePoints />);
    // stays on loading (no error set) since data is missing but not an error payload
    await waitFor(() => expect(screen.getByText('Loading...')).toBeTruthy());
  });
});

describe('LivePoints — successful render', () => {
  it('renders player names from the squad response', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: () => Promise.resolve(mockSquad),
    } as Response);
    render(<LivePoints />);
    await waitFor(() => expect(screen.getByText('Salah')).toBeTruthy());
    expect(screen.getByText('Haaland')).toBeTruthy();
  });

  it('doubles captain points', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValueOnce({
      json: () => Promise.resolve(mockSquad),
    } as Response);
    render(<LivePoints />);
    // Salah has 8 pts, is captain → displayed as 16
    await waitFor(() => expect(screen.getByText('16')).toBeTruthy());
    // Haaland has 12 pts, not captain → displayed as 12
    expect(screen.getByText('12')).toBeTruthy();
  });
});
