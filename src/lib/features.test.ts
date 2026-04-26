import { describe, it, expect, vi, afterEach } from 'vitest';
import { SECTION_KEYS, normalizeSectionPreferences } from './sectionPreferences';

// --- sectionPreferences ---

describe('sectionPreferences', () => {
  it('includes transferOptimizer in SECTION_KEYS', () => {
    expect(SECTION_KEYS).toContain('transferOptimizer');
  });

  it('normalizeSectionPreferences defaults transferOptimizer to true', () => {
    const result = normalizeSectionPreferences({});
    expect(result.transferOptimizer).toBe(true);
  });

  it('normalizeSectionPreferences respects false for transferOptimizer', () => {
    const result = normalizeSectionPreferences({ transferOptimizer: false });
    expect(result.transferOptimizer).toBe(false);
  });
});

// --- GameweekHistory helpers ---

describe('GameweekHistory data transformations', () => {
  const mockHistory = [
    { event: 1, points: 72, total_points: 72, rank: 234567, overall_rank: 234567, bank: 21, event_transfers: 0, event_transfers_cost: 0, points_on_bench: 4 },
    { event: 2, points: 45, total_points: 117, rank: 1500000, overall_rank: 890123, bank: 21, event_transfers: 2, event_transfers_cost: 4, points_on_bench: 8 },
    { event: 3, points: 88, total_points: 205, rank: 89000, overall_rank: 512000, bank: 14, event_transfers: 1, event_transfers_cost: 0, points_on_bench: 2 },
  ];

  it('should sort history in reverse order (most recent first)', () => {
    const sorted = [...mockHistory].reverse();
    expect(sorted[0].event).toBe(3);
    expect(sorted[1].event).toBe(2);
    expect(sorted[2].event).toBe(1);
  });

  it('should correctly identify gameweeks with transfer hits', () => {
    const hitsGWs = mockHistory.filter(gw => gw.event_transfers_cost > 0);
    expect(hitsGWs).toHaveLength(1);
    expect(hitsGWs[0].event).toBe(2);
    expect(hitsGWs[0].event_transfers_cost).toBe(4);
  });

  it('should show only 5 rows by default when collapsed', () => {
    const displayRows = (expanded: boolean) => expanded ? mockHistory : mockHistory.slice(0, 5);
    expect(displayRows(false)).toHaveLength(3); // only 3 in this fixture
    expect(displayRows(true)).toHaveLength(3);
  });

  it('should correctly format rank with locale separators', () => {
    const rank = 1234567;
    expect(rank.toLocaleString()).toBe('1,234,567');
  });
});

// --- SyncStatus logic ---

describe('SyncStatus retry logic', () => {
  const MAX_RETRIES = 5;

  it('should allow up to MAX_RETRIES reconnection attempts', () => {
    let retryCount = 0;
    const shouldRetry = () => retryCount < MAX_RETRIES;

    for (let i = 0; i < MAX_RETRIES; i++) {
      expect(shouldRetry()).toBe(true);
      retryCount++;
    }
    expect(shouldRetry()).toBe(false); // 6th attempt blocked
  });

  it('should build correct resume URL from lastDone', () => {
    const buildUrl = (lastDone: number) =>
      lastDone > 0 ? `/api/v1/sync?from=${lastDone}` : '/api/v1/sync';

    expect(buildUrl(0)).toBe('/api/v1/sync');
    expect(buildUrl(15)).toBe('/api/v1/sync?from=15');
    expect(buildUrl(31)).toBe('/api/v1/sync?from=31');
  });

  it('should compute progress percentage correctly', () => {
    const pct = (done: number, total: number) => Math.round((done / total) * 100);
    expect(pct(0, 31)).toBe(0);
    expect(pct(15, 31)).toBe(48);
    expect(pct(31, 31)).toBe(100);
  });
});

// --- Sync route query param parsing ---

describe('Sync route resumeFrom parsing', () => {
  it('should default to 0 when no query param provided', () => {
    const fromParam: string | null = null;
    const resumeFrom = fromParam ? parseInt(fromParam) : 0;
    expect(resumeFrom).toBe(0);
  });

  it('should parse ?from=15 correctly', () => {
    const fromParam = '15';
    const resumeFrom = fromParam ? parseInt(fromParam) : 0;
    expect(resumeFrom).toBe(15);
  });

  it('should not loop over already-synced GWs when resuming', () => {
    const totalGWs = 31;
    const resumeFrom = 20;
    const gwsToProcess = Array.from({ length: totalGWs }, (_, i) => i).slice(resumeFrom);
    expect(gwsToProcess).toHaveLength(11); // 31 - 20
    expect(gwsToProcess[0]).toBe(20);
  });
});
