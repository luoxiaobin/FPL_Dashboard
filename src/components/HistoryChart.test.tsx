import { describe, it, expect, vi, afterEach, beforeAll } from 'vitest';
import { render, screen, waitFor, cleanup } from '@testing-library/react';
import HistoryChart from './HistoryChart';

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

// recharts ResponsiveContainer uses ResizeObserver
beforeAll(() => {
  global.ResizeObserver = class {
    observe() {}
    unobserve() {}
    disconnect() {}
  };
});

const mockHistory = {
  current: [
    {
      event: 1, points: 72, total_points: 72, overall_rank: 234567,
      rank: 234567, bank: 21, value: 1000, avg_points: 60,
    },
  ],
  chips: [],
};

const mockSummary = {
  trend: 'Stable',
  total_value: '100.0',
  available_chips: [],
};

describe('HistoryChart — scroll wrapper', () => {
  it('shows loading text initially', () => {
    vi.spyOn(global, 'fetch').mockReturnValue(new Promise(() => {}));
    render(<HistoryChart />);
    expect(screen.getByText('Loading Trajectory...')).toBeTruthy();
  });

  it('renders chart scroll wrapper when data is loaded', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const u = url.toString();
      if (u.includes('/history')) {
        return Promise.resolve({ json: () => Promise.resolve(mockHistory) } as Response);
      }
      return Promise.resolve({ json: () => Promise.resolve(mockSummary) } as Response);
    });
    render(<HistoryChart />);
    await waitFor(() =>
      expect(screen.getByTestId('history-chart-scroll')).toBeTruthy()
    );
  });

  it('chart scroll wrapper contains the chart container', async () => {
    vi.spyOn(global, 'fetch').mockImplementation((url: RequestInfo | URL) => {
      const u = url.toString();
      if (u.includes('/history')) {
        return Promise.resolve({ json: () => Promise.resolve(mockHistory) } as Response);
      }
      return Promise.resolve({ json: () => Promise.resolve(mockSummary) } as Response);
    });
    render(<HistoryChart />);
    await waitFor(() => {
      const scroll = screen.getByTestId('history-chart-scroll');
      expect(scroll.querySelector('[data-testid="history-chart-container"]')).toBeTruthy();
    });
  });
});
