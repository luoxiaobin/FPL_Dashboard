import { describe, it, expect } from 'vitest';
import {
  ALL_PANEL_KEYS,
  PLANNING_DEFAULT_ORDER,
  LIVE_DEFAULT_ORDER,
  mergeOrder,
} from './panelOrder';

describe('ALL_PANEL_KEYS', () => {
  it('contains at least 13 keys', () => {
    expect(ALL_PANEL_KEYS.length).toBeGreaterThanOrEqual(13);
  });
});

describe('mergeOrder', () => {
  it('returns default when saved is empty', () => {
    expect(mergeOrder([], PLANNING_DEFAULT_ORDER)).toEqual(PLANNING_DEFAULT_ORDER);
  });

  it('returns default when saved is empty for live mode', () => {
    expect(mergeOrder([], LIVE_DEFAULT_ORDER)).toEqual(LIVE_DEFAULT_ORDER);
  });

  it('places saved keys first in saved order', () => {
    const saved = ['livePoints', 'squadPitch'];
    const result = mergeOrder(saved, PLANNING_DEFAULT_ORDER);
    expect(result[0]).toBe('livePoints');
    expect(result[1]).toBe('squadPitch');
  });

  it('appends default keys missing from saved', () => {
    const saved = ['livePoints'];
    const result = mergeOrder(saved, PLANNING_DEFAULT_ORDER);
    expect(result).toHaveLength(ALL_PANEL_KEYS.length);
  });

  it('result contains every panel key exactly once', () => {
    const saved = ['livePoints', 'squadPitch'];
    const result = mergeOrder(saved, PLANNING_DEFAULT_ORDER);
    const unique = new Set(result);
    expect(unique.size).toBe(result.length);
    expect(result).toHaveLength(ALL_PANEL_KEYS.length);
  });

  it('ignores unknown keys in saved array', () => {
    const result = mergeOrder(['unknownKey'], PLANNING_DEFAULT_ORDER);
    expect(result).toEqual(PLANNING_DEFAULT_ORDER);
  });

  it('ignores unknown keys but still includes valid saved keys', () => {
    const result = mergeOrder(['unknownKey', 'livePoints'], PLANNING_DEFAULT_ORDER);
    expect(result[0]).toBe('livePoints');
    expect(result).toHaveLength(ALL_PANEL_KEYS.length);
  });
});
