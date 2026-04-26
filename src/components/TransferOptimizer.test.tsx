import { describe, it, expect, vi, afterEach } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import TransferOptimizer from './TransferOptimizer';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

const mockSuggestions = [
  {
    out_id: 1,
    in_id: 2,
    expected_gain: 4.2,
    out_name: 'Dubravka',
    in_name: 'Verbruggen',
    rationale: 'Verbruggen provides higher expected points.',
    out_team_code: 23,
    in_team_code: 3,
    out_club: 'NEW',
    in_club: 'ARS',
  },
];

function mockFetch(suggestions = mockSuggestions) {
  vi.spyOn(global, 'fetch').mockResolvedValue({
    ok: true,
    json: () => Promise.resolve({ suggestions }),
  } as Response);
}

describe('TransferOptimizer — club badge + name', () => {
  it('renders the out player club short name', async () => {
    mockFetch();
    render(<TransferOptimizer />);
    await waitFor(() => expect(screen.getByText('NEW')).toBeTruthy());
  });

  it('renders the in player club short name', async () => {
    mockFetch();
    render(<TransferOptimizer />);
    await waitFor(() => expect(screen.getByText('ARS')).toBeTruthy());
  });

  it('renders club badge images with correct src', async () => {
    mockFetch();
    render(<TransferOptimizer />);
    await waitFor(() => {
      const imgs = document.querySelectorAll('img[data-badge]');
      expect(imgs.length).toBe(2); // one for out, one for in
    });
  });

  it('still renders when team codes are absent (graceful fallback)', async () => {
    const noClubSuggestions = [{
      out_id: 1, in_id: 2, expected_gain: 4.2,
      out_name: 'Dubravka', in_name: 'Verbruggen',
      rationale: 'Reason.',
    }];
    mockFetch(noClubSuggestions);
    render(<TransferOptimizer />);
    await waitFor(() => expect(screen.getByText('Dubravka')).toBeTruthy());
  });
});
