import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import FixtureTicker from './FixtureTicker';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const mockData = {
  gameweek: 30,
  players: [
    {
      id: 1, name: 'Salah', photo: '118748', teamCode: 14, club: 'LIV',
      clubForm: 'WW', teamShort: 'LIV', teamForm: '5.0', role: 'MID',
      status: null, chance: null, position: 1,
      fixtures: [{ gw: 31, opponent: 'BHA', difficulty: 2, home: true }],
    },
  ],
  nextGWs: [31, 32, 33, 34, 35],
};

describe('FixtureTicker — scroll wrapper', () => {
  it('shows loading text initially', () => {
    vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}));
    render(<FixtureTicker />);
    expect(screen.getByText('Loading fixture ticker...')).toBeTruthy();
  });

  it('renders scroll wrapper element when data is loaded', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve(mockData),
    } as Response);
    render(<FixtureTicker />);
    await waitFor(() =>
      expect(screen.getByTestId('fixture-scroll-wrapper')).toBeTruthy()
    );
  });

  it('scroll wrapper contains the table', async () => {
    vi.spyOn(global, 'fetch').mockResolvedValue({
      json: () => Promise.resolve(mockData),
    } as Response);
    render(<FixtureTicker />);
    await waitFor(() => {
      const wrapper = screen.getByTestId('fixture-scroll-wrapper');
      expect(wrapper.querySelector('table')).toBeTruthy();
    });
  });
});
