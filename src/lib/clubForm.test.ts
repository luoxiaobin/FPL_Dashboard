import { describe, it, expect } from 'vitest';
import { buildClubFormMap } from './clubForm';

function fix(h: number, a: number, hScore: number, aScore: number, event = 1) {
  return { team_h: h, team_a: a, team_h_score: hScore, team_a_score: aScore, event };
}

describe('buildClubFormMap', () => {
  it('returns W for home win, L for away team', () => {
    const map = buildClubFormMap([fix(1, 2, 2, 0)], [{ id: 1 }, { id: 2 }]);
    expect(map.get(1)).toBe('W');
    expect(map.get(2)).toBe('L');
  });

  it('returns L for home loss, W for away team', () => {
    const map = buildClubFormMap([fix(1, 2, 0, 3)], [{ id: 1 }, { id: 2 }]);
    expect(map.get(1)).toBe('L');
    expect(map.get(2)).toBe('W');
  });

  it('returns D for both teams on a draw', () => {
    const map = buildClubFormMap([fix(1, 2, 1, 1)], [{ id: 1 }, { id: 2 }]);
    expect(map.get(1)).toBe('D');
    expect(map.get(2)).toBe('D');
  });

  it('orders form oldest-to-most-recent', () => {
    const fixtures = [
      fix(1, 2, 1, 0, 1), // event 1 → W for team 1
      fix(2, 1, 3, 0, 2), // event 2 → L for team 1 (away)
      fix(1, 2, 0, 0, 3), // event 3 → D for team 1
    ];
    const map = buildClubFormMap(fixtures, [{ id: 1 }]);
    expect(map.get(1)).toBe('WLD');
  });

  it('caps form at the 5 most recent fixtures', () => {
    // 7 fixtures: first 2 are wins (events 1-2), rest are draws (events 3-7)
    const fixtures = Array.from({ length: 7 }, (_, i) =>
      fix(1, 2, i < 2 ? 1 : 0, 0, i + 1)
    );
    const map = buildClubFormMap(fixtures, [{ id: 1 }]);
    const form = map.get(1)!;
    expect(form).toHaveLength(5);
    // Most recent 5 are events 3-7, all draws (score 0-0)
    expect(form).toBe('DDDDD');
  });

  it('returns empty string for a team with no fixtures', () => {
    const map = buildClubFormMap([], [{ id: 1 }]);
    expect(map.get(1)).toBe('');
  });

  it('ignores fixtures that do not involve the team', () => {
    // Only team 1 vs team 2, asking about team 3
    const map = buildClubFormMap([fix(1, 2, 1, 0)], [{ id: 3 }]);
    expect(map.get(3)).toBe('');
  });

  it('handles multiple teams in a single call', () => {
    const fixtures = [
      fix(1, 2, 1, 0, 1), // team 1 W, team 2 L
      fix(2, 3, 2, 2, 2), // team 2 D, team 3 D
    ];
    const map = buildClubFormMap(fixtures, [{ id: 1 }, { id: 2 }, { id: 3 }]);
    expect(map.get(1)).toBe('W');
    expect(map.get(2)).toBe('LD');
    expect(map.get(3)).toBe('D');
  });
});
