import { describe, it, expect } from 'vitest';
import {
  ALL_PANEL_KEYS,
  PLANNING_DEFAULT_ORDER,
  LIVE_DEFAULT_ORDER,
  mergeOrder,
  extractPanelOrders,
  buildPanelOrderPayload,
  moveItem,
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
    const saved = ['gwLive'];
    const result = mergeOrder(saved, PLANNING_DEFAULT_ORDER);
    expect(result).toHaveLength(PLANNING_DEFAULT_ORDER.length);
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
    const result = mergeOrder(['unknownKey', 'gwLive'], PLANNING_DEFAULT_ORDER);
    expect(result[0]).toBe('gwLive');
    expect(result).toHaveLength(PLANNING_DEFAULT_ORDER.length);
  });
});

describe('extractPanelOrders', () => {
  it('returns empty arrays when raw is null', () => {
    const { planningOrder, liveOrder } = extractPanelOrders(null);
    expect(planningOrder).toEqual([]);
    expect(liveOrder).toEqual([]);
  });

  it('returns empty arrays when raw has no order keys', () => {
    const { planningOrder, liveOrder } = extractPanelOrders({ captaincyAdviser: true });
    expect(planningOrder).toEqual([]);
    expect(liveOrder).toEqual([]);
  });

  it('extracts planning_panel_order from raw JSONB', () => {
    const raw = { planning_panel_order: ['livePoints', 'squadPitch'] };
    const { planningOrder } = extractPanelOrders(raw);
    expect(planningOrder).toEqual(['livePoints', 'squadPitch']);
  });

  it('extracts live_panel_order from raw JSONB', () => {
    const raw = { live_panel_order: ['squadPitch', 'livePoints'] };
    const { liveOrder } = extractPanelOrders(raw);
    expect(liveOrder).toEqual(['squadPitch', 'livePoints']);
  });

  it('returns empty array when order value is not an array', () => {
    const raw = { planning_panel_order: 'not-an-array' };
    const { planningOrder } = extractPanelOrders(raw);
    expect(planningOrder).toEqual([]);
  });
});

describe('buildPanelOrderPayload', () => {
  it('merges prefs with both order arrays', () => {
    const prefs = { captaincyAdviser: true };
    const planning = ['livePoints'];
    const live = ['squadPitch'];
    const result = buildPanelOrderPayload(prefs, planning, live);
    expect(result).toMatchObject({
      captaincyAdviser: true,
      planning_panel_order: ['livePoints'],
      live_panel_order: ['squadPitch'],
    });
  });

  it('uses empty arrays when orders are not provided', () => {
    const result = buildPanelOrderPayload({ livePoints: true });
    expect(result.planning_panel_order).toEqual([]);
    expect(result.live_panel_order).toEqual([]);
  });
});

describe('moveItem', () => {
  it('moves an item up in the array', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 'up')).toEqual(['b', 'a', 'c']);
  });

  it('moves an item down in the array', () => {
    expect(moveItem(['a', 'b', 'c'], 1, 'down')).toEqual(['a', 'c', 'b']);
  });

  it('does nothing when moving the first item up', () => {
    expect(moveItem(['a', 'b', 'c'], 0, 'up')).toEqual(['a', 'b', 'c']);
  });

  it('does nothing when moving the last item down', () => {
    expect(moveItem(['a', 'b', 'c'], 2, 'down')).toEqual(['a', 'b', 'c']);
  });

  it('returns a new array (immutable)', () => {
    const arr = ['a', 'b', 'c'];
    const result = moveItem(arr, 0, 'down');
    expect(result).not.toBe(arr);
  });
});
